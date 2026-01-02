// =============================================================================
// ONBOARDING CHECKOUT API
// =============================================================================
//
// Creates a Dodo Payments checkout session during onboarding with 7-day trial.
// This endpoint saves the user's selected plan and redirects them to Dodo's
// hosted checkout page to securely enter their payment details.
//
// FLOW:
// 1. User selects plan in onboarding Step 3
// 2. User clicks "Start Free Trial"
// 3. This endpoint saves progress and creates Dodo checkout session
// 4. User is redirected to Dodo's hosted checkout page
// 5. User enters card details on Dodo's secure page
// 6. Dodo redirects back to /onboarding?checkout=success
// 7. Webhook fires to confirm subscription creation
// 8. Onboarding is completed, user redirected to dashboard
//
// SECURITY:
// - Card details are entered on Dodo's hosted page (PCI compliant)
// - Our server NEVER sees the actual card number
// - 7-day trial means user isn't charged immediately
//
// Created: 2nd January 2026
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import { createClient } from '@/lib/supabase/server';
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guffles.com';

    // Return URL includes query params to indicate successful checkout
    const returnUrl = `${baseUrl}/onboarding?checkout=success&plan=${planId}`;

    // Create checkout session with 7-day trial
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
        return_url: returnUrl,
        metadata: {
          user_id: user.id,
          plan_id: planId,
          billing_period: billingPeriod,
          user_email: userEmail,
          source: 'onboarding', // Mark this as from onboarding flow
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
