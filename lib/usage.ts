// =============================================================================
// USAGE TRACKING & ENFORCEMENT
// Functions for checking limits and tracking usage
// =============================================================================

import { supabase } from './supabase';
import { getPlanLimits, getUsagePercentage, isUsageWarning, isUsageLimitReached } from './plans';

// =============================================================================
// TYPES
// =============================================================================

export interface UsageInfo {
  analysesUsed: number;
  analysesLimit: number;
  analysesPercentage: number;
  enrichmentsUsed: number;
  enrichmentsLimit: number;
  enrichmentsPercentage: number;
  plan: string;
  planName: string;
  isTrialing: boolean;
  trialEndsAt: string | null;
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
// CORE FUNCTIONS
// =============================================================================

/**
 * Get current usage info for a user
 */
export async function getUsageInfo(userId: string): Promise<UsageInfo | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, analyses_used, enrichments_used, trial_ends_at, usage_reset_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('Failed to get user for usage info:', error);
    return null;
  }

  const plan = user.plan || 'free';
  const limits = getPlanLimits(plan);

  return {
    analysesUsed: user.analyses_used || 0,
    analysesLimit: limits.analyses,
    analysesPercentage: getUsagePercentage(user.analyses_used || 0, limits.analyses),
    enrichmentsUsed: user.enrichments_used || 0,
    enrichmentsLimit: limits.enrichments,
    enrichmentsPercentage: getUsagePercentage(user.enrichments_used || 0, limits.enrichments),
    plan,
    planName: limits.name,
    isTrialing: plan !== 'free' && user.trial_ends_at && new Date(user.trial_ends_at) > new Date(),
    trialEndsAt: user.trial_ends_at,
  };
}

/**
 * Check if user can perform an analysis
 */
export async function canAnalyze(userId: string): Promise<UsageCheckResult> {
  const usage = await getUsageInfo(userId);

  if (!usage) {
    return {
      allowed: false,
      reason: 'Unable to verify usage limits. Please try again.',
      usage: {
        analysesUsed: 0,
        analysesLimit: 2,
        analysesPercentage: 0,
        enrichmentsUsed: 0,
        enrichmentsLimit: 5,
        enrichmentsPercentage: 0,
        plan: 'free',
        planName: 'Free Trial',
        isTrialing: false,
        trialEndsAt: null,
      },
    };
  }

  if (isUsageLimitReached(usage.analysesUsed, usage.analysesLimit)) {
    return {
      allowed: false,
      reason: `You've used all ${usage.analysesLimit} analyses this month. Upgrade your plan for more.`,
      usage,
    };
  }

  // Add warning if near limit
  if (isUsageWarning(usage.analysesUsed, usage.analysesLimit)) {
    return {
      allowed: true,
      reason: `You have ${usage.analysesLimit - usage.analysesUsed} analyses remaining this month.`,
      usage,
    };
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
      usage: {
        analysesUsed: 0,
        analysesLimit: 2,
        analysesPercentage: 0,
        enrichmentsUsed: 0,
        enrichmentsLimit: 5,
        enrichmentsPercentage: 0,
        plan: 'free',
        planName: 'Free Trial',
        isTrialing: false,
        trialEndsAt: null,
      },
    };
  }

  if (isUsageLimitReached(usage.enrichmentsUsed, usage.enrichmentsLimit)) {
    return {
      allowed: false,
      reason: `You've used all ${usage.enrichmentsLimit} enrichments this month. Upgrade your plan for more.`,
      usage,
    };
  }

  // Add warning if near limit
  if (isUsageWarning(usage.enrichmentsUsed, usage.enrichmentsLimit)) {
    return {
      allowed: true,
      reason: `You have ${usage.enrichmentsLimit - usage.enrichmentsUsed} enrichments remaining this month.`,
      usage,
    };
  }

  return { allowed: true, usage };
}

/**
 * Increment analysis usage and log the event
 */
export async function incrementAnalysisUsage(
  userId: string,
  metadata: AnalysisMetadata
): Promise<{ success: boolean; error?: string }> {
  // Update user's analysis count
  const { error: updateError } = await supabase.rpc('increment_analyses_used', {
    p_user_id: userId,
  });

  // If RPC doesn't exist, fall back to direct update
  if (updateError?.code === 'PGRST202') {
    const { data: user } = await supabase
      .from('users')
      .select('analyses_used')
      .eq('id', userId)
      .single();

    const { error } = await supabase
      .from('users')
      .update({ analyses_used: (user?.analyses_used || 0) + 1 })
      .eq('id', userId);

    if (error) {
      console.error('Failed to increment analysis usage:', error);
      return { success: false, error: error.message };
    }
  } else if (updateError) {
    console.error('Failed to increment analysis usage:', updateError);
    return { success: false, error: updateError.message };
  }

  // Log the usage event
  const { error: logError } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'analysis',
    post_url: metadata.postUrl,
    reactions_scraped: metadata.reactionsScraped,
    comments_scraped: metadata.commentsScraped,
    leads_found: metadata.leadsFound,
  });

  if (logError) {
    console.error('Failed to log analysis usage:', logError);
    // Don't fail the operation if logging fails
  }

  return { success: true };
}

/**
 * Increment enrichment usage and log the event
 */
export async function incrementEnrichmentUsage(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Update user's enrichment count
  const { data: user } = await supabase
    .from('users')
    .select('enrichments_used')
    .eq('id', userId)
    .single();

  const { error } = await supabase
    .from('users')
    .update({ enrichments_used: (user?.enrichments_used || 0) + 1 })
    .eq('id', userId);

  if (error) {
    console.error('Failed to increment enrichment usage:', error);
    return { success: false, error: error.message };
  }

  // Log the usage event
  const { error: logError } = await supabase.from('usage_logs').insert({
    user_id: userId,
    action: 'enrichment',
  });

  if (logError) {
    console.error('Failed to log enrichment usage:', logError);
    // Don't fail the operation if logging fails
  }

  return { success: true };
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
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
 * Reset monthly usage for a user (called on billing cycle reset)
 */
export async function resetMonthlyUsage(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({
      analyses_used: 0,
      enrichments_used: 0,
      usage_reset_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to reset monthly usage:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the reaction/comment caps for a user's plan
 */
export async function getScrapingCaps(userId: string): Promise<{ reactionCap: number; commentCap: number }> {
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

