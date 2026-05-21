// =============================================================================
// USAGE TRACKING & ENFORCEMENT
// =============================================================================
//
// Functions for checking scraping limits and tracking usage.
//
// NOTE: This file handles SCRAPING LIMITS (reactions/comments per post).
// For wallet credits and billing, see lib/wallet.ts
//
// SECURITY FIXES - 2nd January 2026
// ==================================
// 1. Pre-check now validates ESTIMATED FULL COST, not just base cost
//    - Previously only checked if user had 1 cent (base cost)
//    - Now estimates max cost based on plan limits before allowing operation
//
// 2. Usage now depends on wallet credits only
//    - Trial users receive a capped trial wallet after activation
//    - Non-trial free users do not get hidden fixed counters
//
// 3. deductCredits return value is now properly checked
//    - Previously ignored failures which could lead to silent billing issues
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { getPlanLimits } from './plans';
import {
  hasEnoughCredits,
  deductCredits,
  getWalletStatus,
  CREDIT_COSTS,
  WALLET_PLANS,
  isWalletPlan,
  releaseExpiredWalletReservations,
  reserveCredits,
  settleCreditReservation,
  releaseCreditReservation,
  type WalletStatus,
} from './wallet';

// =============================================================================
// TYPES
// =============================================================================

export interface UsageInfo {
  plan: string;
  planName: string;
  walletBalance: number;
  walletFormatted: string;
  isTrialing: boolean;
  trialEndsAt: string | null;
  // Legacy fields for backwards compatibility
  analysesUsed: number;
  analysesLimit: number;
  analysesPercentage: number;
  enrichmentsUsed: number;
  enrichmentsLimit: number;
  enrichmentsPercentage: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  /** When true, the UI should offer a billing action alongside the error */
  topUpAvailable?: boolean;
  usage: UsageInfo;
}

export interface UsageReservationResult extends UsageCheckResult {
  reservationId?: string;
  reservedAmount?: number;
}

export interface AnalysisMetadata {
  postUrl: string;
  reactionsScraped: number;
  commentsScraped: number;
  leadsFound: number;
}

export interface UsageStats {
  totalAnalyses: number;
  totalEnrichments: number;
  thisMonthAnalyses: number;
  thisMonthEnrichments: number;
  lastResetAt: string | null;
}

// =============================================================================
// HELPER: Get default usage info
// =============================================================================

function getDefaultUsageInfo(): UsageInfo {
  return {
    plan: 'free',
    planName: 'Free',
    walletBalance: 0,
    walletFormatted: '$0.00',
    isTrialing: false,
    trialEndsAt: null,
    analysesUsed: 0,
    analysesLimit: 0,
    analysesPercentage: 0,
    enrichmentsUsed: 0,
    enrichmentsLimit: 0,
    enrichmentsPercentage: 0,
  };
}

async function hasWalletBillingAccess(userId: string, walletStatus: WalletStatus | null): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const walletBalance = walletStatus?.balanceInCents || 0;
  const purchasedCredits = walletStatus?.purchasedCreditsInCents || 0;

  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing') && (!periodEnd || periodEnd > new Date())) {
    return { allowed: true };
  }

  if (subscription && subscription.status === 'cancelled' && periodEnd && periodEnd > new Date()) {
    return { allowed: true };
  }

  if (walletBalance > 0 && walletBalance <= purchasedCredits) {
    return { allowed: true };
  }

  if (walletBalance > purchasedCredits) {
    // Billing hardening - 2026-05-17 14:06 IST, paras: failed billing cannot spend leftover plan credits.
    return { allowed: false, reason: 'Billing is not active. Start a trial or add credits to continue.' };
  }

  // Billing hardening - 2026-05-17 19:05 IST, paras: trial users get capped wallet credits; non-trial users need balance.
  return { allowed: false, reason: 'Your wallet is empty. Start a trial or add credits to continue.' };
}

function getEstimatedAnalysisCost(plan: string): number {
  const planConfig = isWalletPlan(plan)
    ? WALLET_PLANS[plan as keyof typeof WALLET_PLANS]
    : null;

  return CREDIT_COSTS.postAnalysisBase +
    ((planConfig?.reactionsPerPost ?? 100) * CREDIT_COSTS.perReaction) +
    ((planConfig?.commentsPerPost ?? 75) * CREDIT_COSTS.perComment);
}

function getActualAnalysisCost(metadata: AnalysisMetadata): number {
  return CREDIT_COSTS.postAnalysisBase +
    (metadata.reactionsScraped * CREDIT_COSTS.perReaction) +
    (metadata.commentsScraped * CREDIT_COSTS.perComment);
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get current usage info for a user
 */
export async function getUsageInfo(userId: string): Promise<UsageInfo | null> {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, wallet_balance, trial_ends_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('Failed to get user for usage info:', error);
    return null;
  }

  const plan = user.plan || 'free';
  const limits = getPlanLimits(plan);
  const walletStatus = await getWalletStatus(userId);

  return {
    plan,
    planName: limits.name,
    walletBalance: walletStatus?.balanceInCents || 0,
    walletFormatted: walletStatus?.balanceFormatted || '$0.00',
    isTrialing: plan !== 'free' && user.trial_ends_at && new Date(user.trial_ends_at) > new Date(),
    trialEndsAt: user.trial_ends_at,
    // Legacy counters are kept for older callers, but wallet credits decide access.
    analysesUsed: 0,
    analysesLimit: 0,
    analysesPercentage: 0,
    enrichmentsUsed: 0,
    enrichmentsLimit: 0,
    enrichmentsPercentage: 0,
  };
}

/**
 * Check if user can perform an analysis
 * For wallet-based plans, checks if user has enough credits
 *
 * SECURITY FIX - 2nd January 2026
 * ================================
 * Previously this only checked for BASE cost (1 cent), which meant a user with
 * $5 could start an analysis that costs $10+ and consume resources before the
 * actual deduction fails.
 *
 * Now we estimate the MAXIMUM cost based on the user's plan limits:
 * - Pro: up to 300 reactions + 200 comments = ~$5.01 max
 * - Growth: up to 600 reactions + 400 comments = ~$10.01 max
 * - Scale: up to 1000 reactions + 600 comments = ~$16.01 max
 *
 * This ensures users have enough credits BEFORE we start expensive operations.
 */
export async function canAnalyze(userId: string): Promise<UsageCheckResult> {
  const usage = await getUsageInfo(userId);

  if (!usage) {
    return {
      allowed: false,
      reason: 'Unable to verify usage limits. Please try again.',
      usage: getDefaultUsageInfo(),
    };
  }

  const walletStatus = await getWalletStatus(userId);
  const access = await hasWalletBillingAccess(userId, walletStatus);
  if (!access.allowed) {
    return {
      allowed: false,
      reason: access.reason,
      topUpAvailable: true,
      usage,
    };
  }

  const estimatedMaxCost = getEstimatedAnalysisCost(usage.plan);

  const hasCredits = await hasEnoughCredits(userId, estimatedMaxCost);

  if (!hasCredits) {
    return {
      allowed: false,
      reason: `Insufficient credits. You have $${((walletStatus?.balanceInCents || usage.walletBalance) / 100).toFixed(2)} but may need up to $${(estimatedMaxCost / 100).toFixed(2)} for a full analysis.`,
      topUpAvailable: true,
      usage,
    };
  }

  return { allowed: true, usage };
}

export async function reserveAnalysisCredits(
  userId: string,
  postUrl: string
): Promise<UsageReservationResult> {
  await releaseExpiredWalletReservations(userId);

  const usageCheck = await canAnalyze(userId);
  if (!usageCheck.allowed) return usageCheck;

  const estimatedMaxCost = getEstimatedAnalysisCost(usageCheck.usage.plan);
  const reservation = await reserveCredits(
    userId,
    estimatedMaxCost,
    'post_analysis',
    `Post analysis reservation: ${postUrl}`,
    {
      postUrl,
      reservedAmount: estimatedMaxCost,
      reservationType: 'post_analysis',
    }
  );

  if (!reservation.success || !reservation.reservationId) {
    return {
      allowed: false,
      reason: reservation.error || 'Unable to reserve wallet credits. Please try again.',
      topUpAvailable: true,
      usage: usageCheck.usage,
    };
  }

  return {
    allowed: true,
    usage: usageCheck.usage,
    reservationId: reservation.reservationId,
    reservedAmount: estimatedMaxCost,
  };
}

/**
 * Check if user can perform an enrichment
 */
export async function canEnrich(userId: string): Promise<UsageCheckResult> {
  const usage = await getUsageInfo(userId);

  if (!usage) {
    return {
      allowed: false,
      reason: 'Unable to verify usage limits. Please try again.',
      usage: getDefaultUsageInfo(),
    };
  }

  const walletStatus = await getWalletStatus(userId);
  const access = await hasWalletBillingAccess(userId, walletStatus);
  if (!access.allowed) {
    return {
      allowed: false,
      reason: access.reason,
      topUpAvailable: true,
      usage,
    };
  }

  const enrichmentCost = CREDIT_COSTS.profileEnrichment;
  const hasCredits = await hasEnoughCredits(userId, enrichmentCost);

  if (!hasCredits) {
    return {
      allowed: false,
      reason: 'Insufficient wallet credits for enrichment.',
      topUpAvailable: true,
      usage,
    };
  }

  return { allowed: true, usage };
}

export async function reserveEnrichmentCredits(userId: string): Promise<UsageReservationResult> {
  await releaseExpiredWalletReservations(userId);

  const usageCheck = await canEnrich(userId);
  if (!usageCheck.allowed) return usageCheck;

  const reservation = await reserveCredits(
    userId,
    CREDIT_COSTS.profileEnrichment,
    'profile_enrichment',
    'Profile enrichment reservation',
    {
      reservedAmount: CREDIT_COSTS.profileEnrichment,
      reservationType: 'profile_enrichment',
    }
  );

  if (!reservation.success || !reservation.reservationId) {
    return {
      allowed: false,
      reason: reservation.error || 'Unable to reserve wallet credits. Please try again.',
      topUpAvailable: true,
      usage: usageCheck.usage,
    };
  }

  return {
    allowed: true,
    usage: usageCheck.usage,
    reservationId: reservation.reservationId,
    reservedAmount: CREDIT_COSTS.profileEnrichment,
  };
}

/**
 * Increment analysis usage and log the event
 *
 * SECURITY FIX - 2nd January 2026
 * ================================
 * 1. Wallet deduction uses atomic RPC to prevent race conditions
 * 2. deductCredits return value is checked and errors are propagated
 */
export async function incrementAnalysisUsage(
  userId: string,
  metadata: AnalysisMetadata
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const walletStatus = await getWalletStatus(userId);
  const access = await hasWalletBillingAccess(userId, walletStatus);
  if (!access.allowed) {
    return { success: false, error: access.reason || 'Wallet is empty' };
  }

  const cost = CREDIT_COSTS.postAnalysisBase +
    (metadata.reactionsScraped * CREDIT_COSTS.perReaction) +
    (metadata.commentsScraped * CREDIT_COSTS.perComment);

  const reason = `Post analysis: ${metadata.reactionsScraped} reactions, ${metadata.commentsScraped} comments`;

  const deductResult = await deductCredits(userId, cost, 'post_analysis', reason, {
    postUrl: metadata.postUrl,
    reactionsScraped: metadata.reactionsScraped,
    commentsScraped: metadata.commentsScraped,
  });

  if (!deductResult.success) {
    console.error('[Usage] Failed to deduct credits for analysis:', deductResult.error);
    return { success: false, error: deductResult.error || 'Failed to deduct credits' };
  }

  // Log the usage event (non-critical - don't fail if this errors)
  const { error: logError } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'analysis',
    post_url: metadata.postUrl,
    reactions_scraped: metadata.reactionsScraped,
    comments_scraped: metadata.commentsScraped,
    leads_found: metadata.leadsFound,
  });

  if (logError) {
    // Log error but don't fail the operation - usage was already tracked
    console.error('[Usage] Failed to log analysis usage (non-critical):', logError);
  }

  return { success: true };
}

export async function settleAnalysisUsage(
  userId: string,
  reservationId: string,
  metadata: AnalysisMetadata
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const cost = getActualAnalysisCost(metadata);

  const settlement = await settleCreditReservation(userId, reservationId, cost, {
    postUrl: metadata.postUrl,
    reactionsScraped: metadata.reactionsScraped,
    commentsScraped: metadata.commentsScraped,
    leadsFound: metadata.leadsFound,
  });

  if (!settlement.success) {
    console.error('[Usage] Failed to settle analysis reservation:', settlement.error);
    return { success: false, error: settlement.error || 'Failed to settle wallet reservation' };
  }

  const { error: logError } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'analysis',
    post_url: metadata.postUrl,
    reactions_scraped: metadata.reactionsScraped,
    comments_scraped: metadata.commentsScraped,
    leads_found: metadata.leadsFound,
  });

  if (logError) {
    console.error('[Usage] Failed to log analysis usage (non-critical):', logError);
  }

  return { success: true };
}

export async function releaseAnalysisReservation(
  userId: string,
  reservationId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const release = await releaseCreditReservation(userId, reservationId, {
    reservationType: 'post_analysis',
    ...metadata,
  });

  if (!release.success) {
    return { success: false, error: release.error || 'Failed to release wallet reservation' };
  }

  return { success: true };
}

/**
 * Increment enrichment usage and log the event
 *
 * SECURITY FIX - 2nd January 2026
 * ================================
 * 1. Wallet deduction uses atomic RPC to prevent race conditions
 * 2. deductCredits return value is checked and errors are propagated
 */
export async function incrementEnrichmentUsage(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const walletStatus = await getWalletStatus(userId);
  const access = await hasWalletBillingAccess(userId, walletStatus);
  if (!access.allowed) {
    return { success: false, error: access.reason || 'Wallet is empty' };
  }

  const cost = CREDIT_COSTS.profileEnrichment;
  const deductResult = await deductCredits(userId, cost, 'profile_enrichment', 'Profile enrichment');

  if (!deductResult.success) {
    console.error('[Usage] Failed to deduct credits for enrichment:', deductResult.error);
    return { success: false, error: deductResult.error || 'Failed to deduct credits' };
  }

  // Log the usage event (non-critical - don't fail if this errors)
  const { error: logError } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'enrichment',
  });

  if (logError) {
    // Log error but don't fail the operation - usage was already tracked
    console.error('[Usage] Failed to log enrichment usage (non-critical):', logError);
  }

  return { success: true };
}

export async function settleEnrichmentUsage(
  userId: string,
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const settlement = await settleCreditReservation(
    userId,
    reservationId,
    CREDIT_COSTS.profileEnrichment,
    { reservationType: 'profile_enrichment' }
  );

  if (!settlement.success) {
    console.error('[Usage] Failed to settle enrichment reservation:', settlement.error);
    return { success: false, error: settlement.error || 'Failed to settle wallet reservation' };
  }

  const { error: logError } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'enrichment',
  });

  if (logError) {
    console.error('[Usage] Failed to log enrichment usage (non-critical):', logError);
  }

  return { success: true };
}

export async function releaseEnrichmentReservation(
  userId: string,
  reservationId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const release = await releaseCreditReservation(userId, reservationId, {
    reservationType: 'profile_enrichment',
    ...metadata,
  });

  if (!release.success) {
    return { success: false, error: release.error || 'Failed to release wallet reservation' };
  }

  return { success: true };
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('usage_reset_at')
    .eq('id', userId)
    .single();

  const { data: logs, error } = await supabase
    .from('usage_logs')
    .select('action, created_at')
    .eq('user_id', userId);

  if (error || !logs) {
    return {
      totalAnalyses: 0,
      totalEnrichments: 0,
      thisMonthAnalyses: 0,
      thisMonthEnrichments: 0,
      lastResetAt: user?.usage_reset_at || null,
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totalAnalyses = logs.filter(l => l.action === 'analysis').length;
  const totalEnrichments = logs.filter(l => l.action === 'enrichment').length;
  const thisMonthAnalyses = logs.filter(
    l => l.action === 'analysis' && new Date(l.created_at) >= startOfMonth
  ).length;
  const thisMonthEnrichments = logs.filter(
    l => l.action === 'enrichment' && new Date(l.created_at) >= startOfMonth
  ).length;

  return {
    totalAnalyses,
    totalEnrichments,
    thisMonthAnalyses,
    thisMonthEnrichments,
    lastResetAt: user?.usage_reset_at || null,
  };
}

/**
 * Get the reaction/comment caps for a user's plan
 */
export async function getScrapingCaps(userId: string): Promise<{ reactionCap: number; commentCap: number }> {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();

  const limits = getPlanLimits(user?.plan || 'free');
  return {
    reactionCap: limits.reactionCap,
    commentCap: limits.commentCap,
  };
}
