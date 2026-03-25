// =============================================================================
// CREDIT TOP-UP CHECKOUT API
// =============================================================================
//
// Creates a Dodo one-time payment checkout for credit pack purchases.
//
// DIFFERENCE FROM SUBSCRIPTION CHECKOUT:
// ======================================
// - app/api/billing/checkout creates SUBSCRIPTION checkouts (recurring)
// - app/api/onboarding/checkout creates SUBSCRIPTION checkouts during onboarding
// - THIS endpoint creates ONE-TIME PAYMENT checkouts for credit packs
//
// Purchased credits persist across billing cycles (unlike plan credits).
// Only available to users on paid plans (pro, growth, scale).
//
// FLOW:
// =====
// 1. User clicks "Buy Credits" in settings or analyze page
// 2. Frontend POST /api/billing/topup with { packId: 'credit_10' | 'credit_25' | 'credit_50' }
// 3. This endpoint validates plan, creates Dodo checkout, saves session
// 4. Frontend redirects user to Dodo checkout URL
// 5. After payment, Dodo redirects to /checkout/callback?token=xxx&type=topup
// 6. Dodo sends payment.succeeded webhook → credits added atomically
//
// RATE LIMITING:
// ==============
// Max 5 checkout initiations per 24 hours per user.
// Intentionally counts attempts (not completions) to prevent repeated
// card charge attempts with stolen cards.
//
// Created: 25th March 2026
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getDodoClient,
  getCreditPackProductId,
  withDodoErrorHandling,
  DodoError,
} from '@/lib/dodo';
import { isValidCreditPack, CREDIT_PACKS, formatCredits, isWalletPlan } from '@/lib/wallet';

// =============================================================================
// POST /api/billing/topup
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
    let body: { packId: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { packId } = body;

    if (!packId || !isValidCreditPack(packId)) {
      return NextResponse.json(
        { error: `Invalid pack. Valid packs: ${Object.keys(CREDIT_PACKS).join(', ')}` },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 3: Validate user is on a paid plan
    // =========================================================================
    const user = await getOrCreateUser(userEmail);

    // Only paid plan users can top up — free users should upgrade first
    if (!user.plan || !isWalletPlan(user.plan)) {
      return NextResponse.json(
        { error: 'Credit top-up is available for paid plan subscribers only. Please upgrade first.' },
        { status: 403 }
      );
    }

    // =========================================================================
    // STEP 4: Rate limit — max 5 checkout initiations per 24 hours
    // =========================================================================
    const supabase = await createClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action', 'topup_checkout_initiated')
      .gte('created_at', twentyFourHoursAgo);

    if ((count || 0) >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 credit purchases per day. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    const pack = CREDIT_PACKS[packId];

    // =========================================================================
    // STEP 5: Get or create Dodo customer
    // =========================================================================
    // @ts-ignore - dodo_customer_id is added via migration
    let dodoCustomerId = user.dodo_customer_id;

    if (!dodoCustomerId) {
      const client = getDodoClient();
      const customer = await withDodoErrorHandling(
        () => client.customers.create({
          email: userEmail,
          name: user.full_name || userEmail.split('@')[0],
        }),
        'creating Dodo customer for top-up'
      );
      dodoCustomerId = customer.customer_id;

      await supabase
        .from('users')
        .update({ dodo_customer_id: dodoCustomerId, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    // =========================================================================
    // STEP 6: Get Dodo product ID for the credit pack
    // =========================================================================
    let productId: string;
    try {
      productId = getCreditPackProductId(packId);
    } catch {
      return NextResponse.json(
        { error: 'Credit pack not configured. Please contact support.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 7: Generate callback token and create checkout session
    // =========================================================================
    // Same pattern as onboarding checkout (app/api/onboarding/checkout/route.ts).
    // The callback token is included in the return URL so the callback page
    // can poll /api/checkout/status for payment confirmation.
    // This token is for LOOKUP only — actual payment is confirmed via webhook.
    // =========================================================================
    const callbackToken = crypto.randomUUID();
    const client = getDodoClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.guffles.com';
    const returnUrl = `${baseUrl}/checkout/callback?token=${callbackToken}&type=topup`;

    const checkoutSession = await withDodoErrorHandling(
      () => client.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { customer_id: dodoCustomerId },
        return_url: returnUrl,
        // Metadata is passed through to webhooks — used for identifying
        // this payment as a credit pack purchase (not a subscription)
        metadata: {
          user_id: user.id,
          pack_id: packId,
          user_email: userEmail,
          callback_token: callbackToken,
          type: 'topup',
        },
      }),
      'creating top-up checkout session'
    );

    // =========================================================================
    // STEP 8: Log for rate limiting and analytics
    // =========================================================================
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'topup_checkout_initiated',
      metadata: {
        pack_id: packId,
        session_id: checkoutSession.session_id,
        credits: pack.creditsInCents,
      },
      created_at: new Date().toISOString(),
    });

    // =========================================================================
    // STEP 9: Save checkout session for status polling
    // =========================================================================
    // Uses admin client to bypass RLS (same pattern as onboarding checkout).
    // The checkout_sessions table may have RLS policies that restrict inserts.
    const adminSupabase = createAdminClient();
    const { error: sessionError } = await adminSupabase
      .from('checkout_sessions')
      .insert({
        session_id: checkoutSession.session_id,
        callback_token: callbackToken,
        user_id: user.id,
        user_email: userEmail,
        plan_id: packId,  // Reusing plan_id column for pack_id
        status: 'pending',
        metadata: { type: 'topup', pack_id: packId },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    if (sessionError) {
      console.error('[Top-Up] Failed to save checkout session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to initialize checkout. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[Top-Up] Checkout created:', {
      userId: user.id,
      packId,
      credits: formatCredits(pack.creditsInCents),
      sessionId: checkoutSession.session_id,
      callbackToken,
    });

    // =========================================================================
    // STEP 10: Return checkout URL
    // =========================================================================
    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url,
      sessionId: checkoutSession.session_id,
      packDetails: {
        id: pack.id,
        name: pack.name,
        price: formatCredits(pack.priceInCents),
        credits: formatCredits(pack.creditsInCents),
      },
    });
  } catch (error) {
    console.error('[Top-Up] Error:', error);

    if (error instanceof DodoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create top-up checkout. Please try again.' },
      { status: 500 }
    );
  }
}
