import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateUserOnboarding } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate data types
    if (data.full_name !== undefined && typeof data.full_name !== 'string') {
      return NextResponse.json({ error: 'Invalid full_name' }, { status: 400 });
    }
    if (data.company !== undefined && typeof data.company !== 'string') {
      return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
    }
    if (data.role !== undefined && typeof data.role !== 'string') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (data.locations !== undefined && !Array.isArray(data.locations)) {
      return NextResponse.json({ error: 'Invalid locations' }, { status: 400 });
    }
    if (data.industries !== undefined && !Array.isArray(data.industries)) {
      return NextResponse.json({ error: 'Invalid industries' }, { status: 400 });
    }
    if (data.icp_keywords !== undefined && !Array.isArray(data.icp_keywords)) {
      return NextResponse.json({ error: 'Invalid icp_keywords' }, { status: 400 });
    }
    if (data.exclude_keywords !== undefined && !Array.isArray(data.exclude_keywords)) {
      return NextResponse.json({ error: 'Invalid exclude_keywords' }, { status: 400 });
    }
    if (data.linkedin_url !== undefined && typeof data.linkedin_url !== 'string') {
      return NextResponse.json({ error: 'Invalid linkedin_url' }, { status: 400 });
    }
    if (data.profile_picture !== undefined && typeof data.profile_picture !== 'string') {
      return NextResponse.json({ error: 'Invalid profile_picture' }, { status: 400 });
    }
    if (data.onboarding_step !== undefined && typeof data.onboarding_step !== 'number') {
      return NextResponse.json({ error: 'Invalid onboarding_step' }, { status: 400 });
    }
    if (data.selected_plan !== undefined && typeof data.selected_plan !== 'string') {
      return NextResponse.json({ error: 'Invalid selected_plan' }, { status: 400 });
    }
    if (data.billing_period !== undefined && typeof data.billing_period !== 'string') {
      return NextResponse.json({ error: 'Invalid billing_period' }, { status: 400 });
    }
    if (data.trial_ends_at !== undefined && typeof data.trial_ends_at !== 'string') {
      return NextResponse.json({ error: 'Invalid trial_ends_at' }, { status: 400 });
    }
    // Card info validation (masked only - NEVER store full card numbers)
    if (data.card_last_four !== undefined && typeof data.card_last_four !== 'string') {
      return NextResponse.json({ error: 'Invalid card_last_four' }, { status: 400 });
    }
    if (data.card_brand !== undefined && typeof data.card_brand !== 'string') {
      return NextResponse.json({ error: 'Invalid card_brand' }, { status: 400 });
    }
    if (data.card_expiry !== undefined && typeof data.card_expiry !== 'string') {
      return NextResponse.json({ error: 'Invalid card_expiry' }, { status: 400 });
    }

    const user = await updateUserOnboarding(userEmail, data);

    if (!user) {
      return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

