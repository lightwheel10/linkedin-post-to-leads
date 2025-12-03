import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getAnalysis, deleteAnalysis } from '@/lib/data-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getOrCreateUser(userEmail);
    const analysis = await getAnalysis(id, user.id);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getOrCreateUser(userEmail);
    const deleted = await deleteAnalysis(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analysis delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
