// Checkout status polling endpoint — checks if webhook has confirmed trial activation.
// Intentionally unprotected (auth cookies may be lost after Dodo redirect).
// Uses admin client to bypass RLS — no user auth context available here.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth';
import { completeOnboarding } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const callbackToken = request.nextUrl.searchParams.get('token');

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

    const now = new Date();
    const expiresAt = new Date(checkoutSession.expires_at);

    // Expire this session if past deadline
    if (now > expiresAt && checkoutSession.status === 'pending') {
      await supabase
        .from('checkout_sessions')
        .update({ status: 'expired', updated_at: now.toISOString() })
        .eq('id', checkoutSession.id);

      return NextResponse.json({
        success: false,
        status: 'expired',
        message: 'This checkout session has expired. Please start a new checkout.'
      });
    }

    // Opportunistic cleanup: expire all stale pending sessions for this user
    await supabase
      .from('checkout_sessions')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .eq('user_id', checkoutSession.user_id)
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString())
      .neq('id', checkoutSession.id);

    const userEmail = await getAuthenticatedUser();
    const isAuthenticated = !!userEmail;

    if (checkoutSession.status === 'completed') {
      // Idempotent — webhook already completed onboarding, this is a safety net
      if (isAuthenticated && userEmail === checkoutSession.user_email) {
        try {
          await completeOnboarding(userEmail, supabase);
        } catch (err) {
          console.error('[Checkout Status] Failed to complete onboarding:', err);
        }
      }

      return NextResponse.json({
        success: true,
        status: 'completed',
        user_email: checkoutSession.user_email,
        plan_id: checkoutSession.plan_id,
        requires_login: !isAuthenticated || userEmail !== checkoutSession.user_email,
        message: 'Trial activated!'
      });
    }

    if (checkoutSession.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Something went wrong. Please try again.'
      });
    }

    // Still pending — webhook hasn't confirmed yet
    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Activating your free trial...'
    });

  } catch (error) {
    console.error('[Checkout Status] Error:', error);
    return NextResponse.json(
      { success: false, status: 'failed', message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
