import type { SupabaseClient } from '@supabase/supabase-js';
import { completeOnboarding } from '@/lib/data-store';
import { getPlanFromDodoProductId, mapDodoSubscriptionStatus } from '@/lib/dodo';
import { isWalletPlan, resetWalletCredits, type WalletPlanId } from '@/lib/wallet';

type DodoCustomerLike = {
  customer_id?: string | null;
  email?: string | null;
};

export type DodoSubscriptionLike = {
  subscription_id?: string | null;
  product_id?: string | null;
  status?: string | null;
  customer?: DodoCustomerLike | null;
  metadata?: Record<string, string> | null;
  previous_billing_date?: string | null;
  next_billing_date?: string | null;
  trial_period_days?: number | null;
};

interface SyncDodoSubscriptionOptions {
  subscription: DodoSubscriptionLike;
  checkoutSessionId?: string | null;
  fallbackUserId?: string | null;
  fallbackPlanId?: string | null;
  fallbackBillingPeriod?: string | null;
}

interface SyncDodoSubscriptionResult {
  success: boolean;
  message?: string;
  userEmail?: string;
  planId?: string;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isActiveDodoStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Applies a verified active Dodo subscription to local billing state.
 *
 * This is used by both the webhook and checkout-status fallback. The caller must
 * verify the subscription with Dodo before calling this helper.
 */
export async function syncActiveDodoSubscription(
  options: SyncDodoSubscriptionOptions,
  supabase: SupabaseClient
): Promise<SyncDodoSubscriptionResult> {
  const { subscription, checkoutSessionId, fallbackUserId, fallbackPlanId, fallbackBillingPeriod } = options;
  const subscriptionId = subscription.subscription_id;
  const dodoStatus = subscription.status || 'active';

  if (!subscriptionId) {
    return { success: false, message: 'Missing subscription id' };
  }

  if (!isActiveDodoStatus(dodoStatus)) {
    return { success: false, message: `Subscription is not active: ${dodoStatus}` };
  }

  const planId = (subscription.product_id ? getPlanFromDodoProductId(subscription.product_id) : null)
    || fallbackPlanId
    || subscription.metadata?.plan_id
    || null;

  if (!planId || !isWalletPlan(planId)) {
    return { success: false, message: `Unknown subscription plan: ${planId || 'missing'}` };
  }

  const metadataUserId = subscription.metadata?.user_id || null;
  const customerId = subscription.customer?.customer_id || null;

  let userQuery = supabase
    .from('users')
    .select('id, email, wallet_reset_at')
    .limit(1);

  if (fallbackUserId || metadataUserId) {
    userQuery = userQuery.eq('id', fallbackUserId || metadataUserId);
  } else if (customerId) {
    userQuery = userQuery.eq('dodo_customer_id', customerId);
  } else {
    return { success: false, message: 'Missing user/customer identifier' };
  }

  const { data: users, error: userError } = await userQuery;
  const user = users?.[0];

  if (userError || !user) {
    return { success: false, message: 'User not found for subscription' };
  }

  const now = new Date();
  const trialDays = typeof subscription.trial_period_days === 'number'
    ? subscription.trial_period_days
    : 7;
  const periodStart = parseDate(subscription.previous_billing_date) || now;
  const fallbackPeriodEnd = trialDays > 0 ? addDays(now, trialDays) : addMonth(now);
  const periodEnd = parseDate(subscription.next_billing_date) || fallbackPeriodEnd;
  const trialEnd = trialDays > 0 ? periodEnd : null;

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('dodo_subscription_id', subscriptionId)
    .maybeSingle();

  const subscriptionData = {
    user_id: user.id,
    plan: planId,
    period: fallbackBillingPeriod || 'monthly',
    status: mapDodoSubscriptionStatus(dodoStatus),
    dodo_subscription_id: subscriptionId,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  if (existingSub) {
    const { error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', existingSub.id);

    if (error) {
      return { success: false, message: `Failed to update subscription: ${error.message}` };
    }
  } else {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        created_at: now.toISOString(),
      });

    if (error) {
      return { success: false, message: `Failed to create subscription: ${error.message}` };
    }
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      plan: planId,
      plan_started_at: periodStart.toISOString(),
      plan_expires_at: periodEnd.toISOString(),
      trial_ends_at: trialEnd?.toISOString() || null,
      analyses_used: 0,
      enrichments_used: 0,
      usage_reset_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', user.id);

  if (userUpdateError) {
    return { success: false, message: `Failed to update user plan: ${userUpdateError.message}` };
  }

  // Allocate trial credits once per subscription. This prevents the direct
  // status check and webhook from both restoring credits if they arrive close
  // together.
  if (!existingSub || !user.wallet_reset_at) {
    const walletResult = await resetWalletCredits(user.id, planId as WalletPlanId, supabase, {
      onlyIfNeverReset: true,
      idempotencyKey: `initial:${subscriptionId}`,
      source: 'subscription_activation',
    });
    if (!walletResult.success) {
      return { success: false, message: walletResult.error || 'Failed to allocate trial credits' };
    }
  }

  let pendingCheckoutId = checkoutSessionId || null;

  if (!pendingCheckoutId && subscription.metadata?.callback_token) {
    const { data: tokenSession } = await supabase
      .from('checkout_sessions')
      .select('id')
      .eq('callback_token', subscription.metadata.callback_token)
      .eq('status', 'pending')
      .maybeSingle();

    pendingCheckoutId = tokenSession?.id || null;
  }

  if (!pendingCheckoutId) {
    const { data: latestPending } = await supabase
      .from('checkout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    pendingCheckoutId = latestPending?.id || null;
  }

  if (pendingCheckoutId) {
    await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        dodo_subscription_id: subscriptionId,
        updated_at: now.toISOString(),
      })
      .eq('id', pendingCheckoutId);
  }

  try {
    await completeOnboarding(user.email, supabase);
  } catch (error) {
    console.error('[Dodo Sync] Failed to complete onboarding:', error);
  }

  return {
    success: true,
    userEmail: user.email,
    planId,
    message: `Subscription ${subscriptionId} synced`,
  };
}
