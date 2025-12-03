import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getUserBillingInfo, getUserSubscription } from '@/lib/data-store';

// =============================================================================
// TODO: DODO PAYMENT GATEWAY INTEGRATION
// - Add endpoints for:
//   - POST /api/billing/checkout - Create checkout session
//   - POST /api/billing/portal - Create customer portal session
//   - POST /api/billing/cancel - Cancel subscription
//   - Webhook handler for payment events
// =============================================================================

export async function GET() {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const billingInfo = await getUserBillingInfo(user.id);
    const subscription = await getUserSubscription(user.id);

    if (!billingInfo) {
      return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 });
    }

    return NextResponse.json({
      billing: billingInfo,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error('Billing fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

