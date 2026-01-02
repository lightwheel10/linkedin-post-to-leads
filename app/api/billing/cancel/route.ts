// =============================================================================
// CANCEL SUBSCRIPTION API
// =============================================================================
//
// Handles subscription cancellation requests.
//
// CANCELLATION BEHAVIOR:
// - Cancellation is scheduled for the end of the current billing period
// - User retains access to their plan until the period ends
// - Usage limits remain unchanged during the remaining period
// - After period ends, user is automatically downgraded to free plan
//
// IMPORTANT NOTES:
// - This does NOT provide an immediate refund
// - Users can re-subscribe at any time
// - Webhook handles the actual downgrade when period expires
//
// Created: 2nd January 2026
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getUserSubscription } from '@/lib/data-store';
import { createClient } from '@/lib/supabase/server';
import {
  getDodoClient,
  withDodoErrorHandling,
  DodoError,
} from '@/lib/dodo';

// =============================================================================
// POST /api/billing/cancel
// =============================================================================

/**
 * Cancels the user's current subscription.
 *
 * The subscription will remain active until the end of the current billing
 * period, then automatically expire.
 *
 * Request body (optional):
 * {
 *   "reason": "..." // Optional cancellation reason for analytics
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "...",
 *   "accessUntil": "2026-02-01T00:00:00Z"
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
    // STEP 2: Parse request body (optional)
    // =========================================================================
    let cancellationReason: string | undefined;
    try {
      const body = await request.json();
      cancellationReason = body.reason;
    } catch {
      // Body is optional
    }

    // =========================================================================
    // STEP 3: Get user and verify they have an active subscription
    // =========================================================================
    const user = await getOrCreateUser(userEmail);
    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found.' },
        { status: 400 }
      );
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Subscription is already cancelled.',
          accessUntil: subscription.current_period_end,
        },
        { status: 400 }
      );
    }

    // @ts-ignore - dodo_subscription_id is added via migration
    const dodoSubscriptionId = subscription.dodo_subscription_id;

    if (!dodoSubscriptionId) {
      // Handle legacy subscriptions without Dodo integration
      // Just mark as cancelled in our database
      const supabase = await createClient();

      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      console.log('[Cancel] Cancelled legacy subscription:', subscription.id);

      return NextResponse.json({
        success: true,
        message: 'Your subscription has been cancelled.',
        accessUntil: subscription.current_period_end,
      });
    }

    // =========================================================================
    // STEP 4: Cancel subscription in Dodo
    // =========================================================================
    const client = getDodoClient();

    await withDodoErrorHandling(
      () => client.subscriptions.update(dodoSubscriptionId, {
        // Schedule cancellation at next billing date (end of current period)
        // User retains access until the period ends
        cancel_at_next_billing_date: true,
      }),
      'cancelling subscription'
    );

    // =========================================================================
    // STEP 5: Update local subscription record
    // =========================================================================
    const supabase = await createClient();

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    console.log('[Cancel] Subscription cancelled:', {
      subscriptionId: subscription.id,
      dodoSubscriptionId,
      userId: user.id,
      reason: cancellationReason,
    });

    // =========================================================================
    // STEP 6: Log cancellation for analytics
    // =========================================================================
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'subscription_cancelled',
      metadata: {
        plan: subscription.plan,
        period: subscription.period,
        reason: cancellationReason,
        access_until: subscription.current_period_end,
      },
      created_at: new Date().toISOString(),
    });

    // =========================================================================
    // STEP 7: Return success response
    // =========================================================================
    return NextResponse.json({
      success: true,
      message: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.',
      accessUntil: subscription.current_period_end,
    });
  } catch (error) {
    console.error('[Cancel] Error:', error);

    // Handle known Dodo errors
    if (error instanceof DodoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
