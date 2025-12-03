import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser, getCRMLeads, addCRMLeads, deleteCRMLeads, updateCRMLead } from '@/lib/data-store';

// ============================================================================
// CRM Leads API - CRUD operations for leads
// ============================================================================

// GET - Fetch all CRM leads for the user
export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthenticatedUser();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const leads = await getCRMLeads(user.id);

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error('[CRM Leads] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST - Add leads to CRM
export async function POST(request: NextRequest) {
  try {
    const userEmail = await getAuthenticatedUser();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const body = await request.json();
    
    // Accept single lead or array of leads
    const leadsToAdd = Array.isArray(body.leads) ? body.leads : [body];
    
    // Validate required fields
    for (const lead of leadsToAdd) {
      if (!lead.name || !lead.profile_url) {
        return NextResponse.json(
          { error: 'Each lead must have name and profile_url' },
          { status: 400 }
        );
      }
    }

    // Format leads for storage
    const formattedLeads = leadsToAdd.map((lead: any) => ({
      name: lead.name,
      headline: lead.headline || '',
      profile_url: lead.profile_url,
      profile_picture: lead.profile_picture,
      source_analysis_id: lead.source_analysis_id,
      source_post_url: lead.source_post_url,
    }));

    const addedLeads = await addCRMLeads(user.id, formattedLeads);

    return NextResponse.json({
      success: true,
      added: addedLeads.length,
      skipped: leadsToAdd.length - addedLeads.length, // Duplicates
      leads: addedLeads
    });
  } catch (error: any) {
    console.error('[CRM Leads] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add leads' },
      { status: 500 }
    );
  }
}

// DELETE - Remove leads from CRM
export async function DELETE(request: NextRequest) {
  try {
    const userEmail = await getAuthenticatedUser();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const body = await request.json();
    
    // Accept single id or array of ids
    const ids = Array.isArray(body.ids) ? body.ids : [body.id];
    
    if (!ids.length || ids.some((id: any) => !id)) {
      return NextResponse.json(
        { error: 'Lead ID(s) required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCRMLeads(user.id, ids);

    return NextResponse.json({
      success: true,
      deleted
    });
  } catch (error: any) {
    console.error('[CRM Leads] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

// PATCH - Update a lead (e.g., enrichment status)
export async function PATCH(request: NextRequest) {
  try {
    const userEmail = await getAuthenticatedUser();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userEmail);
    const body = await request.json();
    
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID required' },
        { status: 400 }
      );
    }

    const updatedLead = await updateCRMLead(id, user.id, updates);

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead
    });
  } catch (error: any) {
    console.error('[CRM Leads] PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

