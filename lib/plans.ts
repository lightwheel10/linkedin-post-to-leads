// =============================================================================
// PLAN CONFIGURATION
// =============================================================================
//
// Defines plan limits for reaction/comment scraping caps.
// These limits control how many reactions/comments can be scraped per post.
//
// NOTE: This file is for SCRAPING LIMITS only.
// For wallet credits and pricing, see lib/wallet.ts
//
// PLAN OVERVIEW:
// ==============
// | Plan   | Reactions/Post | Comments/Post | Wallet Credits |
// |--------|----------------|---------------|----------------|
// | Free   | 100            | 75            | -              |
// | Pro    | 300            | 200           | $150/mo        |
// | Growth | 600            | 400           | $300/mo        |
// | Scale  | 1000           | 600           | $500/mo        |
// =============================================================================

export type PlanId = 'free' | 'pro' | 'growth' | 'scale';

export interface PlanLimits {
  name: string;
  reactionCap: number;
  commentCap: number;
}

export interface Plan extends PlanLimits {
  id: PlanId;
  description: string;
}

// =============================================================================
// PLAN DEFINITIONS
// =============================================================================

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Limited access for trying the platform',
    reactionCap: 100,
    commentCap: 75,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For solo founders and SDRs discovering intent-based leads',
    reactionCap: 300,
    commentCap: 200,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'For sales teams capturing buying signals at scale',
    reactionCap: 600,
    commentCap: 400,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    description: 'For agencies running intent-based campaigns for clients',
    reactionCap: 1000,
    commentCap: 600,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get plan limits for a given plan ID
 */
export function getPlanLimits(planId: string): PlanLimits {
  const plan = PLANS[planId as PlanId];
  if (!plan) {
    // Default to free plan limits if unknown
    return PLANS.free;
  }
  return {
    name: plan.name,
    reactionCap: plan.reactionCap,
    commentCap: plan.commentCap,
  };
}

/**
 * Check if a plan ID is valid
 */
export function isValidPlan(planId: string): planId is PlanId {
  return planId in PLANS;
}

/**
 * Get the total people cap per post (reactions + comments)
 */
export function getTotalPeopleCap(planId: string): number {
  const limits = getPlanLimits(planId);
  return limits.reactionCap + limits.commentCap;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(Math.round((used / limit) * 100), 100);
}

/**
 * Check if usage is at warning level (80% or more)
 */
export function isUsageWarning(used: number, limit: number): boolean {
  return getUsagePercentage(used, limit) >= 80;
}

/**
 * Check if usage limit is reached
 */
export function isUsageLimitReached(used: number, limit: number): boolean {
  return used >= limit;
}
