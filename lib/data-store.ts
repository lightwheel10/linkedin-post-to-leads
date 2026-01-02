import { createClient } from '@/lib/supabase/server';

// ============================================================================
// DATA STORE - Supabase PostgreSQL Storage
// ============================================================================
//
// MIGRATION NOTE (14 Dec 2025):
// Changed from basic Supabase client (lib/supabase.ts) to SSR-aware client
// (lib/supabase/server.ts) for consistency and proper RLS support.
//
// Each function now creates its own client instance via `await createClient()`.
// This is the recommended pattern for Next.js App Router as it ensures
// proper cookie handling and user session context for Row Level Security.
//
// See: https://supabase.com/docs/guides/auth/server-side/nextjs
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  settings: UserSettings;
  // Onboarding fields
  full_name: string | null;
  company: string | null;
  role: string | null;
  locations: string[];
  industries: string[];
  onboarding_completed: boolean;
  onboarding_step: number; // 1=profile, 2=icp, 3=payment
  // LinkedIn profile
  linkedin_url: string | null;
  profile_picture: string | null;
  // Subscription/Trial (from onboarding)
  selected_plan: string | null; // 'pro' | 'growth' | 'scale'
  billing_period: string | null; // 'monthly' | 'annual'
  trial_ends_at: string | null;
  // Active plan & usage tracking
  plan: string; // 'free' | 'pro' | 'growth' | 'scale'
  plan_started_at: string | null;
  plan_expires_at: string | null;
  analyses_used: number;
  enrichments_used: number;
  usage_reset_at: string | null;
  // Payment method (masked - NEVER store full card numbers)
  card_last_four: string | null;
  card_brand: string | null; // 'visa' | 'mastercard' | 'amex' | 'discover'
  card_expiry: string | null; // 'MM/YY'
  // =============================================================================
  // DODO PAYMENTS INTEGRATION (Added: 2nd January 2026)
  // =============================================================================
  dodo_customer_id: string | null; // Dodo Payments customer ID
  // =============================================================================
  // WALLET CREDIT SYSTEM (Added: 2nd January 2026)
  // =============================================================================
  // Wallet-based billing: Users subscribe to plans that give wallet credits.
  // Credits are stored in CENTS (100 cents = $1.00) to avoid float precision.
  // Credits are RESET (not accumulated) at each billing cycle.
  // Unused credits are FORFEITED at end of billing cycle (no rollover).
  //
  // Credit allocation per plan:
  // - Pro ($79/mo): $150 credits = 15000 cents
  // - Growth ($179/mo): $300 credits = 30000 cents
  // - Scale ($279/mo): $500 credits = 50000 cents
  // =============================================================================
  wallet_balance: number; // Current wallet balance in cents
  wallet_reset_at: string | null; // When wallet was last reset (billing cycle)
}

export interface UserSettings {
  icp_keywords: string[];
  exclude_keywords: string[];
  default_export_format: 'csv' | 'json';
  notifications_enabled: boolean;
}

export interface Analysis {
  id: string;
  user_id: string;
  post_url: string;
  created_at: string;
  post_data: {
    author: string;
    author_headline?: string;
    author_image?: string;
    content: string;
    post_image?: string;
    total_reactions: number;
    total_comments: number;
    total_shares: number;
  };
  total_reactors: number;
  qualified_leads_count: number;
  leads: Lead[];
}

export interface Lead {
  name: string;
  headline: string;
  profile_url: string;
  profile_picture?: string;
  matches_icp: boolean;
  email?: string;
  email_status?: 'pending' | 'found' | 'not_found';
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getUser(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function createUser(email: string): Promise<User> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const user: User = {
    id,
    email,
    created_at: now,
    updated_at: now,
    settings: {
      icp_keywords: [
        'ceo', 'cto', 'founder', 'director', 'vp', 'vice president',
        'head of', 'chief', 'manager', 'lead', 'senior', 'principal'
      ],
      exclude_keywords: ['student', 'intern', 'looking for', 'seeking'],
      default_export_format: 'csv',
      notifications_enabled: true
    },
    // Onboarding fields - null/empty until completed
    full_name: null,
    company: null,
    role: null,
    locations: [],
    industries: [],
    onboarding_completed: false,
    onboarding_step: 1,
    // LinkedIn profile
    linkedin_url: null,
    profile_picture: null,
    // Subscription/Trial (from onboarding)
    selected_plan: null,
    billing_period: null,
    trial_ends_at: null,
    // Active plan & usage tracking
    plan: 'free',
    plan_started_at: null,
    plan_expires_at: null,
    analyses_used: 0,
    enrichments_used: 0,
    usage_reset_at: now,
    // Payment method (masked - NEVER store full card numbers)
    card_last_four: null,
    card_brand: null,
    card_expiry: null,
    // Dodo Payments
    dodo_customer_id: null,
    // Wallet Credit System
    // New users start with 0 balance until they subscribe to a paid plan
    wallet_balance: 0,
    wallet_reset_at: null
  };

  const { error } = await supabase.from('users').insert(user);

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return user;
}

export async function getOrCreateUser(email: string): Promise<User> {
  const existing = await getUser(email);
  if (existing) return existing;
  return createUser(email);
}

export async function updateUserSettings(email: string, settings: Partial<UserSettings>): Promise<User | null> {
  const supabase = await createClient();
  // First get current user to merge settings
  const user = await getUser(email);
  if (!user) return null;

  const updatedSettings = { ...user.settings, ...settings };

  const { error } = await supabase
    .from('users')
    .update({
      settings: updatedSettings,
      updated_at: new Date().toISOString()
    })
    .eq('email', email);

  if (error) return null;

  return { ...user, settings: updatedSettings, updated_at: new Date().toISOString() };
}

// ============================================================================
// ONBOARDING OPERATIONS
// ============================================================================

export interface OnboardingData {
  full_name?: string;
  company?: string;
  role?: string;
  locations?: string[];
  industries?: string[];
  icp_keywords?: string[];
  exclude_keywords?: string[];
  linkedin_url?: string;
  profile_picture?: string;
  onboarding_step?: number;
  selected_plan?: string;
  billing_period?: string;
  trial_ends_at?: string;
  // Card info (masked - NEVER store full card numbers)
  card_last_four?: string;
  card_brand?: string;
  card_expiry?: string;
}

/**
 * Updates user onboarding data (partial save during wizard steps)
 */
export async function updateUserOnboarding(email: string, data: OnboardingData): Promise<User | null> {
  const supabase = await createClient();
  const user = await getUser(email);
  if (!user) return null;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  // Add profile fields if provided
  if (data.full_name !== undefined) updates.full_name = data.full_name;
  if (data.company !== undefined) updates.company = data.company;
  if (data.role !== undefined) updates.role = data.role;
  if (data.locations !== undefined) updates.locations = data.locations;
  if (data.industries !== undefined) updates.industries = data.industries;
  if (data.linkedin_url !== undefined) updates.linkedin_url = data.linkedin_url;
  if (data.profile_picture !== undefined) updates.profile_picture = data.profile_picture;
  if (data.onboarding_step !== undefined) updates.onboarding_step = data.onboarding_step;
  if (data.selected_plan !== undefined) updates.selected_plan = data.selected_plan;
  if (data.billing_period !== undefined) updates.billing_period = data.billing_period;
  if (data.trial_ends_at !== undefined) updates.trial_ends_at = data.trial_ends_at;
  // Card info (masked only - NEVER store full card numbers)
  if (data.card_last_four !== undefined) updates.card_last_four = data.card_last_four;
  if (data.card_brand !== undefined) updates.card_brand = data.card_brand;
  if (data.card_expiry !== undefined) updates.card_expiry = data.card_expiry;

  // Update ICP settings if provided
  if (data.icp_keywords !== undefined || data.exclude_keywords !== undefined) {
    const updatedSettings = { ...user.settings };
    if (data.icp_keywords !== undefined) updatedSettings.icp_keywords = data.icp_keywords;
    if (data.exclude_keywords !== undefined) updatedSettings.exclude_keywords = data.exclude_keywords;
    updates.settings = updatedSettings;
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email);

  if (error) return null;

  // Return updated user
  return getUser(email);
}

/**
 * Marks onboarding as complete for a user
 */
export async function completeOnboarding(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('email', email);

  if (error) return null;

  return getUser(email);
}

/**
 * Gets the current onboarding step based on filled data
 * Returns: 1 (user details), 2 (ICP config), 3 (complete/signup)
 */
export function getOnboardingStep(user: User): number {
  // Step 1: User details (name, company, role, locations)
  if (!user.full_name || !user.company || !user.role || user.locations.length === 0) {
    return 1;
  }

  // Step 2: ICP config (industries)
  if (user.industries.length === 0) {
    return 2;
  }

  // Step 3: Ready for completion
  return 3;
}

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  period: string;
  status: 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  // =============================================================================
  // DODO PAYMENTS INTEGRATION (Added: 2nd January 2026)
  // =============================================================================
  dodo_subscription_id: string | null; // Dodo subscription ID for API operations
  cancellation_reason?: string | null; // Reason provided when user cancels
  cancelled_at?: string | null;        // Timestamp when cancellation was requested
}

/**
 * Activate a user's plan (called after onboarding or upgrade)
 */
export async function activateUserPlan(
  userId: string,
  plan: string,
  period: string,
  trialDays: number = 7
): Promise<{ user: User | null; subscription: Subscription | null }> {
  const supabase = await createClient();
  const now = new Date();
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  // Calculate period end based on billing period
  let periodEnd: Date;
  if (period === 'annual') {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Update user's plan
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan,
      plan_started_at: now.toISOString(),
      plan_expires_at: periodEnd.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      analyses_used: 0,
      enrichments_used: 0,
      usage_reset_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', userId);

  if (userError) {
    console.error('Failed to activate user plan:', userError);
    return { user: null, subscription: null };
  }

  // Create subscription record
  const subscription = await createSubscription(userId, plan, period, trialEnd);

  // Get updated user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { user: user as User | null, subscription };
}

/**
 * Create a new subscription record
 */
export async function createSubscription(
  userId: string,
  plan: string,
  period: string,
  trialEnd: Date
): Promise<Subscription | null> {
  const supabase = await createClient();
  const now = new Date();

  // Calculate period end based on billing period
  let periodEnd: Date;
  if (period === 'annual') {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const subscription: Omit<Subscription, 'id'> = {
    user_id: userId,
    plan,
    period,
    status: 'trialing',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    // Dodo Payments - set by checkout/webhook flow
    dodo_subscription_id: null,
  };

  // Note: Dodo integration is handled via:
  // - POST /api/billing/checkout (creates checkout session)
  // - POST /api/webhooks/dodo (processes subscription events)
  // The dodo_subscription_id is populated by webhooks after successful payment

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Failed to create subscription:', error);
    return null;
  }

  return data as Subscription;
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Subscription;
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: Subscription['status']
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update subscription:', error);
    return null;
  }

  return data as Subscription;
}

/**
 * Cancel a subscription (internal use)
 *
 * NOTE: For user-initiated cancellations, use the /api/billing/cancel endpoint
 * which handles Dodo API communication and proper cleanup.
 *
 * This function is primarily used by:
 * - Webhook handlers when processing subscription.cancelled events
 * - Internal admin operations
 */
export async function cancelSubscription(subscriptionId: string): Promise<Subscription | null> {
  return updateSubscriptionStatus(subscriptionId, 'cancelled');
}

/**
 * Get user's billing info for display
 */
export async function getUserBillingInfo(userId: string): Promise<{
  plan: string;
  planName: string;
  period: string;
  status: string;
  isTrialing: boolean;
  trialDaysRemaining: number;
  currentPeriodEnd: string | null;
  analysesUsed: number;
  analysesLimit: number;
  enrichmentsUsed: number;
  enrichmentsLimit: number;
  // Card info (masked)
  cardLastFour: string | null;
  cardBrand: string | null;
  cardExpiry: string | null;
} | null> {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, billing_period, trial_ends_at, plan_expires_at, analyses_used, enrichments_used, card_last_four, card_brand, card_expiry')
    .eq('id', userId)
    .single();

  if (error || !user) return null;

  const subscription = await getUserSubscription(userId);

  // Import plan limits dynamically to avoid circular deps
  const { getPlanLimits } = await import('./plans');
  const limits = getPlanLimits(user.plan || 'free');

  const now = new Date();
  const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const isTrialing = trialEnd ? trialEnd > now : false;
  const trialDaysRemaining = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return {
    plan: user.plan || 'free',
    planName: limits.name,
    period: user.billing_period || 'monthly',
    status: subscription?.status || 'free',
    isTrialing,
    trialDaysRemaining,
    currentPeriodEnd: user.plan_expires_at,
    analysesUsed: user.analyses_used || 0,
    analysesLimit: user.plan === 'free' ? 5 : 999, // Free: 5, Paid: wallet-based (unlimited)
    enrichmentsUsed: user.enrichments_used || 0,
    enrichmentsLimit: user.plan === 'free' ? 10 : 999, // Free: 10, Paid: wallet-based (unlimited)
    // Card info (masked - never store full card numbers)
    cardLastFour: user.card_last_four || null,
    cardBrand: user.card_brand || null,
    cardExpiry: user.card_expiry || null,
  };
}

// ============================================================================
// ANALYSIS OPERATIONS
// ============================================================================

export async function getAnalyses(userId: string): Promise<Analysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Analysis[];
}

export async function getAnalysis(id: string, userId: string): Promise<Analysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Analysis;
}

export async function saveAnalysis(analysis: Omit<Analysis, 'id' | 'created_at'>): Promise<Analysis> {
  const supabase = await createClient();
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const created_at = new Date().toISOString();

  const newAnalysis: Analysis = {
    ...analysis,
    id,
    created_at
  };

  const { error } = await supabase.from('analyses').insert(newAnalysis);

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }

  return newAnalysis;
}

export async function deleteAnalysis(id: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}

export async function getUserStats(userId: string): Promise<{
  totalAnalyses: number;
  totalLeads: number;
  qualifiedLeads: number;
  thisMonth: number;
}> {
  const analyses = await getAnalyses(userId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    totalAnalyses: analyses.length,
    totalLeads: analyses.reduce((sum, a) => sum + a.leads.length, 0),
    qualifiedLeads: analyses.reduce((sum, a) => sum + a.qualified_leads_count, 0),
    thisMonth: analyses.filter(a => new Date(a.created_at) >= startOfMonth).length
  };
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function leadsToCSV(leads: Lead[]): string {
  const headers = ['Name', 'Headline', 'Profile URL', 'Matches ICP', 'Email'];
  const rows = leads.map(lead => [
    `"${lead.name.replace(/"/g, '""')}"`,
    `"${lead.headline.replace(/"/g, '""')}"`,
    lead.profile_url,
    lead.matches_icp ? 'Yes' : 'No',
    lead.email || ''
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function analysisToCSV(analysis: Analysis): string {
  const meta = [
    `Post URL,${analysis.post_url}`,
    `Author,${analysis.post_data.author}`,
    `Analyzed On,${new Date(analysis.created_at).toLocaleDateString()}`,
    `Total Reactions,${analysis.total_reactors}`,
    `Qualified Leads,${analysis.qualified_leads_count}`,
    ''
  ];

  return meta.join('\n') + '\n' + leadsToCSV(analysis.leads);
}

// ============================================================================
// CRM LEAD TYPES & OPERATIONS
// ============================================================================

export interface CRMLead {
  id: string;
  user_id: string;
  name: string;
  headline: string;
  profile_url: string;
  profile_picture?: string;
  source_analysis_id?: string;
  source_post_url?: string;
  added_at: string;
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed';
  enriched_data?: EnrichedData;
}

export interface EnrichedData {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  profileUrl: string;
  profilePicture: string | null;
  about: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  currentCompany: string | null;
  currentCompanyUrl: string | null;
  followerCount: number | null;
  connectionCount: number | null;
  isCreator: boolean;
  isInfluencer: boolean;
  isPremium: boolean;
  openToWork: boolean;
  topics: string[];
  experience: {
    title: string | null;
    company: string | null;
    duration: string | null;
    isCurrent: boolean;
    companyLogo: string | null;
  }[];
  education: {
    school: string | null;
    duration: string | null;
    schoolLogo: string | null;
  }[];
  enrichedAt: string;
}

export async function getCRMLeads(userId: string): Promise<CRMLead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error || !data) return [];
  return data as CRMLead[];
}

export async function getCRMLead(id: string, userId: string): Promise<CRMLead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as CRMLead;
}

export async function addCRMLeads(userId: string, leads: Omit<CRMLead, 'id' | 'user_id' | 'added_at' | 'enrichment_status'>[]): Promise<CRMLead[]> {
  const supabase = await createClient();
  // Get existing profile URLs to avoid duplicates
  const { data: existingLeads } = await supabase
    .from('crm_leads')
    .select('profile_url')
    .eq('user_id', userId);

  const existingUrls = new Set(
    (existingLeads || []).map((l: { profile_url: string }) => l.profile_url.toLowerCase())
  );

  const now = new Date().toISOString();

  const newLeads: CRMLead[] = leads
    .filter(lead => !existingUrls.has(lead.profile_url.toLowerCase()))
    .map(lead => ({
      ...lead,
      id: `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      added_at: now,
      enrichment_status: 'pending' as const,
    }));

  if (newLeads.length === 0) {
    return [];
  }

  const { error } = await supabase.from('crm_leads').insert(newLeads);

  if (error) {
    throw new Error(`Failed to add CRM leads: ${error.message}`);
  }

  return newLeads;
}

export async function updateCRMLead(id: string, userId: string, updates: Partial<CRMLead>): Promise<CRMLead | null> {
  const supabase = await createClient();
  // Don't allow updating id or user_id
  const { id: _, user_id: __, ...safeUpdates } = updates as any;

  const { error } = await supabase
    .from('crm_leads')
    .update(safeUpdates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return null;

  return getCRMLead(id, userId);
}

export async function deleteCRMLeads(userId: string, ids: string[]): Promise<number> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);

  if (error) return 0;
  return ids.length; // Supabase doesn't return count with .delete()
}

export async function getCRMStats(userId: string): Promise<{
  totalLeads: number;
  enrichedLeads: number;
  pendingLeads: number;
}> {
  const leads = await getCRMLeads(userId);
  return {
    totalLeads: leads.length,
    enrichedLeads: leads.filter(l => l.enrichment_status === 'enriched').length,
    pendingLeads: leads.filter(l => l.enrichment_status === 'pending').length,
  };
}