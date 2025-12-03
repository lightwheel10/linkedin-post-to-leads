import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, updateUserSettings } from '@/lib/data-store';

export async function GET() {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    const user = await updateUserSettings(userEmail, settings);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
