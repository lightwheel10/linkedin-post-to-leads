import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getAnalyses, saveAnalysis } from '@/lib/data-store';

export async function GET() {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const analyses = await getAnalyses(user.id);

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Analyses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = await getAuthenticatedUser();

    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    
    // Note: Usage limits are checked and tracked in the analyze-post server action
    // This endpoint only saves the analysis results to database

    const body = await request.json();

    // Transform the body to match our Analysis type
    const analysisData = {
      user_id: user.id,
      post_url: body.post_url,
      post_data: {
        author: body.post_data.author,
        author_headline: body.post_data.author_headline,
        author_image: body.post_data.author_image,
        content: body.post_data.content,
        post_image: body.post_data.post_image,
        total_reactions: body.post_data.total_reactions,
        total_comments: body.post_data.total_comments,
        total_shares: body.post_data.total_shares
      },
      total_reactors: body.total_reactors,
      qualified_leads_count: body.qualified_leads_count,
      leads: body.leads.map((lead: any) => ({
        name: lead.name,
        headline: lead.headline,
        profile_url: lead.profile_url,
        profile_picture: lead.profile_picture,
        matches_icp: lead.matches_icp,
        source: lead.source || 'reaction',
        comment_text: lead.comment_text
      }))
    };

    const analysis = await saveAnalysis(analysisData);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analysis save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
