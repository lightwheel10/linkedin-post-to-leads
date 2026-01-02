// =============================================================================
// CHECKOUT SESSION API
// =============================================================================
//
// Creates a Dodo Payments checkout session for subscription purchases.
//
// WALLET-BASED BILLING MODEL:
// ===========================
// Users subscribe to plans that give them wallet credits each billing cycle:
// - Pro ($79/mo) → $150 wallet credits
// - Growth ($179/mo) → $300 wallet credits
// - Scale ($279/mo) → $500 wallet credits
//
// CHECKOUT FLOW:
// ==============
// 1. User selects a plan in the UI (pricing page or settings)
// 2. Frontend calls POST /api/billing/checkout with plan ID
// 3. This endpoint creates a Dodo checkout session
// 4. Frontend redirects user to the checkout URL
// 5. User enters payment details on Dodo's hosted checkout page
// 6. After payment, user is redirected back to success URL
// 7. Dodo sends payment.succeeded webhook → wallet is reset to plan credits
//
// IMPORTANT NOTES:
// ================
// - Free plan users can upgrade to any paid plan
// - Existing subscribers can switch plans (proration handled by Dodo)
// - All plans are monthly (no annual billing for wallet model)
//
// Created: 2nd January 2026
// Last Updated: 2nd January 2026 - Wallet-based billing model
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

/**
 * Request body for creating a checkout session.
 */
interface CheckoutRequest {
  /** Plan ID: 'pro', 'growth', or 'scale' */
  planId: string;
  /** Optional URL to redirect after successful payment */
  successUrl?: string;
  /** Optional URL to redirect if user cancels */
  cancelUrl?: string;
}

// =============================================================================
// POST /api/billing/checkout
// =============================================================================

/**
 * Creates a Dodo checkout session for the specified plan.
 *
 * This endpoint:
 * 1. Validates the user is authenticated
 * 2. Validates the plan ID is a valid wallet plan
 * 3. Creates or retrieves the Dodo customer
 * 4. Creates a checkout session with the subscription product
 * 5. Returns the checkout URL for redirect
 *
 * Request body:
 * {
 *   "planId": "pro",        // Required: pro, growth, or scale
 *   "successUrl": "...",    // Optional: override default success URL
 *   "cancelUrl": "..."      // Optional: override default cancel URL
 * }
 *
 * Response:
 * {
 *   "checkoutUrl": "https://checkout.dodopayments.com/...",
 *   "sessionId": "sess_xxx",
 *   "planDetails": {
 *     "name": "Pro",
 *     "price": "$79/mo",
 *     "credits": "$150"
 *   }
 * }
 */
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
    let body: CheckoutRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { planId, successUrl, cancelUrl } = body;

    // -------------------------------------------------------------------------
    // Validate planId is a valid wallet plan
    // -------------------------------------------------------------------------
    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId. Please specify a plan.' },
        { status: 400 }
      );
    }

    if (!isValidWalletPlan(planId)) {
      return NextResponse.json(
        {
          error: `Invalid plan: ${planId}. Valid plans are: pro, growth, scale`,
          validPlans: Object.keys(WALLET_PLANS),
        },
        { status: 400 }
      );
    }

    // Get plan config for response
    const planConfig = WALLET_PLANS[planId as keyof typeof WALLET_PLANS];

    // =========================================================================
    // STEP 3: Get or create user and Dodo customer
    // =========================================================================
    const user = await getOrCreateUser(userEmail);
    const supabase = await createClient();

    // Check if user already has a Dodo customer ID
    // @ts-ignore - dodo_customer_id is added via migration
    let dodoCustomerId = user.dodo_customer_id;

    if (!dodoCustomerId) {
      // -----------------------------------------------------------------------
      // Create a new Dodo customer
      // -----------------------------------------------------------------------
      // This links the user's email to a Dodo customer account.
      // The customer ID is stored in our database for future lookups.
      // -----------------------------------------------------------------------
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

      console.log('[Checkout] Created Dodo customer:', {
        userId: user.id,
        dodoCustomerId,
      });
    }

    // =========================================================================
    // STEP 4: Get Dodo product ID for the selected plan
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

    // =========================================================================
    // STEP 5: Create checkout session
    // =========================================================================
    const client = getDodoClient();

    // Determine redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guffles.com';
    const defaultSuccessUrl = `${baseUrl}/dashboard?checkout=success&plan=${planId}`;
    const defaultCancelUrl = `${baseUrl}/pricing?checkout=cancelled`;

    // Create the checkout session
    // This returns a URL where the user can enter payment details
    const checkoutSession = await withDodoErrorHandling(
      () => client.checkoutSessions.create({
        // Product to purchase (subscription)
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        // Link to existing customer
        customer: {
          customer_id: dodoCustomerId,
        },
        // Redirect URL after checkout (success or cancel)
        return_url: successUrl || defaultSuccessUrl,
        // Metadata for tracking (passed through to webhooks)
        metadata: {
          user_id: user.id,
          plan_id: planId,
          user_email: userEmail,
        },
      }),
      'creating checkout session'
    );

    console.log('[Checkout] Created checkout session:', {
      sessionId: checkoutSession.session_id,
      userId: user.id,
      planId,
      credits: formatCredits(planConfig.totalCredits),
    });

    // =========================================================================
    // STEP 6: Log checkout initiation for analytics
    // =========================================================================
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'checkout_initiated',
      metadata: {
        plan_id: planId,
        session_id: checkoutSession.session_id,
        credits_to_receive: planConfig.totalCredits,
      },
      created_at: new Date().toISOString(),
    });

    // =========================================================================
    // STEP 7: Return checkout URL with plan details
    // =========================================================================
    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url,
      sessionId: checkoutSession.session_id,
      planDetails: {
        id: planId,
        name: planConfig.name,
        price: formatCredits(planConfig.priceInCents) + '/mo',
        credits: formatCredits(planConfig.totalCredits),
        breakdown: {
          base: formatCredits(planConfig.baseCredits),
          bonus: formatCredits(planConfig.bonusCredits),
        },
      },
    });
  } catch (error) {
    console.error('[Checkout] Error:', error);

    // Handle known Dodo errors
    if (error instanceof DodoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
