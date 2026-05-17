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
  getCustomerId,
  getCreditPackFromProductId,
  isCreditPackProduct,
} from '@/lib/dodo';
import {
  resetWalletCredits,
  clearWalletBalance,
  addPurchasedCredits,
  WalletPlanId,
  isWalletPlan,
  isValidCreditPack,
  formatCredits,
  WALLET_PLANS,
  CREDIT_PACKS,
} from '@/lib/wallet';
import { syncActiveDodoSubscription } from '@/lib/dodo-subscription-sync';

// Raw body needed for signature verification
export const runtime = 'nodejs';

// Per-instance IP rate limiter (no external dependencies).
// 200 req/min per IP — generous enough for Dodo retry bursts, blocks abuse.
// Vercel's infrastructure handles cross-instance DDoS.
const ipRequests = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();
const RATE_LIMIT = 200;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Lazy cleanup: purge expired entries every 60s
  if (now - lastCleanup > WINDOW_MS) {
    for (const [key, entry] of ipRequests) {
      if (now > entry.resetAt) ipRequests.delete(key);
    }
    lastCleanup = now;
  }

  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    console.warn('[Dodo Webhook] Rate limited IP:', ip, 'count:', entry.count);
    return true;
  }
  return false;
}

/** POST /api/webhooks/dodo — processes Dodo payment/subscription events */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limit by IP — reject before any body parsing or crypto
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

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

    console.log('[Dodo Webhook] Headers:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasWebhookId: !!webhookId,
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

    const { type: eventType, data } = payload;

    console.log('[Dodo Webhook] Received event:', {
      type: eventType,
      webhookId,
      customerId: getCustomerId(data),
      subscriptionId: data?.subscription_id,
      productId: data?.product_id,
    });

    // Idempotency: skip duplicate events (webhook-id header is the unique event identifier)
    const supabase = createAdminClient();

    if (webhookId) {
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('event_id', webhookId)
        .single();

      if (existingEvent) {
        console.log('[Dodo Webhook] Duplicate event, skipping:', webhookId);
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    // Process event
    let processingResult: { success: boolean; message?: string } = { success: true };

    switch (eventType) {
      case DodoWebhookEvents.PAYMENT_SUCCEEDED:
        processingResult = await handlePaymentSucceeded(data);
        break;

      case DodoWebhookEvents.PAYMENT_PROCESSING:
        processingResult = await handlePaymentProcessing(data);
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

      case DodoWebhookEvents.SUBSCRIPTION_FAILED:
      case DodoWebhookEvents.SUBSCRIPTION_ON_HOLD:
        processingResult = await handleSubscriptionUnavailable(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_RENEWED:
        processingResult = await handleSubscriptionRenewed(data);
        break;

      case DodoWebhookEvents.SUBSCRIPTION_TRIAL_ENDING:
        processingResult = await handleTrialEnding(data);
        break;

      default:
        console.log('[Dodo Webhook] Unhandled event type:', eventType);
        // Still return 200 - we don't want Dodo to retry for unhandled events
    }

    // Record event for idempotency
    await supabase.from('webhook_events').insert({
      event_id: webhookId,
      event_type: eventType,
      payload: data,
      processed_at: new Date().toISOString(),
      processing_result: processingResult,
    });

    const duration = Date.now() - startTime;
    console.log('[Dodo Webhook] Event processed:', {
      eventId: webhookId,
      type: eventType,
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
  const customer_id = getCustomerId(data);
  const { subscription_id, product_id, payment_id } = data;

  try {
    console.log('[Dodo Webhook] Payment succeeded:', {
      payment_id,
      subscription_id,
      product_id,
    });

    // -----------------------------------------------------------------------
    // CREDIT PACK CHECK — must run BEFORE subscription plan logic.
    // One-time credit pack payments should NOT trigger subscription updates,
    // onboarding completion, or wallet resets.
    //
    // We check both product_id and metadata.type as fallbacks, since
    // one-time payment webhooks may structure data differently than
    // subscription payments.
    // -----------------------------------------------------------------------
    const isTopUpPayment = (product_id && isCreditPackProduct(product_id))
      || (data.metadata?.type === 'topup' && data.metadata?.pack_id);

    if (isTopUpPayment) {
      const creditPackId = (product_id && getCreditPackFromProductId(product_id))
        || data.metadata?.pack_id as string | undefined;

      if (!creditPackId || !isValidCreditPack(creditPackId)) {
        console.error('[Dodo Webhook] Invalid credit pack in payment:', { product_id, metadata: data.metadata });
        return { success: false, message: 'Invalid credit pack product' };
      }

      const pack = CREDIT_PACKS[creditPackId];

      // Find user by customer_id
      const { data: packUser, error: packUserError } = await supabase
        .from('users')
        .select('id, email')
        .eq('dodo_customer_id', customer_id)
        .single();

      if (packUserError || !packUser) {
        console.error('[Dodo Webhook] User not found for credit pack payment:', customer_id);
        return { success: false, message: 'User not found for credit pack' };
      }

      // Add purchased credits atomically via RPC
      const addResult = await addPurchasedCredits(
        packUser.id,
        pack.creditsInCents,
        creditPackId,
        { payment_id, dodo_product_id: product_id },
        supabase  // Pass admin client from webhook context (bypasses RLS)
      );

      if (!addResult.success) {
        console.error('[Dodo Webhook] Failed to add purchased credits:', addResult.error);
        return { success: false, message: addResult.error };
      }

      // Mark any pending topup checkout session as completed.
      // The checkout callback page polls /api/checkout/status which checks this.
      const { data: pendingTopup } = await supabase
        .from('checkout_sessions')
        .select('id')
        .eq('user_id', packUser.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingTopup) {
        await supabase
          .from('checkout_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingTopup.id);
      }

      console.log('[Dodo Webhook] Credit pack applied:', {
        userId: packUser.id,
        packId: creditPackId,
        credits: formatCredits(pack.creditsInCents),
        newBalance: formatCredits(addResult.newBalance),
      });

      // Log for analytics
      await supabase.from('usage_logs').insert({
        user_id: packUser.id,
        action: 'credit_pack_purchased',
        metadata: {
          pack_id: creditPackId,
          credits_added: pack.creditsInCents,
          payment_id,
          new_balance: addResult.newBalance,
        },
        created_at: new Date().toISOString(),
      });

      // Return early — do NOT fall through to subscription logic
      return { success: true, message: `Credit pack ${creditPackId} applied: +${formatCredits(pack.creditsInCents)}` };
    }
    // -----------------------------------------------------------------------
    // END credit pack handling — subscription logic continues below
    // -----------------------------------------------------------------------

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, wallet_balance, plan, selected_plan, trial_ends_at')
      .eq('dodo_customer_id', customer_id)
      .single();

    if (userError || !user) {
      console.error('[Dodo Webhook] User not found for customer:', customer_id);
      return { success: false, message: 'User not found' };
    }

    // Payment events may not include product_id — look up from subscription or user
    let planId = product_id ? getPlanFromDodoProductId(product_id) : null;

    if (!planId && subscription_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('dodo_subscription_id', subscription_id)
        .single();
      planId = sub?.plan || null;
    }

    const isTrialCurrentlyActive = !!user.trial_ends_at && new Date(user.trial_ends_at) > new Date();

    if (isTrialCurrentlyActive) {
      return { success: true, message: 'Trial payment acknowledged; credits already allocated on subscription activation' };
    }

    if (!planId) {
      planId = user.plan !== 'free' ? user.plan : user.selected_plan;
    }

    if (!planId || !isWalletPlan(planId)) {
      console.warn('[Dodo Webhook] Payment arrived before subscription activation:', {
        product_id, subscription_id, userPlan: user.plan,
      });
      return { success: true, message: 'Waiting for subscription activation to allocate credits' };
    }

    // Reset wallet — previous balance forfeited, new balance = plan credits
    const previousBalance = user.wallet_balance || 0;
    const planConfig = WALLET_PLANS[planId];

    const walletResult = await resetWalletCredits(user.id, planId, supabase, {
      idempotencyKey: payment_id ? `payment:${payment_id}` : undefined,
      source: 'payment_succeeded',
    });

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

/** Handles payment.processing - Dodo is still verifying the payment. */
async function handlePaymentProcessing(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const customer_id = getCustomerId(data);

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('dodo_customer_id', customer_id)
      .maybeSingle();

    if (user) {
      await supabase
        .from('checkout_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'pending');
    }

    return { success: true, message: 'Payment is still processing' };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling payment.processing:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles payment.failed — marks subscription past_due, keeps wallet credits. */
async function handlePaymentFailed(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const customer_id = getCustomerId(data);
  const { subscription_id } = data;

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
      .maybeSingle();

    if (user) {
      await supabase
        .from('checkout_sessions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'pending');

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
  const { subscription_id, product_id, status } = data;
  try {
    console.log('[Dodo Webhook] Subscription active:', {
      subscription_id,
      product_id,
      status,
    });

    return await syncActiveDodoSubscription({
      subscription: data,
      fallbackPlanId: product_id ? getPlanFromDodoProductId(product_id) : null,
    }, supabase);
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
  const customer_id = getCustomerId(data);
  const { subscription_id, product_id, status } = data;

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
  const customer_id = getCustomerId(data);
  const { subscription_id } = data;

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

/** Handles subscription.failed/on_hold during checkout verification. */
async function handleSubscriptionUnavailable(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const customer_id = getCustomerId(data);
  const { subscription_id, status } = data;

  try {
    await supabase
      .from('subscriptions')
      .update({
        status: mapDodoSubscriptionStatus(status || 'failed'),
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_subscription_id', subscription_id);

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('dodo_customer_id', customer_id)
      .maybeSingle();

    if (user) {
      await supabase
        .from('checkout_sessions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'pending');
    }

    return { success: true, message: `Subscription is ${status || 'unavailable'}` };
  } catch (error) {
    console.error('[Dodo Webhook] Error handling subscription unavailable:', error);
    return { success: false, message: String(error) };
  }
}

/** Handles subscription.expired — clears wallet, downgrades to free. */
async function handleSubscriptionExpired(
  data: DodoWebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const customer_id = getCustomerId(data);
  const { subscription_id } = data;

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
  const customer_id = getCustomerId(data);
  const { subscription_id } = data;

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
