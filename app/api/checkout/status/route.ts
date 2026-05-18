// Checkout status polling endpoint.
// Intentionally unprotected because auth cookies may be lost after Dodo redirect.
// The URL token only identifies a local checkout session; payment state is always
// verified against Dodo or our webhook-written database state.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth';
import { completeOnboarding } from '@/lib/data-store';
import { getDodoClient, getPlanFromDodoProductId } from '@/lib/dodo';
import { syncActiveDodoSubscription, type DodoSubscriptionLike } from '@/lib/dodo-subscription-sync';

type CheckoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const FAILED_SUBSCRIPTION_STATUSES = new Set(['failed', 'cancelled', 'expired', 'on_hold']);
const FAILED_PAYMENT_STATUSES = new Set(['failed', 'cancelled', 'requires_payment_method']);
const SUCCEEDED_PAYMENT_STATUSES = new Set(['succeeded']);
const PROCESSING_PAYMENT_STATUSES = new Set([
  'processing',
  'requires_confirmation',
  'requires_capture',
  'requires_merchant_action',
  'partially_captured',
  'partially_captured_and_capturable',
]);

function isSubscriptionCheckout(planId: string | null | undefined): boolean {
  return planId === 'pro' || planId === 'growth' || planId === 'scale';
}

function isRecentEnoughForCheckout(subscriptionCreatedAt: string | null | undefined, checkoutCreatedAt: string): boolean {
  if (!subscriptionCreatedAt) return true;
  const subscriptionTime = new Date(subscriptionCreatedAt).getTime();
  const checkoutTime = new Date(checkoutCreatedAt).getTime();
  if (Number.isNaN(subscriptionTime) || Number.isNaN(checkoutTime)) return true;

  // Allow clock skew and Dodo processing delay, but avoid completing a fresh
  // checkout with a much older subscription for the same customer.
  return subscriptionTime >= checkoutTime - 5 * 60 * 1000;
}

function statusResponse(params: {
  status: CheckoutStatus;
  success?: boolean;
  message: string;
  checkoutSession: any;
  isAuthenticated: boolean;
  userEmail: string | null;
}) {
  const { status, success = status === 'completed' || status === 'pending' || status === 'processing', message, checkoutSession, isAuthenticated, userEmail } = params;

  return NextResponse.json({
    success,
    status,
    user_email: checkoutSession.user_email,
    plan_id: checkoutSession.plan_id,
    requires_login: !isAuthenticated || userEmail !== checkoutSession.user_email,
    message,
  });
}

async function failCheckout(supabase: any, checkoutSession: any, message: string) {
  await supabase
    .from('checkout_sessions')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', checkoutSession.id);

  return message;
}

async function allowPendingDashboardAccess(supabase: any, checkoutSession: any) {
  if (!isSubscriptionCheckout(checkoutSession.plan_id)) return;

  try {
    await completeOnboarding(checkoutSession.user_email, supabase);
  } catch (error) {
    console.error('[Checkout Status] Failed to mark pending onboarding complete:', error);
  }
}

async function completeFromDodoSubscription(
  supabase: any,
  checkoutSession: any,
  subscription: DodoSubscriptionLike,
  isAuthenticated: boolean,
  userEmail: string | null
) {
  const syncResult = await syncActiveDodoSubscription({
    subscription,
    checkoutSessionId: checkoutSession.id,
    fallbackUserId: checkoutSession.user_id,
    fallbackPlanId: checkoutSession.plan_id,
    fallbackBillingPeriod: checkoutSession.billing_period,
  }, supabase);

  if (!syncResult.success) {
    console.error('[Checkout Status] Failed to sync Dodo subscription:', syncResult.message);
    return null;
  }

  return statusResponse({
    status: 'completed',
    message: 'Trial activated!',
    checkoutSession,
    isAuthenticated,
    userEmail,
  });
}

export async function GET(request: NextRequest) {
  try {
    const callbackToken = request.nextUrl.searchParams.get('token');
    const returnedSubscriptionId = request.nextUrl.searchParams.get('subscription_id');

    if (!callbackToken) {
      return NextResponse.json(
        { success: false, status: 'failed', message: 'Missing token parameter' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: checkoutSession, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('callback_token', callbackToken)
      .single();

    if (sessionError || !checkoutSession) {
      return NextResponse.json(
        { success: false, status: 'failed', message: 'Checkout session not found.' },
        { status: 404 }
      );
    }

    const userEmail = await getAuthenticatedUser();
    const isAuthenticated = !!userEmail;
    const now = new Date();
    const expiresAt = new Date(checkoutSession.expires_at);

    if (now > expiresAt && checkoutSession.status === 'pending') {
      await supabase
        .from('checkout_sessions')
        .update({ status: 'expired', updated_at: now.toISOString() })
        .eq('id', checkoutSession.id);

      return statusResponse({
        status: 'expired',
        success: false,
        message: 'This checkout session has expired. Please start a new checkout.',
        checkoutSession,
        isAuthenticated,
        userEmail,
      });
    }

    await supabase
      .from('checkout_sessions')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .eq('user_id', checkoutSession.user_id)
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString())
      .neq('id', checkoutSession.id);

    if (checkoutSession.status === 'completed') {
      if (isAuthenticated && userEmail === checkoutSession.user_email) {
        try {
          await completeOnboarding(userEmail, supabase);
        } catch (error) {
          console.error('[Checkout Status] Failed to complete onboarding:', error);
        }
      }

      return statusResponse({
        status: 'completed',
        message: 'Trial activated!',
        checkoutSession,
        isAuthenticated,
        userEmail,
      });
    }

    if (checkoutSession.status === 'failed') {
      return statusResponse({
        status: 'failed',
        success: false,
        message: 'The payment could not be verified. Please try again.',
        checkoutSession,
        isAuthenticated,
        userEmail,
      });
    }

    const client = getDodoClient();
    let dodoCheckoutPaymentSucceeded = false;

    // First try the exact subscription id Dodo appends to subscription return URLs.
    // The id from the URL is only a hint; we verify it with Dodo before trusting it.
    if (returnedSubscriptionId && isSubscriptionCheckout(checkoutSession.plan_id)) {
      try {
        const subscription = await client.subscriptions.retrieve(returnedSubscriptionId);

        if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          const completed = await completeFromDodoSubscription(
            supabase,
            checkoutSession,
            subscription,
            isAuthenticated,
            userEmail
          );
          if (completed) return completed;
        }

        if (FAILED_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          const message = await failCheckout(supabase, checkoutSession, 'Dodo could not activate this subscription.');
          return statusResponse({
            status: 'failed',
            success: false,
            message,
            checkoutSession,
            isAuthenticated,
            userEmail,
          });
        }
      } catch (error) {
        console.error('[Checkout Status] Exact Dodo subscription check failed:', error);
      }
    }

    // Then inspect the checkout session itself. This catches Indian card/UPI
    // flows where Dodo has accepted details but the final mandate/payment result
    // is still processing.
    try {
      const dodoCheckout = await client.checkoutSessions.retrieve(checkoutSession.session_id);
      const paymentStatus = dodoCheckout.payment_status || null;

      if (paymentStatus && FAILED_PAYMENT_STATUSES.has(paymentStatus)) {
        const message = await failCheckout(supabase, checkoutSession, 'Dodo reported that the payment failed.');
        return statusResponse({
          status: 'failed',
          success: false,
          message,
          checkoutSession,
          isAuthenticated,
          userEmail,
        });
      }

      if (paymentStatus && PROCESSING_PAYMENT_STATUSES.has(paymentStatus)) {
        await allowPendingDashboardAccess(supabase, checkoutSession);

        return statusResponse({
          status: 'processing',
          message: 'Payment verification is still processing.',
          checkoutSession,
          isAuthenticated,
          userEmail,
        });
      }

      if (paymentStatus && SUCCEEDED_PAYMENT_STATUSES.has(paymentStatus)) {
        dodoCheckoutPaymentSucceeded = true;

        // Dodo redirect gap - 2026-05-18 13:01 IST, paras: a verified checkout can be paid before the subscription/webhook row is visible.
        await allowPendingDashboardAccess(supabase, checkoutSession);
      }
    } catch (error) {
      console.error('[Checkout Status] Dodo checkout session check failed:', error);
    }

    // Finally, list the customer's recent subscriptions and look for a matching
    // active subscription. This covers webhook delay and return URLs that do not
    // include subscription_id.
    try {
      const { data: user } = await supabase
        .from('users')
        .select('dodo_customer_id')
        .eq('id', checkoutSession.user_id)
        .single();

      if (user?.dodo_customer_id && isSubscriptionCheckout(checkoutSession.plan_id)) {
        const subs = await client.subscriptions.list({
          customer_id: user.dodo_customer_id,
          page_size: 10,
        });

        const matchingSubs = (subs.items || []).filter((subscription: any) => {
          const planId = subscription.product_id ? getPlanFromDodoProductId(subscription.product_id) : null;
          return planId === checkoutSession.plan_id
            && isRecentEnoughForCheckout(subscription.created_at, checkoutSession.created_at);
        });

        const failedSub = matchingSubs.find((subscription: any) => FAILED_SUBSCRIPTION_STATUSES.has(subscription.status));
        if (failedSub) {
          const message = await failCheckout(supabase, checkoutSession, 'Dodo could not activate this subscription.');
          return statusResponse({
            status: 'failed',
            success: false,
            message,
            checkoutSession,
            isAuthenticated,
            userEmail,
          });
        }

        const activeSub = matchingSubs.find((subscription: any) => ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status));
        if (activeSub) {
          const completed = await completeFromDodoSubscription(
            supabase,
            checkoutSession,
            activeSub,
            isAuthenticated,
            userEmail
          );
          if (completed) return completed;
        }
      }
    } catch (error) {
      console.error('[Checkout Status] Dodo subscription list check failed:', error);
    }

    if (dodoCheckoutPaymentSucceeded) {
      return statusResponse({
        status: 'processing',
        message: isSubscriptionCheckout(checkoutSession.plan_id)
          ? 'Payment confirmed by Dodo. Finishing trial setup...'
          : 'Payment confirmed by Dodo. Updating your wallet...',
        checkoutSession,
        isAuthenticated,
        userEmail,
      });
    }

    return statusResponse({
      status: 'pending',
      message: 'Activating your free trial...',
      checkoutSession,
      isAuthenticated,
      userEmail,
    });
  } catch (error) {
    console.error('[Checkout Status] Error:', error);
    return NextResponse.json(
      { success: false, status: 'failed', message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
