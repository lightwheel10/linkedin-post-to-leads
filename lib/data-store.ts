import { supabase } from './supabase';

// ============================================================================
// DATA STORE - Supabase PostgreSQL Storage
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

export interface Credits {
  user_id: string;
  total_credits: number;
  used_credits: number;
  last_refill: string;
  transactions: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  type: 'initial' | 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  created_at: string;
  analysis_id?: string;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getUser(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function createUser(email: string): Promise<User> {
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
    }
  };

  const { error } = await supabase.from('users').insert(user);

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  // Initialize credits for new user
  await initializeCredits(id);

  return user;
}

export async function getOrCreateUser(email: string): Promise<User> {
  const existing = await getUser(email);
  if (existing) return existing;
  return createUser(email);
}

export async function updateUserSettings(email: string, settings: Partial<UserSettings>): Promise<User | null> {
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
// ANALYSIS OPERATIONS
// ============================================================================

export async function getAnalyses(userId: string): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Analysis[];
}

export async function getAnalysis(id: string, userId: string): Promise<Analysis | null> {
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
  const { error, count } = await supabase
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
// CREDITS OPERATIONS
// ============================================================================

const INITIAL_CREDITS = 50;

export async function initializeCredits(userId: string): Promise<Credits> {
  const now = new Date().toISOString();

  const credits: Credits = {
    user_id: userId,
    total_credits: INITIAL_CREDITS,
    used_credits: 0,
    last_refill: now,
    transactions: [{
      id: `txn_${Date.now()}`,
      type: 'initial',
      amount: INITIAL_CREDITS,
      description: 'Welcome credits',
      created_at: now
    }]
  };

  const { error } = await supabase.from('credits').insert(credits);

  if (error) {
    throw new Error(`Failed to initialize credits: ${error.message}`);
  }

  return credits;
}

export async function getCredits(userId: string): Promise<Credits | null> {
  const { data, error } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as Credits;
}

export async function getRemainingCredits(userId: string): Promise<number> {
  const credits = await getCredits(userId);
  if (!credits) return 0;
  return credits.total_credits - credits.used_credits;
}

export async function useCredit(userId: string, analysisId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
  const credits = await getCredits(userId);

  if (!credits) {
    return { success: false, remaining: 0, error: 'No credits found for user' };
  }

  const remaining = credits.total_credits - credits.used_credits;

  if (remaining <= 0) {
    return { success: false, remaining: 0, error: 'No credits remaining' };
  }

  const newTransaction: CreditTransaction = {
    id: `txn_${Date.now()}`,
    type: 'usage',
    amount: -1,
    description: 'Post analysis',
    created_at: new Date().toISOString(),
    analysis_id: analysisId
  };

  const { error } = await supabase
    .from('credits')
    .update({
      used_credits: credits.used_credits + 1,
      transactions: [...credits.transactions, newTransaction]
    })
    .eq('user_id', userId);

  if (error) {
    return { success: false, remaining, error: error.message };
  }

  return { success: true, remaining: remaining - 1 };
}

export async function addCredits(userId: string, amount: number, type: CreditTransaction['type'], description: string): Promise<Credits | null> {
  const credits = await getCredits(userId);
  if (!credits) return null;

  const newTransaction: CreditTransaction = {
    id: `txn_${Date.now()}`,
    type,
    amount,
    description,
    created_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('credits')
    .update({
      total_credits: credits.total_credits + amount,
      transactions: [...credits.transactions, newTransaction]
    })
    .eq('user_id', userId);

  if (error) return null;

  return {
    ...credits,
    total_credits: credits.total_credits + amount,
    transactions: [...credits.transactions, newTransaction]
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
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error || !data) return [];
  return data as CRMLead[];
}

export async function getCRMLead(id: string, userId: string): Promise<CRMLead | null> {
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
  const { error, count } = await supabase
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
