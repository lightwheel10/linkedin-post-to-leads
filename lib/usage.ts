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
// 2. Free user limits now use atomic database operations
//    - Previously used read-then-write which allowed race condition bypasses
//    - Now uses increment_free_user_usage RPC with row-level locking
//
// 3. deductCredits return value is now properly checked
//    - Previously ignored failures which could lead to silent billing issues
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { getPlanLimits, getUsagePercentage, isUsageWarning, isUsageLimitReached } from './plans';
import { hasEnoughCredits, deductCredits, getWalletStatus, CREDIT_COSTS, WALLET_PLANS, isWalletPlan } from './wallet';

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
  usage: UsageInfo;
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
    analysesLimit: 999,
    analysesPercentage: 0,
    enrichmentsUsed: 0,
    enrichmentsLimit: 999,
    enrichmentsPercentage: 0,
  };
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
    // Legacy fields - wallet-based plans have unlimited counts
    analysesUsed: 0,
    analysesLimit: 999,
    analysesPercentage: 0,
    enrichmentsUsed: 0,
    enrichmentsLimit: 999,
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

  // Free users can do limited analyses
  if (usage.plan === 'free') {
    // Check against the count-based limits for free users
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('analyses_used')
      .eq('id', userId)
      .single();

    const analysesUsed = user?.analyses_used || 0;

    // Free users are limited to 5 analyses
    if (analysesUsed >= 5) {
      return {
        allowed: false,
        reason: 'Free users are limited to 5 analyses. Upgrade to continue.',
        usage,
      };
    }
  }

  // For paid plans, check wallet balance for ESTIMATED MAX COST
  // SECURITY FIX (2nd Jan 2026): Previously only checked base cost (1 cent).
  // Now we estimate the maximum possible cost based on plan scraping limits.
  if (usage.plan !== 'free' && isWalletPlan(usage.plan)) {
    const planConfig = WALLET_PLANS[usage.plan as keyof typeof WALLET_PLANS];

    // Calculate estimated max cost based on plan's scraping limits
    // This is the worst-case cost if user scrapes max reactions + comments
    const estimatedMaxCost = CREDIT_COSTS.postAnalysisBase +
      (planConfig.reactionsPerPost * CREDIT_COSTS.perReaction) +
      (planConfig.commentsPerPost * CREDIT_COSTS.perComment);

    const hasCredits = await hasEnoughCredits(userId, estimatedMaxCost);

    if (!hasCredits) {
      // Calculate what they actually have vs what they might need
      const walletStatus = await getWalletStatus(userId);
      const currentBalance = walletStatus?.balanceInCents || 0;

      return {
        allowed: false,
        reason: `Insufficient credits. You have $${(currentBalance / 100).toFixed(2)} but may need up to $${(estimatedMaxCost / 100).toFixed(2)} for a full analysis. Please top up or wait for your next billing cycle.`,
        usage,
      };
    }
  }

  return { allowed: true, usage };
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

  // Free users can do limited enrichments
  if (usage.plan === 'free') {
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('users')
      .select('enrichments_used')
      .eq('id', userId)
      .single();

    const enrichmentsUsed = user?.enrichments_used || 0;

    if (enrichmentsUsed >= 10) {
      return {
        allowed: false,
        reason: 'Free users are limited to 10 enrichments. Upgrade to continue.',
        usage,
      };
    }
  }

  // For paid plans, check wallet balance
  if (usage.plan !== 'free') {
    const enrichmentCost = CREDIT_COSTS.profileEnrichment;
    const hasCredits = await hasEnoughCredits(userId, enrichmentCost);

    if (!hasCredits) {
      return {
        allowed: false,
        reason: 'Insufficient wallet credits for enrichment.',
        usage,
      };
    }
  }

  return { allowed: true, usage };
}

/**
 * Increment analysis usage and log the event
 *
 * SECURITY FIX - 2nd January 2026
 * ================================
 * 1. Free user increment now uses atomic RPC function to prevent race conditions
 * 2. deductCredits return value is now checked and errors are propagated
 */
export async function incrementAnalysisUsage(
  userId: string,
  metadata: AnalysisMetadata
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get user's plan
  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = user?.plan || 'free';

  // For free users, use atomic increment to prevent race conditions
  // SECURITY FIX (2nd Jan 2026): Previously used read-then-write which allowed
  // parallel requests to bypass limits. Now uses database-level locking.
  if (plan === 'free') {
    const { data: incrementResult, error: incrementError } = await supabase.rpc(
      'increment_free_user_usage',
      {
        p_user_id: userId,
        p_usage_type: 'analyses',
        p_limit: 5, // Free user limit
      }
    );

    if (incrementError) {
      console.error('[Usage] RPC error incrementing free user analyses:', incrementError);
      return { success: false, error: 'Failed to track usage' };
    }

    const result = incrementResult?.[0];
    if (!result?.success) {
      console.warn('[Usage] Free user analysis limit reached:', result?.error_message);
      return { success: false, error: result?.error_message || 'Usage limit reached' };
    }
  } else {
    // For paid users, deduct from wallet using atomic operation
    const cost = CREDIT_COSTS.postAnalysisBase +
      (metadata.reactionsScraped * CREDIT_COSTS.perReaction) +
      (metadata.commentsScraped * CREDIT_COSTS.perComment);

    const reason = `Post analysis: ${metadata.reactionsScraped} reactions, ${metadata.commentsScraped} comments`;

    // SECURITY FIX (2nd Jan 2026): Now checking deductCredits result
    // Previously ignored failures which could lead to silent billing issues
    const deductResult = await deductCredits(userId, cost, 'post_analysis', reason, {
      postUrl: metadata.postUrl,
      reactionsScraped: metadata.reactionsScraped,
      commentsScraped: metadata.commentsScraped,
    });

    if (!deductResult.success) {
      console.error('[Usage] Failed to deduct credits for analysis:', deductResult.error);
      return { success: false, error: deductResult.error || 'Failed to deduct credits' };
    }
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

/**
 * Increment enrichment usage and log the event
 *
 * SECURITY FIX - 2nd January 2026
 * ================================
 * 1. Free user increment now uses atomic RPC function to prevent race conditions
 * 2. deductCredits return value is now checked and errors are propagated
 */
export async function incrementEnrichmentUsage(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get user's plan
  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = user?.plan || 'free';

  // For free users, use atomic increment to prevent race conditions
  // SECURITY FIX (2nd Jan 2026): Previously used read-then-write which allowed
  // parallel requests to bypass limits. Now uses database-level locking.
  if (plan === 'free') {
    const { data: incrementResult, error: incrementError } = await supabase.rpc(
      'increment_free_user_usage',
      {
        p_user_id: userId,
        p_usage_type: 'enrichments',
        p_limit: 10, // Free user limit
      }
    );

    if (incrementError) {
      console.error('[Usage] RPC error incrementing free user enrichments:', incrementError);
      return { success: false, error: 'Failed to track usage' };
    }

    const result = incrementResult?.[0];
    if (!result?.success) {
      console.warn('[Usage] Free user enrichment limit reached:', result?.error_message);
      return { success: false, error: result?.error_message || 'Usage limit reached' };
    }
  } else {
    // For paid users, deduct from wallet using atomic operation
    const cost = CREDIT_COSTS.profileEnrichment;

    // SECURITY FIX (2nd Jan 2026): Now checking deductCredits result
    // Previously ignored failures which could lead to silent billing issues
    const deductResult = await deductCredits(userId, cost, 'profile_enrichment', 'Profile enrichment');

    if (!deductResult.success) {
      console.error('[Usage] Failed to deduct credits for enrichment:', deductResult.error);
      return { success: false, error: deductResult.error || 'Failed to deduct credits' };
    }
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
