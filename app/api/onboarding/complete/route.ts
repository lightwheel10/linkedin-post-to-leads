import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUser, completeOnboarding, activateUserPlan } from '@/lib/data-store';

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

    // =============================================================================
    // TODO: DODO PAYMENT GATEWAY INTEGRATION
    // Before activating the plan, verify payment was processed:
    // 
    // const dodoClient = new DodoClient(process.env.DODO_API_KEY);
    // 
    // 1. Verify customer exists or create one
    // const customer = await dodoClient.customers.create({
    //   email: userEmail,
    //   name: user.full_name,
    // });
    // 
    // 2. Create subscription with trial
    // const subscription = await dodoClient.subscriptions.create({
    //   customer_id: customer.id,
    //   price_id: getPriceIdForPlan(user.selected_plan, user.billing_period),
    //   trial_period_days: 7,
    //   payment_method_id: user.payment_method_id, // From card tokenization in onboarding step 3
    // });
    // 
    // 3. Verify subscription status
    // if (!subscription || subscription.status !== 'trialing') {
    //   return NextResponse.json({ error: 'Payment setup failed' }, { status: 400 });
    // }
    // 
    // 4. Store subscription info
    // await updateUserWithSubscription(user.id, {
    //   dodo_customer_id: customer.id,
    //   dodo_subscription_id: subscription.id,
    // });
    // =============================================================================

    // Activate the user's plan (creates subscription record and sets usage limits)
    const { user: activatedUser, subscription } = await activateUserPlan(
      user.id,
      user.selected_plan,
      user.billing_period || 'monthly',
      7 // 7-day trial
    );

    if (!activatedUser) {
      return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
    }

    // Mark onboarding as complete
    const completedUser = await completeOnboarding(userEmail);

    if (!completedUser) {
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: completedUser,
      subscription: subscription,
      message: 'Welcome! Your 7-day free trial has started.'
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
