import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUser, completeOnboarding } from '@/lib/data-store';

export async function POST() {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has completed all required fields
    const user = await getUser(userEmail);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check required fields
    if (!user.full_name || !user.company || !user.role) {
      return NextResponse.json({ 
        error: 'Please complete all profile information first' 
      }, { status: 400 });
    }

    if (!user.locations || user.locations.length === 0) {
      return NextResponse.json({ 
        error: 'Please select at least one target location' 
      }, { status: 400 });
    }

    if (!user.industries || user.industries.length === 0) {
      return NextResponse.json({ 
        error: 'Please select at least one target industry' 
      }, { status: 400 });
    }

    if (!user.selected_plan) {
      return NextResponse.json({ 
        error: 'Please select a subscription plan' 
      }, { status: 400 });
    }

    // TODO: Verify payment was processed with Dodo Payment Gateway
    // ============================================
    // const dodoClient = new DodoClient(process.env.DODO_API_KEY);
    // const subscription = await dodoClient.subscriptions.get(user.subscription_id);
    // if (!subscription || subscription.status !== 'trialing') {
    //   return NextResponse.json({ error: 'Payment not processed' }, { status: 400 });
    // }
    // ============================================

    // Mark onboarding as complete
    const updatedUser = await completeOnboarding(userEmail);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

