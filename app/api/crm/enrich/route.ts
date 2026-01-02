import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { getAuthenticatedUser } from '@/lib/auth';
import { getOrCreateUser } from '@/lib/data-store';
import { canEnrich, incrementEnrichmentUsage } from '@/lib/usage';

// ============================================================================
// LinkedIn Profile Enrichment API
// Uses Apify to scrape LinkedIn profile data
// ============================================================================
//
// SECURITY FIX - 2nd January 2026
// ================================
// REMOVED: skipUsageTracking parameter that was previously accepted from request body.
// This was a CRITICAL security vulnerability that allowed any authenticated user to
// bypass credit/usage tracking by simply sending skipUsageTracking: true in the request.
//
// Credits are now ALWAYS tracked and deducted for enrichments.
// If internal/admin bypasses are ever needed, they should be handled via:
// 1. A separate internal API endpoint with proper authentication
// 2. Server-side checks (e.g., checking if request is from internal service)
// NEVER trust user-provided flags for billing/security decisions.
// ============================================================================

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const LINKEDIN_SCRAPER_ACTOR_ID = "VhxlqQXRwhW8H5hNV";

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const userEmail = await getAuthenticatedUser();
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Please log in to enrich profiles' },
        { status: 401 }
      );
    }

    const user = await getOrCreateUser(userEmail);

    // Check usage limits
    const usageCheck = await canEnrich(user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: usageCheck.reason || "You've reached your enrichment limit for this month.",
          usage: usageCheck.usage,
          limitReached: true
        },
        { status: 403 }
      );
    }

    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { error: 'Apify API token not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    // SECURITY: Only extract profileUrl and username from request body.
    // DO NOT accept skipUsageTracking or any other billing-related flags from user input.
    const { profileUrl, username } = body;

    // Extract username from URL if not provided
    let linkedinUsername = username;
    if (!linkedinUsername && profileUrl) {
      // Extract from URLs like: https://linkedin.com/in/username or https://www.linkedin.com/in/username/
      const match = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (match) {
        linkedinUsername = match[1];
      }
    }

    if (!linkedinUsername) {
      return NextResponse.json(
        { error: 'LinkedIn username or profile URL required' },
        { status: 400 }
      );
    }

    console.log(`[Enrich] Starting enrichment for: ${linkedinUsername}`);

    const client = new ApifyClient({ token: APIFY_TOKEN });

    // Run the scraper (without email to save credits/time)
    const run = await client.actor(LINKEDIN_SCRAPER_ACTOR_ID).call({
      username: linkedinUsername,
      includeEmail: false
    });

    // Fetch results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No profile data returned', profile: null },
        { status: 404 }
      );
    }

    const rawProfile = items[0] as any;

    // Check if profile was found
    if (rawProfile.message === "No profile found or wrong input") {
      return NextResponse.json(
        { error: 'Profile not found', profile: null },
        { status: 404 }
      );
    }

    // Transform the data into our clean structure
    // Handle potentially missing fields gracefully
    const enrichedProfile = {
      // Basic info - always try to get these
      fullName: rawProfile.basic_info?.fullname || null,
      firstName: rawProfile.basic_info?.first_name || null,
      lastName: rawProfile.basic_info?.last_name || null,
      headline: rawProfile.basic_info?.headline || null,
      profileUrl: rawProfile.basic_info?.profile_url || `https://linkedin.com/in/${linkedinUsername}`,
      profilePicture: rawProfile.basic_info?.profile_picture_url || null,
      
      // About/Bio
      about: rawProfile.basic_info?.about || null,
      
      // Location
      location: rawProfile.basic_info?.location?.full || null,
      city: rawProfile.basic_info?.location?.city || null,
      country: rawProfile.basic_info?.location?.country || null,
      
      // Current company
      currentCompany: rawProfile.basic_info?.current_company || null,
      currentCompanyUrl: rawProfile.basic_info?.current_company_url || null,
      
      // Stats
      followerCount: rawProfile.basic_info?.follower_count || null,
      connectionCount: rawProfile.basic_info?.connection_count || null,
      
      // Flags
      isCreator: rawProfile.basic_info?.is_creator || false,
      isInfluencer: rawProfile.basic_info?.is_influencer || false,
      isPremium: rawProfile.basic_info?.is_premium || false,
      openToWork: rawProfile.basic_info?.open_to_work || false,
      
      // Topics they post about
      topics: rawProfile.basic_info?.creator_hashtags || [],
      
      // Experience - take top 3 most recent
      experience: (rawProfile.experience || []).slice(0, 3).map((exp: any) => ({
        title: exp.title || null,
        company: exp.company || null,
        duration: exp.duration || null,
        isCurrent: exp.is_current || false,
        companyLogo: exp.company_logo_url || null,
      })),
      
      // Education - take top 2
      education: (rawProfile.education || []).slice(0, 2).map((edu: any) => ({
        school: edu.school || null,
        duration: edu.duration || null,
        schoolLogo: edu.school_logo_url || null,
      })),
      
      // Metadata
      enrichedAt: new Date().toISOString(),
    };

    console.log(`[Enrich] Successfully enriched: ${linkedinUsername}`);

    // SECURITY FIX (2nd Jan 2026): ALWAYS track and deduct credits for enrichments.
    // Previously this had a skipUsageTracking bypass that was a security vulnerability.
    // Credits are now always deducted - no user-controlled bypasses allowed.
    await incrementEnrichmentUsage(user.id);

    // Get updated usage
    const updatedUsage = await canEnrich(user.id);

    return NextResponse.json({
      success: true,
      profile: enrichedProfile,
      usage: updatedUsage.usage
    });

  } catch (error: any) {
    console.error('[Enrich] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Enrichment failed' },
      { status: 500 }
    );
  }
}

