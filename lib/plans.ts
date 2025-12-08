// =============================================================================
// PLAN CONFIGURATION
// Centralized plan limits, pricing, and helper functions
// =============================================================================

export type PlanId = 'free' | 'starter' | 'pro' | 'business';
export type BillingPeriod = 'monthly' | 'annual';

export interface PlanLimits {
  name: string;
  analyses: number;
  enrichments: number;
  reactionCap: number;
  commentCap: number;
}

export interface PlanPricing {
  monthly: number;
  annual: number;
  annualMonthly: number; // Effective monthly price when paying annually
  savings: number; // Annual savings compared to monthly
}

export interface Plan extends PlanLimits {
  id: PlanId;
  description: string;
  pricing: PlanPricing | null; // null for free plan
  features: string[];
  popular?: boolean;
}

// =============================================================================
// PLAN DEFINITIONS
// =============================================================================

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free Trial',
    description: 'Try before you buy',
    analyses: 2,
    enrichments: 5,
    reactionCap: 100,
    commentCap: 75,
    pricing: null,
    features: [
      '2 post analyses',
      '5 profile enrichments',
      'Up to 100 reactions/post',
      'CSV export',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for getting started',
    analyses: 15,
    enrichments: 50,
    reactionCap: 200,
    commentCap: 150,
    pricing: {
      monthly: 79,
      annual: 790,
      annualMonthly: 65.83,
      savings: 158,
    },
    features: [
      '15 post analyses/month',
      '50 profile enrichments',
      'Up to 200 reactions/post',
      'CSV & JSON export',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Most popular for growing teams',
    analyses: 25,
    enrichments: 120,
    reactionCap: 300,
    commentCap: 200,
    pricing: {
      monthly: 149,
      annual: 1490,
      annualMonthly: 124.17,
      savings: 298,
    },
    features: [
      '25 post analyses/month',
      '120 profile enrichments',
      'Up to 300 reactions/post',
      'Priority support',
      'Advanced ICP filters',
    ],
    popular: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For high-volume lead generation',
    analyses: 45,
    enrichments: 300,
    reactionCap: 400,
    commentCap: 300,
    pricing: {
      monthly: 299,
      annual: 2990,
      annualMonthly: 249.17,
      savings: 598,
    },
    features: [
      '45 post analyses/month',
      '300 profile enrichments',
      'Up to 400 reactions/post',
      'Dedicated support',
      'Custom integrations',
    ],
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
    analyses: plan.analyses,
    enrichments: plan.enrichments,
    reactionCap: plan.reactionCap,
    commentCap: plan.commentCap,
  };
}

/**
 * Get the price for a plan based on billing period
 */
export function getPlanPrice(planId: string, period: BillingPeriod): number {
  const plan = PLANS[planId as PlanId];
  if (!plan || !plan.pricing) return 0;
  return period === 'annual' ? plan.pricing.annual : plan.pricing.monthly;
}

/**
 * Get the effective monthly price (accounts for annual discount)
 */
export function getEffectiveMonthlyPrice(planId: string, period: BillingPeriod): number {
  const plan = PLANS[planId as PlanId];
  if (!plan || !plan.pricing) return 0;
  return period === 'annual' ? plan.pricing.annualMonthly : plan.pricing.monthly;
}

/**
 * Get all paid plans (excluding free)
 */
export function getPaidPlans(): Plan[] {
  return Object.values(PLANS).filter(plan => plan.id !== 'free');
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

