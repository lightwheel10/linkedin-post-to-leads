// =============================================================================
// CUSTOMER PORTAL API
// =============================================================================
//
// Creates a Dodo Payments customer portal session.
//
// The customer portal allows users to:
// - View and manage their subscription
// - Update payment methods
// - View billing history and download invoices
// - Cancel their subscription
//
// This is Dodo's hosted solution for self-service billing management.
// Using the portal reduces PCI compliance scope and development effort.
//
// Created: 2nd January 2026
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import {
  getDodoClient,
  withDodoErrorHandling,
  DodoError,
} from '@/lib/dodo';

// =============================================================================
// POST /api/billing/portal
// =============================================================================

/**
 * Creates a customer portal session URL.
 *
 * The portal session is temporary and expires after a short period.
 * Users are redirected to the portal where they can manage their billing.
 *
 * Request body (optional):
 * {
 *   "returnUrl": "..." // URL to return to after portal session
 * }
 *
 * Response:
 * {
 *   "portalUrl": "https://billing.dodopayments.com/..."
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
    let returnUrl: string | undefined;
    try {
      const body = await request.json();
      returnUrl = body.returnUrl;
    } catch {
      // Body is optional, continue without it
    }

    // =========================================================================
    // STEP 3: Get user and verify they have a Dodo customer ID
    // =========================================================================
    const user = await getOrCreateUser(userEmail);

    // @ts-ignore - dodo_customer_id is added via migration
    const dodoCustomerId = user.dodo_customer_id;

    if (!dodoCustomerId) {
      return NextResponse.json(
        {
          error: 'No billing account found. Please subscribe to a plan first.',
          code: 'NO_CUSTOMER',
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 4: Create portal session
    // =========================================================================
    const client = getDodoClient();

    // Determine return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guffles.com';
    const defaultReturnUrl = `${baseUrl}/dashboard/settings`;

    const portalSession = await withDodoErrorHandling(
      () => client.customers.customerPortal.create(dodoCustomerId),
      'creating customer portal session'
    );

    console.log('[Portal] Created portal session:', {
      userId: user.id,
      dodoCustomerId,
    });

    // =========================================================================
    // STEP 5: Return portal URL
    // =========================================================================
    // Dodo SDK returns the portal URL in the 'link' property
    return NextResponse.json({
      portalUrl: portalSession.link,
    });
  } catch (error) {
    console.error('[Portal] Error:', error);

    // Handle known Dodo errors
    if (error instanceof DodoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to create portal session. Please try again.' },
      { status: 500 }
    );
  }
}
