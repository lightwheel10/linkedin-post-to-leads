// Dodo Payments webhook handler for wallet-based billing.
// Security: signature verification, timestamp validation, idempotent processing.
// subscription.active marks checkout completed (fires immediately, even with trial).
// payment.succeeded resets wallet credits (fires after trial or on renewal).

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

// Raw body needed for signature verification
export const runtime = 'nodejs';

/** POST /api/webhooks/dodo — processes Dodo payment/subscription events */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract headers and body
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

    // Validate timestamp (prevents replay attacks)
    if (timestamp && !isWebhookTimestampValid(timestamp)) {
      console.error('[Dodo Webhook] Invalid or expired timestamp');
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 401 }
      );
    }

    // Verify webhook signature (HMAC-SHA256)
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

    // Parse payload
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

    // Idempotency: skip duplicate events
    const supabase = createAdminClient();

    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', event_id)
      .single();

    if (existingEvent) {
      console.log('[Dodo Webhook] Duplicate event, skipping:', event_id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Process event
    let processingResult: { success: boolean; message?: string } = { success: true };

    switch (event_type) {
      case DodoWebhookEvents.PAYMENT_SUCCEEDED:
        processingResult = await handlePaymentSucceeded(data);
        break;

      case DodoWebhookEvents.PAYMENT_FAILED:
        processingResult = await handlePaymentFailed(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_ACTIVE:
        processingResult = await handleSubscriptionActive(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_UPDATED:
        processingResult = await handleSubscriptionUpdated(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_CANCELLED:
        processingResult = await handleSubscriptionCancelled(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_EXPIRED:
        processingResult = await handleSubscriptionExpired(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_RENEWED:
        processingResult = await handleSubscriptionRenewed(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_TRIAL_ENDING:
        processingResult = await handleTrialEnding(data);
        break;

      default:
        console.log('[Dodo Webhook] Unhandled event type:', event_type);
        // Still return 200 - we don't want Dodo to retry for unhandled events
    }

    // Record event for idempotency
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

/**
 * Handles payment.succeeded — resets wallet credits for the billing cycle.
 * Previous balance is forfeited, new balance set to plan's credit amount.
 */
async function handlePaymentSucceeded(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id, product_id, payment_id } = data;

  try {
    console.log('[Dodo Webhook] Payment succeeded:', {
      payment_id,
      subscription_id,
      product_id,
    });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, wallet_balance, plan')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (userError || !user) {
      console.error('[Dodo Webhook] User not found for customer:', customer_id);
      return { success: false, message: 'User not found' };
    }

    const planId = getPlanFromDodoProductId(product_id || '');

    if (!planId || !isWalletPlan(planId)) {
      console.error('[Dodo Webhook] Invalid or unknown product:', product_id);
      return { success: false, message: 'Unknown product' };
    }

    // Reset wallet — previous balance forfeited, new balance = plan credits
    const previousBalance = user.wallet_balance || 0;
    const planConfig = WALLET_PLANS[planId];

    const walletResult = await resetWalletCredits(user.id, planId, supabase);

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

    // Log the payment for analytics
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'payment_succeeded',
      metadata: {
        plan: planId,
        payment_id,
        subscription_id,
        credits_allocated: planConfig.totalCredits,
        credits_forfeited: previousBalance,
      },
      created_at: new Date().toISOString(),
    });

    return { success: true, message: `Wallet reset to ${formatCredits(walletResult.newBalance)}` };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling payment.succeeded:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles payment.failed — marks subscription past_due, keeps wallet credits. */
async function handlePaymentFailed(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Payment failed:', { subscription_id });

    // Mark past_due — user keeps credits, Dodo sends subscription.expired after grace period
    if (subscription_id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('dodo_subscription_id', subscription_id);
    }

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
 * Handles subscription activation — primary trigger for checkout completion.
 * Fires immediately even with trial. Sets up subscription record, user plan, and completes checkout.
 */
async function handleSubscriptionActive(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id, product_id, status } = data;
  const metadata = (data as Record<string, unknown>).metadata as Record<string, string> | undefined;

  try {
    console.log('[Dodo Webhook] Subscription active:', {
      subscription_id,
      product_id,
      status,
      has_metadata: !!metadata,
    });

    const planId = getPlanFromDodoProductId(product_id || '');
    if (!planId) {
      console.warn('[Dodo Webhook] Unknown product_id:', product_id);
      return { success: true, message: 'Unknown product' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (!user) {
      console.warn('[Dodo Webhook] User not found for customer:', customer_id);
      return { success: false, message: 'User not found' };
    }

    // Upsert subscription record
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('dodo_subscription_id', subscription_id)
      .single();

    const subscriptionData = {
      user_id: user.id,
      plan: planId,
      period: 'monthly',
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

    // Set user plan fields
    await supabase
      .from('users')
      .update({
        plan: planId,
        plan_started_at: now.toISOString(),
        plan_expires_at: periodEnd.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        analyses_used: 0,
        enrichments_used: 0,
        usage_reset_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', user.id);

    // Mark checkout session as completed (webhook is sole authority)
    // Match by callback_token from metadata first, fall back to user_id + pending
    let pendingSession = null;

    if (metadata?.callback_token) {
      const { data: session } = await supabase
        .from('checkout_sessions')
        .select('id, session_id')
        .eq('callback_token', metadata.callback_token)
        .eq('status', 'pending')
        .single();
      pendingSession = session;
    }

    if (!pendingSession) {
      const { data: session } = await supabase
        .from('checkout_sessions')
        .select('id, session_id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      pendingSession = session;
    }

    if (pendingSession) {
      await supabase
        .from('checkout_sessions')
        .update({
          status: 'completed',
          completed_at: now.toISOString(),
          dodo_subscription_id: subscription_id || null,
          updated_at: now.toISOString(),
        })
        .eq('id', pendingSession.id);

      console.log('[Dodo Webhook] Checkout session completed:', pendingSession.session_id);
    }

    // Complete onboarding (idempotent)
    try {
      await completeOnboarding(user.email, supabase);
      console.log('[Dodo Webhook] Onboarding completed for:', user.email);
    } catch (err) {
      console.error('[Dodo Webhook] Failed to complete onboarding:', err);
    }

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.active:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles subscription.updated — plan changes, status changes. Wallet reset on next payment. */
async function handleSubscriptionUpdated(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id, product_id, status } = data;

  try {
    console.log('[Dodo Webhook] Subscription updated:', {
      subscription_id,
      product_id,
      status,
    });

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

      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.updated:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles subscription.cancelled — keeps wallet until period ends. */
async function handleSubscriptionCancelled(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Subscription cancelled:', { subscription_id });

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_subscription_id', subscription_id);

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

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.cancelled:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles subscription.expired — clears wallet, downgrades to free. */
async function handleSubscriptionExpired(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Subscription expired:', { subscription_id });

    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_subscription_id', subscription_id);

    const { data: user } = await supabase
      .from('users')
      .select('id, wallet_balance')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (user) {
      const clearResult = await clearWalletBalance(
        user.id,
        'Subscription expired - remaining credits forfeited',
        supabase
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

/** Handles subscription.renewed — updates period dates. Wallet reset via payment.succeeded. */
async function handleSubscriptionRenewed(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Subscription renewed:', { subscription_id });

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

    return { success: true };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription.renewed:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles subscription.trial_ending — notification before trial expires. */
async function handleTrialEnding(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { customer_id, subscription_id } = data;

  try {
    console.log('[Dodo Webhook] Trial ending soon:', { subscription_id });

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
