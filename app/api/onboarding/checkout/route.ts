// =============================================================================
// ONBOARDING CHECKOUT API
// =============================================================================
//
// Creates a Dodo Payments checkout session during onboarding with 7-day trial.
// This endpoint saves the user's selected plan and redirects them to Dodo's
// hosted checkout page to securely enter their payment details.
//
// FLOW (Updated 2nd Jan 2026 - Fixed session loss issue):
// 1. User selects plan in onboarding Step 3
// 2. User clicks "Start Free Trial"
// 3. This endpoint saves progress and creates Dodo checkout session
// 4. *** NEW: We save the session to checkout_sessions table ***
// 5. User is redirected to Dodo's hosted checkout page
// 6. User enters card details on Dodo's secure page
// 7. *** NEW: Dodo redirects to /checkout/callback (unprotected route) ***
// 8. Webhook fires and marks checkout_sessions.status = 'completed'
// 9. Callback page polls /api/checkout/status until webhook confirms
// 10. Once confirmed, onboarding is completed and user goes to dashboard
//
// WHY THE CHANGE (2nd Jan 2026):
// Previously, Dodo redirected to /onboarding?checkout=success. But /onboarding
// is a protected route. After cross-origin redirect from Dodo, the user's
// auth session cookies might not be sent (browser security policies), causing
// the middleware to redirect them to /login. This broke the flow.
//
// SOLUTION:
// - Redirect to /checkout/callback (unprotected route)
// - Store checkout session in DB with user info BEFORE redirect
// - Webhook marks session as 'completed' (source of truth)
// - Callback page verifies payment via DB, not URL params
// - Complete onboarding based on webhook confirmation, not redirect
//
// SECURITY:
// - Card details are entered on Dodo's hosted page (PCI compliant)
// - Our server NEVER sees the actual card number
// - 7-day trial means user isn't charged immediately
// - We NEVER trust URL params for payment verification
// - Only the webhook (with signature verification) can confirm payment
//
// Created: 2nd January 2026
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getDodoClient,
  getDodoProductId,
  isValidWalletPlan,
  withDodoErrorHandling,
  DodoError,
} from '@/lib/dodo';
import { WALLET_PLANS, formatCredits } from '@/lib/wallet';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingCheckoutRequest {
  /** Plan ID: 'pro', 'growth', or 'scale' */
  planId: string;
  /** Billing period: 'monthly' or 'annual' */
  billingPeriod: 'monthly' | 'annual';
}

// =============================================================================
// POST /api/onboarding/checkout
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: Authenticate user
    // =========================================================================
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      );
    }

    // =========================================================================
    // STEP 2: Parse and validate request body
    // =========================================================================
    let body: OnboardingCheckoutRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { planId, billingPeriod } = body;

    // Validate planId
    if (!planId || !isValidWalletPlan(planId)) {
      return NextResponse.json(
        { error: `Invalid plan: ${planId}. Valid plans are: pro, growth, scale` },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!billingPeriod || !['monthly', 'annual'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period. Must be "monthly" or "annual"' },
        { status: 400 }
      );
    }

    const planConfig = WALLET_PLANS[planId as keyof typeof WALLET_PLANS];

    // =========================================================================
    // STEP 3: Get user and create/retrieve Dodo customer
    // =========================================================================
    const user = await getOrCreateUser(userEmail);
    const supabase = await createClient();

    // Check if user already has a Dodo customer ID
    // @ts-ignore - dodo_customer_id is added via migration
    let dodoCustomerId = user.dodo_customer_id;

    if (!dodoCustomerId) {
      // Create a new Dodo customer
      const client = getDodoClient();

      const customer = await withDodoErrorHandling(
        () => client.customers.create({
          email: userEmail,
          name: user.full_name || userEmail.split('@')[0],
        }),
        'creating Dodo customer'
      );

      dodoCustomerId = customer.customer_id;

      // Save the customer ID to the user record
      await supabase
        .from('users')
        .update({
          dodo_customer_id: dodoCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      console.log('[Onboarding Checkout] Created Dodo customer:', {
        userId: user.id,
        dodoCustomerId,
      });
    }

    // =========================================================================
    // STEP 4: Save onboarding progress (plan selection)
    // =========================================================================
    // Save the selected plan so we can reference it after checkout completes
    await supabase
      .from('users')
      .update({
        selected_plan: planId,
        billing_period: billingPeriod,
        onboarding_step: 3, // Mark that they're at step 3
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    console.log('[Onboarding Checkout] Saved plan selection:', {
      userId: user.id,
      planId,
      billingPeriod,
    });

    // =========================================================================
    // STEP 5: Get Dodo product ID and create checkout session
    // =========================================================================
    let productId: string;
    try {
      productId = getDodoProductId(planId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid plan configuration. Please contact support.' },
        { status: 400 }
      );
    }

    const client = getDodoClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.guffles.com';

    // =========================================================================
    // STEP 5a: Generate callback token (2nd Jan 2026 - FIX)
    // =========================================================================
    // WHY: Dodo doesn't replace placeholders like {CHECKOUT_SESSION_ID} in URLs.
    // So we generate our own unique token BEFORE creating the Dodo session,
    // include it in the return URL, and use it to look up the session later.
    //
    // This token is NOT for security - it's just for lookup. The actual
    // payment verification happens via the webhook marking status='completed'.
    // =========================================================================
    const callbackToken = crypto.randomUUID();
    const returnUrl = `${baseUrl}/checkout/callback?token=${callbackToken}`;

    console.log('[Onboarding Checkout] Generated callback token:', {
      callbackToken,
      returnUrl,
    });

    // =========================================================================
    // STEP 5b: Create Dodo checkout session
    // =========================================================================
    const checkoutSession = await withDodoErrorHandling(
      () => client.checkoutSessions.create({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        customer: {
          customer_id: dodoCustomerId,
        },
        // Use our callback token in the return URL
        return_url: returnUrl,
        metadata: {
          user_id: user.id,
          plan_id: planId,
          billing_period: billingPeriod,
          user_email: userEmail,
          callback_token: callbackToken, // Include for traceability
          source: 'onboarding',
        },
        // 7-day free trial - user won't be charged until trial ends
        subscription_data: {
          trial_period_days: 7,
        },
      }),
      'creating onboarding checkout session'
    );

    console.log('[Onboarding Checkout] Created checkout session:', {
      sessionId: checkoutSession.session_id,
      userId: user.id,
      planId,
      billingPeriod,
      trialDays: 7,
      returnUrl,
    });

    // Save checkout session — uses admin client to bypass RLS
    const adminSupabase = createAdminClient();
    const { error: sessionError } = await adminSupabase
      .from('checkout_sessions')
      .insert({
        session_id: checkoutSession.session_id,
        callback_token: callbackToken,
        user_id: user.id,
        user_email: userEmail,
        plan_id: planId,
        billing_period: billingPeriod,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    if (sessionError) {
      console.error('[Onboarding Checkout] Failed to save checkout session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to initialize checkout session. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[Onboarding Checkout] Saved checkout session:', {
      sessionId: checkoutSession.session_id,
      callbackToken,
      userId: user.id,
    });

    // =========================================================================
    // STEP 6: Log checkout initiation for analytics
    // =========================================================================
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'onboarding_checkout_initiated',
      metadata: {
        plan_id: planId,
        billing_period: billingPeriod,
        session_id: checkoutSession.session_id,
        credits_to_receive: planConfig.totalCredits,
        return_url: returnUrl, // Log the new return URL for debugging
      },
      created_at: new Date().toISOString(),
    });

    // =========================================================================
    // STEP 7: Return checkout URL
    // =========================================================================
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.checkout_url,
      sessionId: checkoutSession.session_id,
      planDetails: {
        id: planId,
        name: planConfig.name,
        price: formatCredits(planConfig.priceInCents) + '/mo',
        credits: formatCredits(planConfig.totalCredits),
        trialDays: 7,
      },
    });
  } catch (error) {
    console.error('[Onboarding Checkout] Error:', error);

    if (error instanceof DodoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
