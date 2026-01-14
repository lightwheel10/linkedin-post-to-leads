// =============================================================================
// DODO PAYMENTS WEBHOOK HANDLER
// =============================================================================
//
// This endpoint receives webhook events from Dodo Payments and processes them
// for the wallet-based billing system.
//
// WALLET-BASED BILLING MODEL:
// ===========================
// - Users subscribe to plans: Pro ($79), Growth ($179), Scale ($279)
// - Each billing cycle, wallet is RESET to plan's credit amount
// - Users spend credits on actions throughout the month
// - Unused credits are FORFEITED at end of billing cycle (no rollover)
//
// CREDIT ALLOCATION PER PLAN:
// ===========================
// | Plan   | Price   | Wallet Credits | Breakdown              |
// |--------|---------|----------------|------------------------|
// | Pro    | $79/mo  | $150           | $100 base + $50 bonus  |
// | Growth | $179/mo | $300           | $200 base + $100 bonus |
// | Scale  | $279/mo | $500           | $300 base + $200 bonus |
//
// WEBHOOK EVENTS HANDLED:
// =======================
// - payment.succeeded: Reset wallet credits for new billing cycle
// - payment.failed: Mark subscription as past_due
// - subscription.created: Initialize wallet with plan credits
// - subscription.updated: Update plan and wallet credits if changed
// - subscription.cancelled: Keep wallet until period ends
// - subscription.expired: Clear wallet and downgrade to free
// - subscription.renewed: Alias for payment.succeeded
//
// CRITICAL SECURITY REQUIREMENTS:
// ===============================
// 1. Always verify webhook signatures before processing
// 2. Always validate timestamps to prevent replay attacks
// 3. Use idempotency - handle duplicate events gracefully
// 4. Never expose internal errors to the webhook caller
//
// Created: 2nd January 2026
// Last Updated: 2nd January 2026 - Wallet-based billing model
//
// UPDATE (2nd Jan 2026) - Checkout Session Completion:
// =====================================================
// Added logic to mark checkout_sessions as 'completed' when payment succeeds.
// This is CRITICAL for the secure checkout flow:
// - The callback page polls /api/checkout/status to check payment status
// - ONLY this webhook can mark a session as 'completed' (security)
// - This ensures we never trust URL params for payment verification
// - Also marks onboarding as complete when payment succeeds
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  verifyWebhookSignature,
  isWebhookTimestampValid,
  DodoWebhookPayload,
  DodoWebhookEvents,
  mapDodoSubscriptionStatus,
  getPlanFromDodoProductId,
} from '@/lib/dodo';
import {
  resetWalletCredits,
  clearWalletBalance,
  WalletPlanId,
  isWalletPlan,
  formatCredits,
  WALLET_PLANS,
} from '@/lib/wallet';
import { completeOnboarding } from '@/lib/data-store';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Disable body parsing - we need the raw body for signature verification.
 * Next.js App Router handles this automatically.
 */
export const runtime = 'nodejs';

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

/**
 * POST /api/webhooks/dodo
 *
 * Handles incoming webhook events from Dodo Payments.
 * This endpoint is called by Dodo's servers whenever a payment event occurs.
 *
 * THE CRITICAL FLOW:
 * 1. User subscribes → subscription.created → Initialize wallet
 * 2. Payment succeeds → payment.succeeded → RESET wallet to plan credits
 * 3. Payment fails → payment.failed → Mark as past_due
 * 4. User cancels → subscription.cancelled → Keep wallet until period ends
 * 5. Period ends → subscription.expired → Clear wallet, downgrade to free
 *
 * Security measures implemented:
 * 1. Signature verification using HMAC-SHA256
 * 2. Timestamp validation to prevent replay attacks
 * 3. Idempotent processing using event IDs
 * 4. Proper error handling without exposing internals
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // =========================================================================
    // STEP 1: Extract headers and body
    // =========================================================================
    const signature = request.headers.get('webhook-signature') ||
                      request.headers.get('x-webhook-signature') || '';
    const timestamp = request.headers.get('webhook-timestamp') ||
                      request.headers.get('x-webhook-timestamp') || '';
    const webhookId = request.headers.get('webhook-id') ||
                      request.headers.get('x-webhook-id') || '';

    // Get raw body for signature verification
    const rawBody = await request.text();

    // DEBUG: Log all headers and signature info to diagnose verification issue
    console.log('[Dodo Webhook] DEBUG - Headers received:', {
      signature: signature ? `${signature.substring(0, 20)}...` : 'MISSING',
      signatureLength: signature?.length,
      timestamp,
      webhookId: webhookId || 'MISSING',
      allHeaders: Object.fromEntries(request.headers.entries()),
    });

    if (!rawBody) {
      console.error('[Dodo Webhook] Empty request body');
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 2: Validate timestamp (prevent replay attacks)
    // =========================================================================
    // Replay attacks occur when an attacker captures a valid webhook and
    // resends it later. By validating the timestamp, we ensure the webhook
    // was sent recently (within 5 minutes).
    // =========================================================================
    if (timestamp && !isWebhookTimestampValid(timestamp)) {
      console.error('[Dodo Webhook] Invalid or expired timestamp');
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 401 }
      );
    }

    // =========================================================================
    // STEP 3: Verify webhook signature
    // =========================================================================
    // The signature is computed as: HMAC-SHA256(secret, timestamp + "." + body)
    // This ensures the webhook came from Dodo and wasn't tampered with.
    // =========================================================================
    if (signature) {
      const isValid = await verifyWebhookSignature(rawBody, signature, timestamp, webhookId);

      if (!isValid) {
        console.error('[Dodo Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      // In production, ALWAYS require signatures
      if (process.env.NODE_ENV === 'production') {
        console.error('[Dodo Webhook] Missing signature in production');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }
      console.warn('[Dodo Webhook] Processing unsigned webhook (dev mode)');
    }

    // =========================================================================
    // STEP 4: Parse the webhook payload
    // =========================================================================
    let payload: DodoWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[Dodo Webhook] Failed to parse JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { event_type, event_id, data } = payload;

    console.log('[Dodo Webhook] Received event:', {
      type: event_type,
      eventId: event_id,
      customerId: data?.customer_id,
      subscriptionId: data?.subscription_id,
      productId: data?.product_id,
    });

    // =========================================================================
    // STEP 5: Check for duplicate events (idempotency)
    // =========================================================================
    // Dodo may send the same event multiple times (retries, network issues).
    // We use the event_id to ensure we only process each event once.
    // =========================================================================
    const supabase = await createClient();

    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', event_id)
      .single();

    if (existingEvent) {
      console.log('[Dodo Webhook] Duplicate event, skipping:', event_id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // =========================================================================
    // STEP 6: Process the event
    // =========================================================================
    let processingResult: { success: boolean; message?: string } = { success: true };

    switch (event_type) {
      // -----------------------------------------------------------------------
      // PAYMENT EVENTS
      // -----------------------------------------------------------------------
      case DodoWebhookEvents.PAYMENT_SUCCEEDED:
        // THIS IS THE KEY EVENT FOR WALLET RESETS
        // Every time a payment succeeds (initial or renewal), we reset the wallet
        processingResult = await handlePaymentSucceeded(data);
        break;

      case DodoWebhookEvents.PAYMENT_FAILED:
        processingResult = await handlePaymentFailed(data);
        break;

      // -----------------------------------------------------------------------
      // SUBSCRIPTION LIFECYCLE EVENTS
      // -----------------------------------------------------------------------
      case DodoWebhookEvents.SUBSCRIPTION_CREATED:
        // Initial subscription - wallet is set up by handlePaymentSucceeded
        processingResult = await handleSubscriptionCreated(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_UPDATED:
        processingResult = await handleSubscriptionUpdated(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_CANCELLED:
        // User cancelled - they keep wallet credits until period ends
        processingResult = await handleSubscriptionCancelled(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_EXPIRED:
        // Period ended without renewal - CLEAR wallet and downgrade
        processingResult = await handleSubscriptionExpired(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_RENEWED:
        // Renewal is essentially a successful payment
        // handlePaymentSucceeded already resets the wallet
        processingResult = await handleSubscriptionRenewed(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_TRIAL_ENDING:
        processingResult = await handleTrialEnding(data);
        break;

      default:
        console.log('[Dodo Webhook] Unhandled event type:', event_type);
        // Still return 200 - we don't want Dodo to retry for unhandled events
    }

    // =========================================================================
    // STEP 7: Record the processed event (for idempotency)
    // =========================================================================
    await supabase.from('webhook_events').insert({
      event_id,
      event_type,
      payload: data,
      processed_at: new Date().toISOString(),
      processing_result: processingResult,
    });

    const duration = Date.now() - startTime;
    console.log('[Dodo Webhook] Event processed:', {
      eventId: event_id,
      type: event_type,
      duration: `${duration}ms`,
      success: processingResult.success,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Dodo Webhook] Unhandled error:', error);

    // Return generic error - don't expose internal details
    // Return 500 to trigger Dodo retry (for transient failures)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handles successful payment events.
 *
 * THIS IS THE MOST IMPORTANT HANDLER FOR THE WALLET SYSTEM.
 *
 * When a payment succeeds (either initial or recurring), we:
 * 1. Find the user by their Dodo customer ID
 * 2. Determine their plan from the product ID
 * 3. RESET their wallet to the plan's credit amount (unused credits are lost)
 * 4. Update the subscription status to active
 *
 * CREDIT RESET BEHAVIOR:
 * - Previous balance is FORFEITED (logged for transparency)
 * - New balance is set to plan's total credits
 * - Example: Pro plan → wallet reset to $150 (15000 cents)
 */
async function handlePaymentSucceeded(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id, product_id, payment_id } = data;

  try {
    console.log('[Dodo Webhook] Payment succeeded:', {
      payment_id,
      subscription_id,
      product_id,
    });

    // -------------------------------------------------------------------------
    // Step 1: Find the user by their Dodo customer ID
    // -------------------------------------------------------------------------
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, wallet_balance, plan')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (userError || !user) {
      console.error('[Dodo Webhook] User not found for customer:', customer_id);
      return { success: false, message: 'User not found' };
    }

    // -------------------------------------------------------------------------
    // Step 2: Determine the plan from the product ID
    // -------------------------------------------------------------------------
    const planId = getPlanFromDodoProductId(product_id || '');

    if (!planId || !isWalletPlan(planId)) {
      console.error('[Dodo Webhook] Invalid or unknown product:', product_id);
      return { success: false, message: 'Unknown product' };
    }

    // -------------------------------------------------------------------------
    // Step 3: RESET wallet credits to plan amount
    // -------------------------------------------------------------------------
    // This is the key operation - we REPLACE the balance, not add to it.
    // Any unused credits from the previous period are forfeited.
    // -------------------------------------------------------------------------
    const previousBalance = user.wallet_balance || 0;
    const planConfig = WALLET_PLANS[planId];

    const walletResult = await resetWalletCredits(user.id, planId);

    if (!walletResult.success) {
      console.error('[Dodo Webhook] Failed to reset wallet:', walletResult.error);
      return { success: false, message: walletResult.error };
    }

    console.log('[Dodo Webhook] Wallet reset:', {
      userId: user.id,
      planId,
      previousBalance: formatCredits(previousBalance),
      newBalance: formatCredits(walletResult.newBalance),
      forfeited: formatCredits(previousBalance),
    });

    // -------------------------------------------------------------------------
    // Step 4: Update subscription status to active
    // -------------------------------------------------------------------------
    if (subscription_id) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // Monthly billing

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan: planId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('dodo_subscription_id', subscription_id);
    }

    // -------------------------------------------------------------------------
    // Step 5: Mark checkout session as completed (NEW - 2nd Jan 2026)
    // -------------------------------------------------------------------------
    // This is CRITICAL for the secure checkout flow.
    // The callback page polls /api/checkout/status which checks this table.
    // ONLY this webhook can mark status='completed' - this is the security model.
    // We also complete onboarding here since payment success = onboarding done.
    // -------------------------------------------------------------------------

    // Try to find the checkout session for this user that's still pending
    // We use user_id since the webhook might not have the exact session_id
    const { data: pendingSession } = await supabase
      .from('checkout_sessions')
      .select('id, session_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingSession) {
      // Mark the checkout session as completed
      await supabase
        .from('checkout_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          dodo_subscription_id: subscription_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingSession.id);

      console.log('[Dodo Webhook] Marked checkout session as completed:', {
        sessionId: pendingSession.session_id,
        userId: user.id,
      });

      // Complete onboarding for this user
      // This sets onboarding_completed = true so they go to dashboard on next login
      try {
        await completeOnboarding(user.email);
        console.log('[Dodo Webhook] Onboarding completed for:', user.email);
      } catch (onboardingErr) {
        console.error('[Dodo Webhook] Failed to complete onboarding:', onboardingErr);
        // Don't fail the webhook - user can still complete onboarding via callback
      }
    } else {
      console.log('[Dodo Webhook] No pending checkout session found for user:', user.id);
      // This is OK - might be a renewal payment, not initial checkout
    }

    // -------------------------------------------------------------------------
    // Step 6: Log the payment for analytics
    // -------------------------------------------------------------------------
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'payment_succeeded',
      metadata: {
        plan: planId,
        payment_id,
        subscription_id,
        credits_allocated: planConfig.totalCredits,
        credits_forfeited: previousBalance,
        checkout_session_completed: !!pendingSession,
      },
      created_at: new Date().toISOString(),
    });

    return { success: true, message: `Wallet reset to ${formatCredits(walletResult.newBalance)}` };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling payment.succeeded:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles failed payment events.
 *
 * When a payment fails (e.g., card declined), we:
 * 1. Mark the subscription as past_due
 * 2. The user KEEPS their remaining wallet credits
 * 3. They can still use credits until they run out
 * 4. After a grace period, Dodo will send subscription.expired
 *
 * NOTE: We don't immediately revoke access on payment failure.
 * This gives users time to update their payment method.
 */
async function handlePaymentFailed(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Payment failed:', { subscription_id });

    // -------------------------------------------------------------------------
    // Mark subscription as past_due (not immediately cancelled)
    // -------------------------------------------------------------------------
    if (subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('dodo_subscription_id', subscription_id);
    }

    // -------------------------------------------------------------------------
    // Find user for logging/notification
    // -------------------------------------------------------------------------
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (user) {
      // Log the failure
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        action: 'payment_failed',
        metadata: { subscription_id },
        created_at: new Date().toISOString(),
      });

      // TODO: Send email notification about failed payment
      // This would integrate with your email service (Resend, SendGrid, etc.)
      console.log('[Dodo Webhook] Should notify user about failed payment:', user.email);
    }

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling payment.failed:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles new subscription creation.
 *
 * When a subscription is created:
 * 1. We record the subscription in our database
 * 2. The wallet is NOT set here - it's set by handlePaymentSucceeded
 *    (which fires right after subscription.created)
 *
 * NOTE: The initial payment.succeeded webhook handles wallet setup.
 * This handler just ensures the subscription record exists.
 */
async function handleSubscriptionCreated(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id, product_id, status } = data;

  try {
    console.log('[Dodo Webhook] Subscription created:', {
      subscription_id,
      product_id,
      status,
    });

    // -------------------------------------------------------------------------
    // Determine plan from product ID
    // -------------------------------------------------------------------------
    const planId = getPlanFromDodoProductId(product_id || '');

    if (!planId) {
      console.warn('[Dodo Webhook] Unknown product_id:', product_id);
      return { success: true, message: 'Unknown product' };
    }

    // -------------------------------------------------------------------------
    // Find the user
    // -------------------------------------------------------------------------
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (!user) {
      console.warn('[Dodo Webhook] User not found for customer:', customer_id);
      return { success: false, message: 'User not found' };
    }

    // -------------------------------------------------------------------------
    // Create subscription record (if it doesn't exist)
    // -------------------------------------------------------------------------
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('dodo_subscription_id', subscription_id)
      .single();

    const subscriptionData = {
      user_id: user.id,
      plan: planId,
      period: 'monthly', // All wallet plans are monthly
      status: mapDodoSubscriptionStatus(status || 'active'),
      dodo_subscription_id: subscription_id,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          created_at: now.toISOString(),
        });
    }

    // NOTE: Wallet credits are set by handlePaymentSucceeded, not here

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.created:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles subscription updates.
 *
 * This is called when:
 * - User changes their plan (upgrade/downgrade)
 * - Subscription status changes
 *
 * For plan changes:
 * - If upgrading, the new payment will reset wallet to higher amount
 * - If downgrading, it typically takes effect at next billing cycle
 */
async function handleSubscriptionUpdated(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id, product_id, status } = data;

  try {
    console.log('[Dodo Webhook] Subscription updated:', {
      subscription_id,
      product_id,
      status,
    });

    // -------------------------------------------------------------------------
    // Update subscription status
    // -------------------------------------------------------------------------
    const updateData: Record<string, unknown> = {
      status: mapDodoSubscriptionStatus(status || 'active'),
      updated_at: new Date().toISOString(),
    };

    // If product changed, update the plan
    if (product_id) {
      const planId = getPlanFromDodoProductId(product_id);
      if (planId) {
        updateData.plan = planId;
      }
    }

    await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('dodo_subscription_id', subscription_id);

    // -------------------------------------------------------------------------
    // If plan changed, update user record too
    // -------------------------------------------------------------------------
    if (updateData.plan) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('dodo_customer_id', customer_id)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            plan: updateData.plan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // NOTE: Wallet is NOT reset here - that happens on next payment
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.updated:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles subscription cancellation.
 *
 * When a user cancels:
 * 1. Subscription is marked as cancelled
 * 2. User KEEPS their wallet credits until period ends
 * 3. They can continue using credits until expiration
 * 4. At period end, subscription.expired will clear the wallet
 *
 * This allows users to use what they paid for, even after cancelling.
 */
async function handleSubscriptionCancelled(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Subscription cancelled:', { subscription_id });

    // -------------------------------------------------------------------------
    // Mark subscription as cancelled (but don't clear wallet yet)
    // -------------------------------------------------------------------------
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_subscription_id', subscription_id);

    // -------------------------------------------------------------------------
    // Log for analytics
    // -------------------------------------------------------------------------
    const { data: user } = await supabase
      .from('users')
      .select('id, wallet_balance')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (user) {
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        action: 'subscription_cancelled',
        metadata: {
          subscription_id,
          remaining_credits: user.wallet_balance,
        },
        created_at: new Date().toISOString(),
      });
    }

    // NOTE: User keeps their wallet credits until period ends
    // subscription.expired event will clear the wallet

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.cancelled:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles subscription expiration.
 *
 * This is called when:
 * - A cancelled subscription reaches its period end
 * - A past_due subscription exhausts its grace period
 *
 * When a subscription expires:
 * 1. Clear the user's wallet balance (any remaining credits are lost)
 * 2. Downgrade the user to the free plan
 * 3. Mark subscription as expired
 */
async function handleSubscriptionExpired(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Subscription expired:', { subscription_id });

    // -------------------------------------------------------------------------
    // Mark subscription as expired
    // -------------------------------------------------------------------------
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_subscription_id', subscription_id);

    // -------------------------------------------------------------------------
    // Find the user and clear their wallet
    // -------------------------------------------------------------------------
    const { data: user } = await supabase
      .from('users')
      .select('id, wallet_balance')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (user) {
      // Clear wallet balance (any remaining credits are forfeited)
      const clearResult = await clearWalletBalance(
        user.id,
        'Subscription expired - remaining credits forfeited'
      );

      console.log('[Dodo Webhook] Wallet cleared:', {
        userId: user.id,
        clearedAmount: formatCredits(user.wallet_balance || 0),
      });

      // Log for analytics
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        action: 'subscription_expired',
        metadata: {
          subscription_id,
          credits_forfeited: user.wallet_balance,
        },
        created_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.expired:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles subscription renewal.
 *
 * This is similar to payment.succeeded but specific to renewals.
 * The wallet reset is handled by handlePaymentSucceeded, so this
 * handler just ensures subscription dates are updated.
 */
async function handleSubscriptionRenewed(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Subscription renewed:', { subscription_id });

    // -------------------------------------------------------------------------
    // Update subscription period dates
    // -------------------------------------------------------------------------
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('dodo_subscription_id', subscription_id);

    // NOTE: Wallet reset is handled by handlePaymentSucceeded

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.renewed:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handles trial ending notification.
 *
 * Called a few days before a trial period ends.
 * This is a good place to send reminder emails.
 */
async function handleTrialEnding(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Trial ending soon:', { subscription_id });

    // -------------------------------------------------------------------------
    // Find user for notification
    // -------------------------------------------------------------------------
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (user) {
      // TODO: Send email notification about trial ending
      // Integration with email service (Resend, SendGrid, etc.)
      console.log('[Dodo Webhook] Should notify user about trial ending:', user.email);

      await supabase.from('usage_logs').insert({
        user_id: user.id,
        action: 'trial_ending_soon',
        metadata: { subscription_id },
        created_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.trial_ending:', error);
    return { success: false, message: String(error) };
  }
}
