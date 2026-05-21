-- =============================================================================
-- MIGRATION: Add wallet reservation RPC functions
-- =============================================================================
-- Date: 2026-05-18
-- Purpose: Reserve wallet credits before paid external work starts, then settle
-- the reservation after the real cost is known.
--
-- CONTEXT:
-- A normal balance check before Apify is not enough. Two browser tabs can both
-- pass the check, both run Apify, and only one final deduction may succeed. These
-- RPCs move the expensive-work gate to an atomic wallet reservation.
--
-- MUST BE RUN BEFORE deploying the corresponding code changes.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Reserve wallet credits atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_wallet_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_action_type TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, reservation_id TEXT, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_balance INTEGER;
  v_current_purchased INTEGER;
  v_new_balance INTEGER;
  v_new_purchased INTEGER;
  v_reserved_purchased INTEGER;
  v_reservation_id TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, 0, NULL::TEXT, 'Amount must be positive'::TEXT;
    RETURN;
  END IF;

  SELECT wallet_balance, purchased_credits
  INTO v_current_balance, v_current_purchased
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, NULL::TEXT, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::TEXT, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;
  v_new_purchased := LEAST(v_current_purchased, v_new_balance);
  v_reserved_purchased := v_current_purchased - v_new_purchased;

  UPDATE users
  SET wallet_balance = v_new_balance,
      purchased_credits = v_new_purchased,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO wallet_transactions (
    user_id,
    amount,
    balance_after,
    type,
    reason,
    action_type,
    metadata,
    created_at
  )
  VALUES (
    p_user_id,
    -p_amount,
    v_new_balance,
    'debit',
    COALESCE(p_reason, 'Wallet credit reservation'),
    p_action_type,
    COALESCE(p_metadata, '{}'::JSONB) || jsonb_build_object(
      'reservationStatus', 'reserved',
      'reservedAmount', p_amount,
      'reservedPurchased', v_reserved_purchased,
      'reservedAt', NOW()
    ),
    NOW()
  )
  RETURNING id::TEXT INTO v_reservation_id;

  RETURN QUERY SELECT true, v_new_balance, v_reservation_id, NULL::TEXT;
END;
$$;


-- ---------------------------------------------------------------------------
-- STEP 2: Settle a wallet reservation atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION settle_wallet_reservation(
  p_user_id TEXT,
  p_reservation_id TEXT,
  p_actual_amount INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, refund_amount INTEGER, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tx RECORD;
  v_current_balance INTEGER;
  v_current_purchased INTEGER;
  v_reserved_amount INTEGER;
  v_reserved_purchased INTEGER;
  v_refund_amount INTEGER;
  v_restore_purchased INTEGER;
  v_new_balance INTEGER;
  v_new_purchased INTEGER;
BEGIN
  IF p_actual_amount < 0 THEN
    RETURN QUERY SELECT false, 0, 0, 'Actual amount must be zero or positive'::TEXT;
    RETURN;
  END IF;

  SELECT *
  INTO v_tx
  FROM wallet_transactions
  WHERE id::TEXT = p_reservation_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'Reservation not found'::TEXT;
    RETURN;
  END IF;

  IF COALESCE(v_tx.metadata->>'reservationStatus', '') <> 'reserved' THEN
    SELECT wallet_balance INTO v_current_balance FROM users WHERE id = p_user_id;
    RETURN QUERY SELECT true, COALESCE(v_current_balance, 0), 0, NULL::TEXT;
    RETURN;
  END IF;

  v_reserved_amount := ABS(v_tx.amount);
  IF p_actual_amount > v_reserved_amount THEN
    RETURN QUERY SELECT false, 0, 0, 'Actual amount exceeds reserved amount'::TEXT;
    RETURN;
  END IF;

  SELECT wallet_balance, purchased_credits
  INTO v_current_balance, v_current_purchased
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  v_refund_amount := v_reserved_amount - p_actual_amount;
  v_reserved_purchased := COALESCE((v_tx.metadata->>'reservedPurchased')::INTEGER, 0);
  v_restore_purchased := LEAST(v_reserved_purchased, v_refund_amount);
  v_new_balance := v_current_balance + v_refund_amount;
  v_new_purchased := LEAST(v_new_balance, v_current_purchased + v_restore_purchased);

  UPDATE users
  SET wallet_balance = v_new_balance,
      purchased_credits = v_new_purchased,
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE wallet_transactions
  SET metadata = v_tx.metadata || COALESCE(p_metadata, '{}'::JSONB) || jsonb_build_object(
    'reservationStatus', 'settled',
    'actualAmount', p_actual_amount,
    'refundAmount', v_refund_amount,
    'settledAt', NOW()
  )
  WHERE id::TEXT = p_reservation_id;

  IF v_refund_amount > 0 THEN
    INSERT INTO wallet_transactions (
      user_id,
      amount,
      balance_after,
      type,
      reason,
      action_type,
      metadata,
      created_at
    )
    VALUES (
      p_user_id,
      v_refund_amount,
      v_new_balance,
      'credit',
      'Unused reserved credits refunded',
      v_tx.action_type,
      jsonb_build_object(
        'reservationId', p_reservation_id,
        'reservationRefund', true,
        'actualAmount', p_actual_amount,
        'refundAmount', v_refund_amount
      ),
      NOW()
    );
  END IF;

  RETURN QUERY SELECT true, v_new_balance, v_refund_amount, NULL::TEXT;
END;
$$;


-- ---------------------------------------------------------------------------
-- STEP 3: Release abandoned reservations
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_expired_wallet_reservations(
  p_user_id TEXT,
  p_older_than_minutes INTEGER DEFAULT 120
)
RETURNS TABLE(released_count INTEGER, refunded_amount INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tx RECORD;
  v_result RECORD;
  v_released_count INTEGER := 0;
  v_refunded_amount INTEGER := 0;
BEGIN
  -- Reservation cleanup - 2026-05-18 15:28 IST, paras: abandoned Apify flows should not hold wallet credits forever.
  FOR v_tx IN
    SELECT id::TEXT AS reservation_id, amount
    FROM wallet_transactions
    WHERE user_id = p_user_id
      AND COALESCE(metadata->>'reservationStatus', '') = 'reserved'
      AND created_at < NOW() - make_interval(mins => p_older_than_minutes)
    ORDER BY created_at ASC
  LOOP
    SELECT *
    INTO v_result
    FROM settle_wallet_reservation(
      p_user_id,
      v_tx.reservation_id,
      0,
      jsonb_build_object('releaseReason', 'expired_reservation')
    );

    IF v_result.success THEN
      v_released_count := v_released_count + 1;
      v_refunded_amount := v_refunded_amount + v_result.refund_amount;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_released_count, v_refunded_amount;
END;
$$;


-- ---------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ---------------------------------------------------------------------------
-- SELECT proname FROM pg_proc
-- WHERE proname IN (
--   'reserve_wallet_credits',
--   'settle_wallet_reservation',
--   'release_expired_wallet_reservations'
-- );
