import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getRemainingCredits, getCredits, addCredits } from '@/lib/data-store';

export async function GET() {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const remaining = await getRemainingCredits(user.id);
    const credits = await getCredits(user.id);

    return NextResponse.json({
      remaining,
      total: credits?.total_credits || 0,
      used: credits?.used_credits || 0,
      transactions: credits?.transactions || []
    });
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add credits (for purchase or bonus)
export async function POST(request: Request) {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, type, description } = await request.json();

    if (!amount || !type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await getOrCreateUser(userEmail);
    const credits = await addCredits(user.id, amount, type, description);

    if (!credits) {
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      remaining: credits.total_credits - credits.used_credits
    });
  } catch (error) {
    console.error('Credits add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
