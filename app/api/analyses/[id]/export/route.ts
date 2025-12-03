import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getAnalysis, analysisToCSV } from '@/lib/data-store';

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

    // Generate CSV
    const csv = analysisToCSV(analysis);

    // Create response with CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${id}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
