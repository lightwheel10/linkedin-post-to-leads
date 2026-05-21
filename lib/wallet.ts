// =============================================================================
// WALLET CREDIT SYSTEM
// =============================================================================
//
// This module manages the wallet-based credit system for Guffles.
//
// HOW THE WALLET SYSTEM WORKS:
// ============================
// 1. User subscribes to a plan (Pro $79, Growth $179, Scale $279)
// 2. On each successful payment, their wallet is RESET to plan's credit amount
// 3. User spends credits on actions (AI Search, Post Analysis, Profile Enrichment)
// 4. Unused credits are FORFEITED at the end of each billing cycle (no rollover)
//
// CREDIT ALLOCATION PER PLAN:
// ===========================
// | Plan   | Monthly Price | Base Credits | Bonus Credits | Total Credits |
// |--------|---------------|--------------|---------------|---------------|
// | Pro    | $79           | $100         | $50           | $150          |
// | Growth | $179          | $200         | $100          | $300          |
// | Scale  | $279          | $300         | $200          | $500          |
//
// CREDIT COSTS (Based on Apify costs + margin):
// ==============================================
// Credits are stored in CENTS to avoid floating point issues.
// $1.00 = 100 credits (cents)
//
// Example costs per action:
// - Post metadata scrape: 1 credit ($0.01)
// - Per reaction scraped: 1 credit ($0.01)
// - Per comment scraped: 1 credit ($0.01)
// - Profile enrichment: 5 credits ($0.05)
// - AI Search query: 10 credits ($0.10)
//
// A typical post analysis with 300 reactions + 200 comments:
// = 1 (post) + 300 (reactions) + 200 (comments) = 501 credits = $5.01
//
// IMPORTANT NOTES:
// ================
// - All credit amounts are stored in CENTS (integer) to avoid float precision issues
// - Wallet balance should not go negative; atomic RPC rejects insufficient balance
// - Reserve estimated credits BEFORE paid external work starts
// - Settle reservations after completion so unused credits are refunded
//
// Created: 2nd January 2026
// Last Updated: 2nd January 2026
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Plan IDs that support wallet credits.
 * Free has no plan allocation. Trial users receive a capped trial wallet through pro/growth/scale,
 * while free users can only spend purchased/remaining wallet balance if present.
 */
export type WalletPlanId = 'pro' | 'growth' | 'scale';

/**
 * All valid plan IDs including free tier.
 */
export type PlanId = 'free' | WalletPlanId;

/**
 * Configuration for each paid plan's wallet credits.
 * All amounts are in CENTS (100 = $1.00).
 */
export interface PlanWalletConfig {
  /** Display name for the plan */
  name: string;
  /** Monthly subscription price in cents */
  priceInCents: number;
  /** Base wallet credits in cents */
  baseCredits: number;
  /** Bonus wallet credits in cents */
  bonusCredits: number;
  /** Total wallet credits (base + bonus) in cents */
  totalCredits: number;
  /** Maximum reactions that can be scraped per post */
  reactionsPerPost: number;
  /** Maximum comments that can be scraped per post */
  commentsPerPost: number;
  /** Maximum reactions for monitored profiles */
  monitoredReactions: number;
  /** Maximum comments for monitored profiles */
  monitoredComments: number;
}

/**
 * Result of a wallet operation (credit/debit).
 */
export interface WalletOperationResult {
  success: boolean;
  /** New balance after operation (in cents) */
  newBalance: number;
  /** Error message if operation failed */
  error?: string;
}

export interface WalletReservationResult extends WalletOperationResult {
  reservationId?: string;
}

export interface WalletSettlementResult extends WalletOperationResult {
  refundAmount: number;
}

/**
 * Current wallet status for a user.
 */
export interface WalletStatus {
  /** Current balance in cents */
  balanceInCents: number;
  /** Current balance formatted as dollars (e.g., "$15.50") */
  balanceFormatted: string;
  /** User's current plan */
  plan: PlanId;
  /** When wallet was last reset (credits refreshed) */
  lastResetAt: string | null;
  /** When next reset will occur (next billing date) */
  nextResetAt: string | null;
  /** Purchased credits that persist across monthly resets (in cents) */
  purchasedCreditsInCents: number;
}

/**
 * Types of actions that consume wallet credits.
 */
export type WalletActionType =
  | 'post_analysis'      // Analyzing a LinkedIn post
  | 'profile_enrichment' // Enriching a single profile
  | 'ai_search'          // AI-powered post discovery
  | 'profile_monitoring' // Monitoring a profile for activity
  | 'email_lookup';      // Finding verified email for a lead

/**
 * Record of a wallet transaction (credit or debit).
 */
export interface WalletTransaction {
  id: string;
  userId: string;
  /** Positive = credit, Negative = debit */
  amount: number;
  /** Balance after this transaction */
  balanceAfter: number;
  /** Type of transaction */
  type: 'credit' | 'debit';
  /** Reason for the transaction */
  reason: string;
  /** Related action type (for debits) */
  actionType?: WalletActionType;
  /** Additional metadata (e.g., post URL for analysis) */
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface WalletResetOptions {
  onlyIfNeverReset?: boolean;
  idempotencyKey?: string;
  source?: string;
  allocationAmountInCents?: number;
  allocationReason?: string;
}

// =============================================================================
// PLAN CONFIGURATION
// =============================================================================
//
// This defines the wallet credits for each subscription plan.
// When pricing changes, update these values.
//
// IMPORTANT: All amounts are in CENTS to avoid floating point issues.
// =============================================================================

// Trial economics cap - 2026-05-17 19:05 IST, paras: trials get max $20 for max 7 days; full plan credits wait for paid confirmation.
export const TRIAL_PERIOD_DAYS = 7;
export const TRIAL_WALLET_CREDITS_IN_CENTS = 2000;

export const WALLET_PLANS: Record<WalletPlanId, PlanWalletConfig> = {
  pro: {
    name: 'Pro',
    priceInCents: 7900,      // $79.00
    baseCredits: 10000,      // $100.00
    bonusCredits: 5000,      // $50.00
    totalCredits: 15000,     // $150.00
    reactionsPerPost: 300,
    commentsPerPost: 200,
    monitoredReactions: 200,
    monitoredComments: 200,
  },
  growth: {
    name: 'Growth',
    priceInCents: 17900,     // $179.00
    baseCredits: 20000,      // $200.00
    bonusCredits: 10000,     // $100.00
    totalCredits: 30000,     // $300.00
    reactionsPerPost: 600,
    commentsPerPost: 400,
    monitoredReactions: 400,
    monitoredComments: 400,
  },
  scale: {
    name: 'Scale',
    priceInCents: 27900,     // $279.00
    baseCredits: 30000,      // $300.00
    bonusCredits: 20000,     // $200.00
    totalCredits: 50000,     // $500.00
    reactionsPerPost: 1000,
    commentsPerPost: 600,
    monitoredReactions: 600,
    monitoredComments: 600,
  },
};

// =============================================================================
// CREDIT COSTS PER ACTION
// =============================================================================
//
// These define how many credits (in cents) each action costs.
//
// PRICING STRATEGY:
// - We pay Apify $0.005 per result (~0.5 cents)
// - We charge users ~2x our cost for margin
// - This gives us ~50% gross margin on scraping costs
//
// IMPORTANT: These are BASE costs. Variable costs (per reaction, per comment)
// are added on top based on actual usage.
// =============================================================================

export const CREDIT_COSTS = {
  // -------------------------------------------------------------------------
  // POST ANALYSIS
  // -------------------------------------------------------------------------
  // When a user analyzes a LinkedIn post, we:
  // 1. Scrape post metadata (fixed cost)
  // 2. Scrape reactions (variable cost per reaction)
  // 3. Scrape comments (variable cost per comment)
  // -------------------------------------------------------------------------

  /** Base cost for post analysis (metadata scrape) - 1 cent */
  postAnalysisBase: 1,

  /** Cost per reaction scraped - 1 cent each */
  perReaction: 1,

  /** Cost per comment scraped - 1 cent each */
  perComment: 1,

  // -------------------------------------------------------------------------
  // PROFILE OPERATIONS
  // -------------------------------------------------------------------------

  /** Full profile enrichment (experience, education, skills, etc.) - 5 cents */
  profileEnrichment: 5,

  /** Email lookup/verification - 10 cents */
  emailLookup: 10,

  // -------------------------------------------------------------------------
  // AI FEATURES
  // -------------------------------------------------------------------------

  /** AI-powered post discovery search - 10 cents per search */
  aiSearch: 10,

  /** Profile monitoring setup (one-time) - 5 cents */
  profileMonitoringSetup: 5,

  /** Profile monitoring check (when we check for new activity) - 2 cents */
  profileMonitoringCheck: 2,
} as const;

// =============================================================================
// CREDIT PACKS (One-time purchases)
// =============================================================================
// Re-exported from lib/credit-packs.ts (which is safe for client components).
// The types and config are in a separate file because wallet.ts imports
// server-only Supabase modules that can't be bundled into client components.
// =============================================================================
export { CREDIT_PACKS, isValidCreditPack } from '@/lib/credit-packs';
export type { CreditPackId, CreditPack } from '@/lib/credit-packs';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Checks if a plan ID is a valid wallet plan (not free tier).
 *
 * @param planId - The plan ID to check
 * @returns True if the plan has wallet credits
 *
 * @example
 * isWalletPlan('pro')   // true
 * isWalletPlan('free')  // false
 */
export function isWalletPlan(planId: string): planId is WalletPlanId {
  return planId in WALLET_PLANS;
}

/**
 * Gets the wallet configuration for a plan.
 * Returns null for free tier or invalid plans.
 *
 * @param planId - The plan ID to get config for
 * @returns Plan configuration or null
 */
export function getPlanWalletConfig(planId: string): PlanWalletConfig | null {
  if (!isWalletPlan(planId)) {
    return null;
  }
  return WALLET_PLANS[planId];
}

/**
 * Formats a credit amount (in cents) as a dollar string.
 *
 * @param cents - Amount in cents
 * @returns Formatted string like "$15.50"
 *
 * @example
 * formatCredits(1550)  // "$15.50"
 * formatCredits(100)   // "$1.00"
 * formatCredits(5)     // "$0.05"
 */
export function formatCredits(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Calculates the total credit cost for a post analysis.
 *
 * This accounts for:
 * - Base cost (post metadata)
 * - Variable cost per reaction
 * - Variable cost per comment
 *
 * @param reactionCount - Number of reactions to scrape
 * @param commentCount - Number of comments to scrape
 * @returns Total cost in cents
 *
 * @example
 * // Analysis with 300 reactions and 200 comments:
 * calculatePostAnalysisCost(300, 200)
 * // = 1 + (300 * 1) + (200 * 1) = 501 cents = $5.01
 */
export function calculatePostAnalysisCost(
  reactionCount: number,
  commentCount: number
): number {
  const baseCost = CREDIT_COSTS.postAnalysisBase;
  const reactionCost = reactionCount * CREDIT_COSTS.perReaction;
  const commentCost = commentCount * CREDIT_COSTS.perComment;

  return baseCost + reactionCost + commentCost;
}

/**
 * Estimates the maximum cost for a post analysis based on plan limits.
 * Useful for showing users their worst-case credit usage.
 *
 * @param planId - The user's plan
 * @returns Maximum possible cost in cents, or null for free plan
 */
export function estimateMaxPostAnalysisCost(planId: string): number | null {
  const config = getPlanWalletConfig(planId);
  if (!config) return null;

  return calculatePostAnalysisCost(
    config.reactionsPerPost,
    config.commentsPerPost
  );
}

// =============================================================================
// WALLET OPERATIONS
// =============================================================================
//
// These functions interact with the database to manage wallet balances.
// All operations are logged for audit purposes.
// =============================================================================

/**
 * Gets the current wallet status for a user.
 *
 * @param userId - The user's ID
 * @returns Wallet status or null if user not found
 */
export async function getWalletStatus(userId: string): Promise<WalletStatus | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('wallet_balance, wallet_reset_at, plan, purchased_credits')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('[Wallet] Failed to get wallet status:', error);
    return null;
  }

  // Get subscription for next reset date
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  const balanceInCents = user.wallet_balance || 0;
  const purchasedCreditsInCents = user.purchased_credits || 0;

  return {
    balanceInCents,
    balanceFormatted: formatCredits(balanceInCents),
    plan: user.plan || 'free',
    lastResetAt: user.wallet_reset_at,
    nextResetAt: subscription?.current_period_end || null,
    purchasedCreditsInCents,
  };
}

/**
 * Checks if user has enough credits for an action.
 *
 * IMPORTANT: Always call this BEFORE starting an action.
 * Don't rely on deductCredits to fail - that wastes user resources.
 *
 * @param userId - The user's ID
 * @param requiredCredits - Credits needed for the action (in cents)
 * @returns True if user has enough credits
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const status = await getWalletStatus(userId);
  if (!status) return false;

  // Wallet-only usage - 2026-05-17 19:05 IST, paras: trials receive capped wallet credits; no hidden free counters.
  return status.balanceInCents >= requiredCredits;
}

/**
 * Deducts credits from user's wallet using atomic database operation.
 *
 * SECURITY FIX - 2nd January 2026
 * ================================
 * This function now uses the deduct_wallet_credits database function (RPC)
 * which performs atomic check-and-deduct with row-level locking.
 *
 * PREVIOUS VULNERABILITY:
 * The old implementation used a read-then-write pattern:
 * 1. Read current balance
 * 2. Check if enough credits
 * 3. Write new balance
 *
 * This allowed race conditions where parallel requests could all read the same
 * balance, pass the check, and then each deduct - effectively bypassing limits.
 * Example: User with $15 could fire 10 requests, all read $15, all pass, all deduct $5.
 *
 * FIX:
 * Now uses PostgreSQL SELECT ... FOR UPDATE to lock the row during the operation,
 * ensuring only one request can modify the balance at a time.
 *
 * @param userId - The user's ID
 * @param amount - Amount to deduct in cents (positive number)
 * @param actionType - Type of action consuming credits
 * @param reason - Human-readable reason for the deduction
 * @param metadata - Optional additional data (e.g., post URL)
 * @returns Operation result with new balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  actionType: WalletActionType,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<WalletOperationResult> {
  if (amount <= 0) {
    return { success: false, newBalance: 0, error: 'Amount must be positive' };
  }

  const supabase = await createClient();

  // SECURITY FIX (2nd Jan 2026): Use atomic RPC function instead of read-then-write
  // This prevents race conditions where parallel requests could bypass credit limits.
  // The database function uses SELECT ... FOR UPDATE to lock the row atomically.
  const { data, error } = await supabase.rpc('deduct_wallet_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_action_type: actionType,
    p_reason: reason,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error('[Wallet] RPC error during deduction:', error);
    return { success: false, newBalance: 0, error: 'Database error during deduction' };
  }

  // The RPC returns an array with one row containing success, new_balance, error_message
  const result = data?.[0];

  if (!result) {
    console.error('[Wallet] No result from deduct_wallet_credits RPC');
    return { success: false, newBalance: 0, error: 'No response from database' };
  }

  if (!result.success) {
    console.warn('[Wallet] Deduction failed:', {
      userId,
      requestedAmount: amount,
      error: result.error_message,
    });
    return {
      success: false,
      newBalance: result.new_balance || 0,
      error: result.error_message || 'Deduction failed',
    };
  }

  console.log('[Wallet] Credits deducted (atomic):', {
    userId,
    amount: formatCredits(amount),
    newBalance: formatCredits(result.new_balance),
    actionType,
    reason,
  });

  return { success: true, newBalance: result.new_balance };
}

export async function releaseExpiredWalletReservations(
  userId: string,
  olderThanMinutes: number = 120
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('release_expired_wallet_reservations', {
    p_user_id: userId,
    p_older_than_minutes: olderThanMinutes,
  });

  if (error) {
    console.error('[Wallet] Failed to release expired reservations:', error);
  }
}

export async function reserveCredits(
  userId: string,
  amount: number,
  actionType: WalletActionType,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<WalletReservationResult> {
  if (amount <= 0) {
    return { success: false, newBalance: 0, error: 'Amount must be positive' };
  }

  await releaseExpiredWalletReservations(userId);

  const supabase = await createClient();

  // Wallet reservation - 2026-05-18 15:28 IST, paras: reserve before Apify so parallel tabs cannot spend the same balance twice.
  const { data, error } = await supabase.rpc('reserve_wallet_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_action_type: actionType,
    p_reason: reason,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error('[Wallet] RPC error during reservation:', error);
    return { success: false, newBalance: 0, error: 'Database error during credit reservation' };
  }

  const result = data?.[0];
  if (!result) {
    return { success: false, newBalance: 0, error: 'No response from database' };
  }

  if (!result.success) {
    return {
      success: false,
      newBalance: result.new_balance || 0,
      error: result.error_message || 'Credit reservation failed',
    };
  }

  return {
    success: true,
    newBalance: result.new_balance,
    reservationId: result.reservation_id,
  };
}

export async function settleCreditReservation(
  userId: string,
  reservationId: string,
  actualAmount: number,
  metadata?: Record<string, unknown>
): Promise<WalletSettlementResult> {
  if (!reservationId) {
    return { success: false, newBalance: 0, refundAmount: 0, error: 'Missing reservation ID' };
  }

  if (actualAmount < 0) {
    return { success: false, newBalance: 0, refundAmount: 0, error: 'Actual amount must be zero or positive' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('settle_wallet_reservation', {
    p_user_id: userId,
    p_reservation_id: reservationId,
    p_actual_amount: actualAmount,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error('[Wallet] RPC error during reservation settlement:', error);
    return { success: false, newBalance: 0, refundAmount: 0, error: 'Database error during reservation settlement' };
  }

  const result = data?.[0];
  if (!result) {
    return { success: false, newBalance: 0, refundAmount: 0, error: 'No response from database' };
  }

  if (!result.success) {
    return {
      success: false,
      newBalance: result.new_balance || 0,
      refundAmount: result.refund_amount || 0,
      error: result.error_message || 'Reservation settlement failed',
    };
  }

  return {
    success: true,
    newBalance: result.new_balance,
    refundAmount: result.refund_amount || 0,
  };
}

export async function releaseCreditReservation(
  userId: string,
  reservationId: string,
  metadata?: Record<string, unknown>
): Promise<WalletSettlementResult> {
  return settleCreditReservation(userId, reservationId, 0, {
    released: true,
    ...metadata,
  });
}

/**
 * Adds purchased credits to a user's wallet using atomic database operation.
 *
 * HOW PURCHASED CREDITS WORK:
 * ============================
 * - User buys a credit pack ($10, $25, or $50) via one-time Dodo payment
 * - Both wallet_balance and purchased_credits are incremented atomically
 * - On monthly reset, purchased_credits are PRESERVED (not forfeited)
 * - On deduction, plan credits are consumed FIRST (they expire), purchased LAST
 * - On subscription cancellation, purchased credits survive (user paid for them)
 *
 * ATOMICITY:
 * ==========
 * Uses the add_purchased_credits RPC function which performs an atomic
 * UPDATE ... RETURNING, ensuring both columns are updated in a single
 * operation with an implicit row lock.
 *
 * @param userId - The user's ID
 * @param amount - Amount to add in cents (positive number)
 * @param packId - The credit pack ID (for transaction logging)
 * @param metadata - Optional additional data (e.g., payment_id from Dodo)
 * @param client - Optional Supabase client (pass admin client from webhook context)
 * @returns Operation result with new balance and purchased total
 */
export async function addPurchasedCredits(
  userId: string,
  amount: number,
  packId: string,
  metadata?: Record<string, unknown>,
  client?: SupabaseClient
): Promise<WalletOperationResult & { newPurchased?: number }> {
  if (amount <= 0) {
    return { success: false, newBalance: 0, error: 'Amount must be positive' };
  }

  const supabase = client ?? await createClient();

  const { data, error } = await supabase.rpc('add_purchased_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error('[Wallet] RPC error during credit addition:', error);
    return { success: false, newBalance: 0, error: 'Database error during credit addition' };
  }

  // The RPC returns an array with one row: { success, new_balance, new_purchased, error_message }
  const result = data?.[0];

  if (!result || !result.success) {
    console.error('[Wallet] Failed to add purchased credits:', result?.error_message);
    return {
      success: false,
      newBalance: 0,
      error: result?.error_message || 'Failed to add credits',
    };
  }

  // Log the transaction for audit trail
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount: amount,
    balance_after: result.new_balance,
    type: 'credit',
    reason: `Credit pack purchased (${packId})`,
    action_type: null,
    metadata: {
      pack_id: packId,
      purchased_credits_after: result.new_purchased,
      ...metadata,
    },
    created_at: new Date().toISOString(),
  });

  console.log('[Wallet] Purchased credits added:', {
    userId,
    amount: formatCredits(amount),
    newBalance: formatCredits(result.new_balance),
    newPurchased: formatCredits(result.new_purchased),
    packId,
  });

  return {
    success: true,
    newBalance: result.new_balance,
    newPurchased: result.new_purchased,
  };
}

/**
 * Resets wallet credits to the plan's allocation.
 *
 * This is called by the webhook handler when a subscription payment succeeds.
 * It REPLACES the current balance (unused credits are forfeited).
 *
 * @param userId - The user's ID
 * @param planId - The plan to reset credits for
 * @returns Operation result with new balance
 *
 * @example
 * // On successful $79 payment for Pro plan:
 * await resetWalletCredits(userId, 'pro');
 * // Balance is now $150.00 (15000 cents), regardless of previous balance
 */
export async function resetWalletCredits(
  userId: string,
  planId: WalletPlanId,
  client?: SupabaseClient,
  options: WalletResetOptions = {}
): Promise<WalletOperationResult> {
  const config = getPlanWalletConfig(planId);
  if (!config) {
    return {
      success: false,
      newBalance: 0,
      error: `Invalid plan: ${planId}`
    };
  }

  const supabase = client ?? await createClient();

  if (options.idempotencyKey) {
    const { data: existingReset } = await supabase
      .from('wallet_transactions')
      .select('balance_after')
      .eq('user_id', userId)
      .eq('type', 'credit')
      .contains('metadata', { idempotencyKey: options.idempotencyKey })
      .maybeSingle();

    if (existingReset) {
      return { success: true, newBalance: existingReset.balance_after };
    }
  }

  // Get current balance and purchased credits for reset calculation.
  // Purchased credits survive the reset — only plan credits are forfeited.
  const { data: user } = await supabase
    .from('users')
    .select('wallet_balance, purchased_credits')
    .eq('id', userId)
    .single();

  const previousBalance = user?.wallet_balance || 0;
  const purchasedCredits = user?.purchased_credits || 0;
  const allocationAmount = options.allocationAmountInCents ?? config.totalCredits;
  // Only plan credits are forfeited, not purchased credits
  const forfeitedAmount = Math.max(0, previousBalance - purchasedCredits);
  // New balance = fresh plan allocation + any remaining purchased credits
  const newBalance = allocationAmount + purchasedCredits;

  // Billing hardening - 2026-05-17 14:06 IST, paras: initial allocation must be atomic across webhook/polling races.
  let updateQuery = supabase
    .from('users')
    .update({
      wallet_balance: newBalance,
      wallet_reset_at: new Date().toISOString(),
      plan: planId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (options.onlyIfNeverReset) {
    updateQuery = updateQuery.is('wallet_reset_at', null);
  }

  const { data: updatedUser, error: updateError } = await updateQuery
    .select('wallet_balance')
    .maybeSingle();

  if (updateError) {
    console.error('[Wallet] Failed to reset credits:', updateError);
    return {
      success: false,
      newBalance: previousBalance,
      error: 'Failed to reset credits'
    };
  }

  if (options.onlyIfNeverReset && !updatedUser) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .maybeSingle();
    return { success: true, newBalance: currentUser?.wallet_balance || previousBalance };
  }

  // Log the forfeiture (if any credits were lost)
  if (forfeitedAmount > 0) {
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      amount: -forfeitedAmount,
      // After forfeiture, only purchased credits remain (before plan allocation)
      balance_after: purchasedCredits,
      type: 'debit',
      reason: `Plan credits forfeited at billing cycle end (unused: ${formatCredits(forfeitedAmount)})`,
      action_type: null,
      metadata: {
        forfeited: true,
        planCreditsForfeited: forfeitedAmount,
        purchasedCreditsPreserved: purchasedCredits,
      },
      created_at: new Date().toISOString(),
    });
  }

  // Log the credit (new billing cycle allocation)
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount: allocationAmount,
    balance_after: newBalance,
    type: 'credit',
    reason: options.allocationReason || `Billing cycle credit allocation for ${config.name} plan`,
    action_type: null,
    metadata: {
      planId,
      baseCredits: config.baseCredits,
      bonusCredits: config.bonusCredits,
      totalCredits: allocationAmount,
      paidPlanCredits: config.totalCredits,
      purchasedCreditsPreserved: purchasedCredits,
      idempotencyKey: options.idempotencyKey,
      source: options.source,
    },
    created_at: new Date().toISOString(),
  });

  console.log('[Wallet] Credits reset:', {
    userId,
    planId,
    forfeitedAmount: formatCredits(forfeitedAmount),
    newBalance: formatCredits(newBalance),
  });

  return { success: true, newBalance };
}

/**
 * Allocates the capped trial wallet instead of full paid plan credits.
 */
export async function resetTrialWalletCredits(
  userId: string,
  planId: WalletPlanId,
  client?: SupabaseClient,
  options: WalletResetOptions = {}
): Promise<WalletOperationResult> {
  const config = getPlanWalletConfig(planId);
  return resetWalletCredits(userId, planId, client, {
    ...options,
    source: options.source || 'trial_activation',
    allocationAmountInCents: TRIAL_WALLET_CREDITS_IN_CENTS,
    allocationReason: options.allocationReason || `Trial wallet allocation for ${config?.name || planId} plan`,
  });
}

/**
 * Gets transaction history for a user's wallet.
 *
 * @param userId - The user's ID
 * @param limit - Maximum number of transactions to return
 * @returns Array of transactions, newest first
 */
export async function getWalletTransactions(
  userId: string,
  limit: number = 50
): Promise<WalletTransaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Wallet] Failed to get transactions:', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    balanceAfter: row.balance_after,
    type: row.type,
    reason: row.reason,
    actionType: row.action_type,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

/**
 * Clears wallet balance when subscription is cancelled.
 * User loses remaining credits immediately on cancellation.
 *
 * @param userId - The user's ID
 * @param reason - Reason for clearing (e.g., "Subscription cancelled")
 */
export async function clearWalletBalance(
  userId: string,
  reason: string = 'Subscription ended',
  client?: SupabaseClient
): Promise<WalletOperationResult> {
  const supabase = client ?? await createClient();

  // Get current balance and purchased credits.
  // Purchased credits survive cancellation — user paid real money for them.
  const { data: user } = await supabase
    .from('users')
    .select('wallet_balance, purchased_credits')
    .eq('id', userId)
    .single();

  const previousBalance = user?.wallet_balance || 0;
  const purchasedCredits = user?.purchased_credits || 0;

  const endedState = {
    plan: 'free',
    trial_ends_at: null,
    plan_expires_at: null,
    updated_at: new Date().toISOString(),
  };

  // Expiry cleanup - 2026-05-18 14:05 IST, paras: subscription expiry must clear plan/trial dates even when only purchased credits remain.
  if (previousBalance <= purchasedCredits) {
    const preservedBalance = Math.min(previousBalance, purchasedCredits);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: preservedBalance,
        ...endedState,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Wallet] Failed to clear expired plan state:', updateError);
      return {
        success: false,
        newBalance: previousBalance,
        error: 'Failed to clear expired plan state'
      };
    }

    return { success: true, newBalance: preservedBalance };
  }

  // Preserve purchased credits — only forfeit the plan portion.
  // User's wallet_balance is set to their purchased_credits amount.
  const planCreditsCleared = previousBalance - purchasedCredits;
  const newBalance = purchasedCredits;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      wallet_balance: newBalance,
      ...endedState,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('[Wallet] Failed to clear balance:', updateError);
    return {
      success: false,
      newBalance: previousBalance,
      error: 'Failed to clear balance'
    };
  }

  // Log the forfeiture (only plan credits, not purchased)
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount: -planCreditsCleared,
    balance_after: newBalance,
    type: 'debit',
    reason,
    action_type: null,
    metadata: {
      cleared: true,
      planCreditsCleared,
      purchasedCreditsPreserved: purchasedCredits,
    },
    created_at: new Date().toISOString(),
  });

  console.log('[Wallet] Balance cleared:', {
    userId,
    planCreditsCleared: formatCredits(planCreditsCleared),
    purchasedCreditsPreserved: formatCredits(purchasedCredits),
    newBalance: formatCredits(newBalance),
    reason,
  });

  return { success: true, newBalance };
}
