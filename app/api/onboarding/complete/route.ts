import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUser, completeOnboarding } from '@/lib/data-store';

// Marks onboarding complete. Subscription is managed exclusively by webhooks.
export async function POST() {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(userEmail);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate required onboarding fields
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

    const completedUser = await completeOnboarding(userEmail);

    if (!completedUser) {
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: completedUser,
      message: 'Welcome! Your 7-day free trial has started.'
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
