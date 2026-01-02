// =============================================================================
// CHECKOUT STATUS API
// =============================================================================
//
// Created: 2nd January 2026
// Purpose: Check if a checkout session has been completed (via webhook)
//
// WHY THIS ENDPOINT EXISTS:
// ========================
// When users return from Dodo checkout, we can't trust the URL parameters.
// Anyone can type ?checkout=success in the URL. Instead:
//
// 1. The callback page sends the session_id to this endpoint
// 2. We look up the session in our checkout_sessions table
// 3. We check if the WEBHOOK has marked status = 'completed'
// 4. Only then do we confirm the payment succeeded
//
// SECURITY:
// =========
// - The webhook (with signature verification) is the ONLY thing that can
//   mark a session as 'completed'
// - Even if an attacker knows a valid session_id, they can't complete
//   onboarding unless the webhook has actually confirmed payment
// - We also check if the user is authenticated (for seamless redirect)
//
// FLOW:
// =====
// 1. Callback page polls: GET /api/checkout/status?session_id=xxx
// 2. This endpoint checks checkout_sessions table
// 3. Returns status: 'pending' | 'completed' | 'failed' | 'expired'
// 4. If completed AND user is authenticated → callback completes onboarding
// 5. If completed BUT user not authenticated → callback shows login prompt
//
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { completeOnboarding } from '@/lib/data-store';

// =============================================================================
// GET /api/checkout/status
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // STEP 1: Get callback token from query params
    // =========================================================================
    // Updated 2nd Jan 2026: Use 'token' (callback_token) instead of 'session_id'
    // because Dodo doesn't replace placeholder values in return URLs.
    // We generate our own unique token before creating the Dodo session.
    // =========================================================================
    const callbackToken = request.nextUrl.searchParams.get('token');

    if (!callbackToken) {
      return NextResponse.json(
        {
          success: false,
          status: 'failed',
          message: 'Missing token parameter'
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 2: Look up checkout session by callback_token
    // =========================================================================
    // This is where the security happens:
    // - We stored the session with callback_token when user started checkout
    // - Only the WEBHOOK can update status to 'completed'
    // - The callback_token alone doesn't prove payment succeeded
    // =========================================================================
    const supabase = await createClient();

    const { data: checkoutSession, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('callback_token', callbackToken)
      .single();

    if (sessionError || !checkoutSession) {
      console.log('[Checkout Status] Session not found for token:', callbackToken);
      return NextResponse.json(
        {
          success: false,
          status: 'failed',
          message: 'Checkout session not found. It may have expired or is invalid.'
        },
        { status: 404 }
      );
    }

    // =========================================================================
    // STEP 3: Check if session has expired
    // =========================================================================
    const now = new Date();
    const expiresAt = new Date(checkoutSession.expires_at);

    if (now > expiresAt && checkoutSession.status === 'pending') {
      // Mark as expired in DB
      await supabase
        .from('checkout_sessions')
        .update({
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', checkoutSession.id);

      return NextResponse.json({
        success: false,
        status: 'expired',
        message: 'This checkout session has expired. Please start a new checkout.'
      });
    }

    // =========================================================================
    // STEP 4: Check if user is authenticated
    // =========================================================================
    // Even though this endpoint doesn't require auth, we check if the user
    // IS authenticated so we can provide a seamless experience
    // =========================================================================
    const userEmail = await getAuthenticatedUser();
    const isAuthenticated = !!userEmail;

    // =========================================================================
    // STEP 5: Return status based on what webhook has told us
    // =========================================================================

    if (checkoutSession.status === 'completed') {
      // =====================================================================
      // Payment confirmed by webhook!
      // =====================================================================
      console.log('[Checkout Status] Session completed:', {
        callbackToken,
        sessionId: checkoutSession.session_id,
        userEmail: checkoutSession.user_email,
        isAuthenticated,
      });

      // If user is authenticated AND it's the same user, complete onboarding
      if (isAuthenticated && userEmail === checkoutSession.user_email) {
        // Try to complete onboarding right here (optimization)
        try {
          await completeOnboarding(userEmail);
          console.log('[Checkout Status] Onboarding completed for:', userEmail);
        } catch (err) {
          console.error('[Checkout Status] Failed to complete onboarding:', err);
          // Don't fail - callback page will retry
        }
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        user_email: checkoutSession.user_email,
        plan_id: checkoutSession.plan_id,
        // Tell callback if user needs to log in
        requires_login: !isAuthenticated || userEmail !== checkoutSession.user_email,
        message: 'Payment confirmed!'
      });
    }

    if (checkoutSession.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Payment failed. Please try again with a different payment method.'
      });
    }

    // =========================================================================
    // STEP 6: Still pending - webhook hasn't confirmed yet
    // =========================================================================
    // This is normal - webhook might be a few seconds behind the redirect
    // Callback page will keep polling
    // =========================================================================
    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Waiting for payment confirmation...'
    });

  } catch (error) {
    console.error('[Checkout Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        message: 'An error occurred while checking payment status.'
      },
      { status: 500 }
    );
  }
}
