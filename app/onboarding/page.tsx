'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  MapPin,
  Sparkles,
  Check,
  Plus,
  X,
  Linkedin,
  Search,
  Edit3,
  CheckCircle,
  CreditCard,
  Shield,
  Zap,
  Crown,
  Calendar,
  Clock,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LOCATION_OPTIONS, 
  INDUSTRY_OPTIONS,
  DEFAULT_ICP_KEYWORDS,
  DEFAULT_EXCLUDE_KEYWORDS
} from '@/lib/onboarding-options';

type OnboardingStep = 1 | 2 | 3;

interface OnboardingData {
  linkedin_url: string;
  full_name: string;
  company: string;
  role: string;
  profile_picture: string;
  locations: string[];
  industries: string[];
  icp_keywords: string[];
  exclude_keywords: string[];
  selected_plan: string;
  billing_period: 'monthly' | 'annual';
}

// Pricing plans configuration (wallet-based)
const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 79,
    annualPrice: 790, // $65.83/mo effective
    annualMonthly: 65.83,
    savings: 158,
    walletCredits: 150,
    description: 'For solo founders and SDRs',
    features: [
      '$150 wallet credits/month',
      'Up to 300 reactions/post',
      'Up to 200 comments/post',
      'Lead scoring & enrichment',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 179,
    annualPrice: 1790, // $149.17/mo effective
    annualMonthly: 149.17,
    savings: 358,
    walletCredits: 300,
    description: 'For sales teams at scale',
    features: [
      '$300 wallet credits/month',
      'Up to 600 reactions/post',
      'Up to 400 comments/post',
      'CRM integrations',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 279,
    annualPrice: 2790, // $232.50/mo effective
    annualMonthly: 232.50,
    savings: 558,
    walletCredits: 500,
    description: 'For agencies and high-volume',
    features: [
      '$500 wallet credits/month',
      'Up to 1,000 reactions/post',
      'Up to 600 comments/post',
      'API access & webhooks',
      'Dedicated account manager'
    ],
    popular: false
  }
];

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCompletingCheckout, setIsCompletingCheckout] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);
  const [entryMode, setEntryMode] = useState<'choose' | 'linkedin' | 'manual'>('choose');
  
  // Form data
  const [data, setData] = useState<OnboardingData>({
    linkedin_url: '',
    full_name: '',
    company: '',
    role: '',
    profile_picture: '',
    locations: [],
    industries: [],
    icp_keywords: [...DEFAULT_ICP_KEYWORDS],
    exclude_keywords: [...DEFAULT_EXCLUDE_KEYWORDS],
    selected_plan: '',
    billing_period: 'monthly'
  });

  // Payment is now handled via Dodo hosted checkout - no card form needed

  // Custom keyword inputs
  const [newIcpKeyword, setNewIcpKeyword] = useState('');
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');

  // Load existing user data on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const { user } = await res.json();
          
          // If already onboarded, redirect to dashboard
          if (user.onboarding_completed) {
            router.push('/dashboard');
            return;
          }

          // Pre-fill existing data
          setData(prev => ({
            ...prev,
            linkedin_url: user.linkedin_url || '',
            full_name: user.full_name || '',
            company: user.company || '',
            role: user.role || '',
            profile_picture: user.profile_picture || '',
            locations: user.locations || [],
            industries: user.industries || [],
            icp_keywords: user.settings?.icp_keywords || DEFAULT_ICP_KEYWORDS,
            exclude_keywords: user.settings?.exclude_keywords || DEFAULT_EXCLUDE_KEYWORDS,
            selected_plan: user.selected_plan || '',
            billing_period: user.billing_period || 'monthly'
          }));

          // If profile already has data, skip the choose screen
          if (user.full_name && user.company && user.role) {
            setProfileFetched(true);
            setEntryMode(user.linkedin_url ? 'linkedin' : 'manual');
          }

          // Resume at saved onboarding step (from database)
          // This ensures users who leave at step 3 (payment) come back to step 3
          if (user.onboarding_step && user.onboarding_step >= 1 && user.onboarding_step <= 3) {
            setStep(user.onboarding_step as OnboardingStep);
          }
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadUserData();
  }, [router]);

  // =========================================================================
  // LEGACY: Handle old checkout return URL (2nd Jan 2026)
  // =========================================================================
  // DEPRECATED: Dodo now redirects to /checkout/callback instead.
  // This code is kept as a fallback in case someone has an old bookmark
  // or the redirect URL wasn't updated. It redirects to the new callback.
  //
  // OLD FLOW (broken): /onboarding?checkout=success → middleware blocks → /login
  // NEW FLOW (works):  /checkout/callback?session_id=xxx → verify via webhook → dashboard
  // =========================================================================
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');

    if (checkoutStatus === 'success') {
      // Redirect to new callback route for proper handling
      // This handles the case where:
      // 1. Old checkout links are still floating around
      // 2. User has session and can complete onboarding
      console.log('[Onboarding] Legacy checkout=success detected, redirecting to callback');

      if (sessionId) {
        // If we have a session_id, redirect to callback with it
        router.replace(`/checkout/callback?session_id=${sessionId}`);
      } else {
        // No session_id, try to complete onboarding directly (if authenticated)
        // This is the old behavior as a fallback
        setIsCompletingCheckout(true);

        const completeOnboarding = async () => {
          try {
            const res = await fetch('/api/onboarding/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || 'Failed to complete onboarding');
            }

            // Clear the URL params and redirect to dashboard
            router.replace('/dashboard?welcome=true');
          } catch (err: any) {
            console.error('Failed to complete onboarding:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setIsCompletingCheckout(false);
          }
        };

        completeOnboarding();
      }
    }
  }, [searchParams, router]);

  const fetchLinkedInProfile = async () => {
    if (!data.linkedin_url.trim()) {
      setError('Please enter your LinkedIn profile URL');
      return;
    }

    // Validate LinkedIn URL
    if (!data.linkedin_url.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/yourname)');
      return;
    }

    setError('');
    setIsFetching(true);

    try {
      const res = await fetch('/api/crm/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl: data.linkedin_url })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      if (!result.profile) {
        throw new Error('Profile not found. Please check the URL and try again.');
      }

      const profile = result.profile;

      // Extract role from headline or first experience
      let role = profile.headline || '';
      if (profile.experience && profile.experience.length > 0 && profile.experience[0].title) {
        role = profile.experience[0].title;
      }

      // Auto-fill the data
      setData(prev => ({
        ...prev,
        full_name: profile.fullName || prev.full_name,
        company: profile.currentCompany || (profile.experience?.[0]?.company) || prev.company,
        role: role || prev.role,
        profile_picture: profile.profilePicture || prev.profile_picture,
        // Try to auto-detect location
        locations: detectLocations(profile.location, profile.country) || prev.locations
      }));

      setProfileFetched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Helper to detect location from profile data
  const detectLocations = (location: string | null, country: string | null): string[] => {
    if (!location && !country) return [];
    
    const locationStr = `${location || ''} ${country || ''}`.toLowerCase();
    const detected: string[] = [];

    // Map common locations to our options
    const locationMappings: Record<string, string[]> = {
      'north-america': ['united states', 'usa', 'canada', 'us', 'america', 'new york', 'san francisco', 'california', 'texas', 'toronto'],
      'europe': ['united kingdom', 'uk', 'germany', 'france', 'spain', 'italy', 'netherlands', 'london', 'berlin', 'paris', 'amsterdam', 'ireland', 'sweden', 'denmark', 'norway', 'finland', 'switzerland', 'austria', 'belgium', 'portugal', 'poland'],
      'asia-pacific': ['india', 'singapore', 'australia', 'japan', 'china', 'hong kong', 'south korea', 'indonesia', 'malaysia', 'philippines', 'vietnam', 'thailand', 'new zealand', 'mumbai', 'bangalore', 'delhi', 'sydney', 'melbourne', 'tokyo'],
      'middle-east': ['uae', 'dubai', 'saudi arabia', 'israel', 'qatar', 'kuwait', 'bahrain', 'oman', 'jordan', 'lebanon', 'abu dhabi'],
      'latin-america': ['brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'sao paulo', 'buenos aires', 'mexico city'],
      'africa': ['south africa', 'nigeria', 'kenya', 'egypt', 'morocco', 'ghana', 'cape town', 'johannesburg', 'lagos', 'nairobi', 'cairo']
    };

    for (const [region, keywords] of Object.entries(locationMappings)) {
      if (keywords.some(kw => locationStr.includes(kw))) {
        detected.push(region);
        break; // Only add one region
      }
    }

    return detected;
  };

  const saveProgress = async (stepData: Record<string, unknown>, nextStep?: number) => {
    setIsSaving(true);
    try {
      // Include onboarding_step in save to track progress
      const dataToSave = nextStep 
        ? { ...stepData, onboarding_step: nextStep }
        : stepData;

      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save progress');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep1Next = async () => {
    if (!data.full_name.trim() || !data.company.trim() || !data.role.trim()) {
      setError('Please fill in all profile details');
      return;
    }
    setError('');
    
    await saveProgress({
      linkedin_url: data.linkedin_url,
      full_name: data.full_name,
      company: data.company,
      role: data.role,
      profile_picture: data.profile_picture
    }, 2);
    
    setStep(2);
  };

  const handleStep2Next = async () => {
    if (data.locations.length === 0) {
      setError('Please select at least one target location');
      return;
    }
    if (data.industries.length === 0) {
      setError('Please select at least one industry');
      return;
    }
    setError('');
    
    await saveProgress({
      locations: data.locations,
      industries: data.industries,
      icp_keywords: data.icp_keywords,
      exclude_keywords: data.exclude_keywords
    }, 3);
    
    setStep(3);
  };

  const handleStep3Next = async () => {
    if (!data.selected_plan) {
      setError('Please select a plan');
      return;
    }

    setError('');
    setIsRedirecting(true);

    try {
      // Call onboarding checkout API to create Dodo checkout session
      const res = await fetch('/api/onboarding/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: data.selected_plan,
          billingPeriod: data.billing_period,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect to Dodo's hosted checkout page
      // User will enter their card details there (PCI compliant)
      // After checkout, they'll be redirected back to /onboarding?checkout=success
      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsRedirecting(false);
    }
  };

  const toggleLocation = (value: string) => {
    setData(prev => ({
      ...prev,
      locations: prev.locations.includes(value)
        ? prev.locations.filter(l => l !== value)
        : [...prev.locations, value]
    }));
  };

  const toggleIndustry = (value: string) => {
    setData(prev => ({
      ...prev,
      industries: prev.industries.includes(value)
        ? prev.industries.filter(i => i !== value)
        : [...prev.industries, value]
    }));
  };

  const addIcpKeyword = () => {
    if (newIcpKeyword.trim() && !data.icp_keywords.includes(newIcpKeyword.toLowerCase().trim())) {
      setData(prev => ({
        ...prev,
        icp_keywords: [...prev.icp_keywords, newIcpKeyword.toLowerCase().trim()]
      }));
      setNewIcpKeyword('');
    }
  };

  const removeIcpKeyword = (keyword: string) => {
    setData(prev => ({
      ...prev,
      icp_keywords: prev.icp_keywords.filter(k => k !== keyword)
    }));
  };

  const addExcludeKeyword = () => {
    if (newExcludeKeyword.trim() && !data.exclude_keywords.includes(newExcludeKeyword.toLowerCase().trim())) {
      setData(prev => ({
        ...prev,
        exclude_keywords: [...prev.exclude_keywords, newExcludeKeyword.toLowerCase().trim()]
      }));
      setNewExcludeKeyword('');
    }
  };

  const removeExcludeKeyword = (keyword: string) => {
    setData(prev => ({
      ...prev,
      exclude_keywords: prev.exclude_keywords.filter(k => k !== keyword)
    }));
  };

  // Card formatting functions removed - payment handled via Dodo hosted checkout

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading screen when completing checkout after returning from Dodo
  if (isCompletingCheckout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Setting Up Your Account</h2>
            <p className="text-muted-foreground text-sm">
              Please wait while we complete your subscription setup...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute left-0 right-0 top-[-10%] h-[500px] w-full bg-primary/10 blur-[120px] opacity-30" />
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-12 h-1 mx-2 rounded-full transition-all",
                      step > s ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-center gap-8 mb-8 text-xs text-muted-foreground">
          <span className={cn(step >= 1 && "text-primary font-medium")}>Profile</span>
          <span className={cn(step >= 2 && "text-primary font-medium")}>ICP</span>
          <span className={cn(step >= 3 && "text-primary font-medium")}>Plan</span>
        </div>

        {/* Step 1: Profile Entry */}
        {step === 1 && (
          <Card className="border-border/50 shadow-xl animate-fade-in-up max-w-2xl mx-auto">
            {/* Choice Screen - Choose between LinkedIn or Manual */}
            {entryMode === 'choose' && (
              <>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Let's Get Started</CardTitle>
                  <CardDescription className="text-base">
                    How would you like to set up your profile?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Option 1: LinkedIn */}
                  <button
                    onClick={() => setEntryMode('linkedin')}
                    className="w-full p-4 rounded-lg border-2 border-border hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center group-hover:bg-[#0A66C2]/20 transition-colors">
                        <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Import from LinkedIn</p>
                        <p className="text-sm text-muted-foreground">Auto-fill your details from your LinkedIn profile</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#0A66C2] transition-colors" />
                    </div>
                  </button>

                  {/* Option 2: Manual */}
                  <button
                    onClick={() => setEntryMode('manual')}
                    className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Edit3 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Enter Details Manually</p>
                        <p className="text-sm text-muted-foreground">Fill in your information yourself</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                </CardContent>
              </>
            )}

            {/* LinkedIn Mode */}
            {entryMode === 'linkedin' && (
              <>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Connect Your LinkedIn</CardTitle>
                  <CardDescription className="text-base">
                    We'll auto-fill your details from your profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {/* LinkedIn URL Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      Your LinkedIn Profile URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://linkedin.com/in/yourname"
                        value={data.linkedin_url}
                        onChange={(e) => setData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                        className="h-11 flex-1"
                        disabled={isFetching}
                      />
                      <Button
                        onClick={fetchLinkedInProfile}
                        disabled={isFetching || !data.linkedin_url.trim()}
                        className="h-11 px-4"
                      >
                        {isFetching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {isFetching && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Fetching your profile details...
                      </p>
                    )}
                  </div>

                  {/* Profile Preview / Edit */}
                  {profileFetched && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border animate-fade-in-up">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {data.profile_picture ? (
                            <img
                              src={data.profile_picture}
                              alt={data.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              Profile Found
                              <CheckCircle className="w-4 h-4 text-primary" />
                            </p>
                            <p className="text-xs text-muted-foreground">Edit details below if needed</p>
                          </div>
                        </div>
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </div>

                      <div className="grid gap-4">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            Full Name
                          </label>
                          <Input
                            value={data.full_name}
                            onChange={(e) => setData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="h-9"
                          />
                        </div>

                        {/* Company */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="w-3 h-3" />
                            Company
                          </label>
                          <Input
                            value={data.company}
                            onChange={(e) => setData(prev => ({ ...prev, company: e.target.value }))}
                            className="h-9"
                          />
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3" />
                            Your Role
                          </label>
                          <Input
                            value={data.role}
                            onChange={(e) => setData(prev => ({ ...prev, role: e.target.value }))}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEntryMode('choose');
                        setError('');
                      }}
                      className="h-11"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    {profileFetched ? (
                      <Button
                        onClick={handleStep1Next}
                        className="flex-1 h-11"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                          Enter your LinkedIn URL to continue
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            )}

            {/* Manual Entry Mode */}
            {entryMode === 'manual' && (
              <>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Tell Us About Yourself</CardTitle>
                  <CardDescription className="text-base">
                    Fill in your details to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={data.full_name}
                        onChange={(e) => setData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="h-11"
                      />
                    </div>

                    {/* Company */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        Company <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Acme Inc."
                        value={data.company}
                        onChange={(e) => setData(prev => ({ ...prev, company: e.target.value }))}
                        className="h-11"
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        Your Role <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Sales Manager"
                        value={data.role}
                        onChange={(e) => setData(prev => ({ ...prev, role: e.target.value }))}
                        className="h-11"
                      />
                    </div>

                    {/* LinkedIn URL (Optional) */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        LinkedIn URL <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input
                        placeholder="https://linkedin.com/in/yourname"
                        value={data.linkedin_url}
                        onChange={(e) => setData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                        className="h-11"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEntryMode('choose');
                        setError('');
                      }}
                      className="h-11"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleStep1Next}
                      className="flex-1 h-11"
                      disabled={isSaving || !data.full_name.trim() || !data.company.trim() || !data.role.trim()}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Step 2: ICP Configuration */}
        {step === 2 && (
          <Card className="border-border/50 shadow-xl animate-fade-in-up max-w-2xl mx-auto">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Define Your Ideal Customer</CardTitle>
              <CardDescription className="text-base">
                Help us find the best leads for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Target Locations */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Where are your target customers?
                </label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map((location) => (
                    <button
                      key={location.value}
                      type="button"
                      onClick={() => toggleLocation(location.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                        data.locations.includes(location.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {location.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Target Industries</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <button
                      key={industry.value}
                      type="button"
                      onClick={() => toggleIndustry(industry.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                        data.industries.includes(industry.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {industry.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ICP Keywords */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Target Titles/Keywords
                  <span className="text-muted-foreground font-normal ml-2">(job titles to include)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20 min-h-[60px]">
                  {data.icp_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeIcpKeyword(keyword)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={newIcpKeyword}
                    onChange={(e) => setNewIcpKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIcpKeyword())}
                    className="h-9"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addIcpKeyword}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Exclude Keywords */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Exclude Keywords
                  <span className="text-muted-foreground font-normal ml-2">(filter out these profiles)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20 min-h-[60px]">
                  {data.exclude_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeExcludeKeyword(keyword)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword to exclude..."
                    value={newExcludeKeyword}
                    onChange={(e) => setNewExcludeKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExcludeKeyword())}
                    className="h-9"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addExcludeKeyword}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)} 
                  className="flex-1 h-11"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleStep2Next} 
                  className="flex-1 h-11"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Plan Selection & Payment */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Plan Selection Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {data.selected_plan ? 'Complete Your Subscription' : 'Choose Your Plan'}
              </h2>
              <p className="text-muted-foreground">
                Start with a <span className="text-primary font-semibold">7-day free trial</span>. Cancel anytime.
              </p>
            </div>

            {/* Plans Grid - Only show if no plan selected yet */}
            {!data.selected_plan && (
              <>
                {/* Billing Period Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 p-1 rounded-full bg-muted/50 border border-border">
                    <button
                      onClick={() => setData(prev => ({ ...prev, billing_period: 'monthly' }))}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        data.billing_period === 'monthly'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setData(prev => ({ ...prev, billing_period: 'annual' }))}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                        data.billing_period === 'annual'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Annual
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        2 months free
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => {
                    const isAnnual = data.billing_period === 'annual';
                    const displayPrice = isAnnual ? plan.annualMonthly : plan.monthlyPrice;
                    const totalPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                    
                    return (
                      <Card 
                        key={plan.id}
                        className={cn(
                          "relative transition-all border-2",
                          plan.popular 
                            ? "border-primary md:-mt-4 md:mb-4 shadow-lg shadow-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                              Most Popular
                            </span>
                          </div>
                        )}
                        <CardHeader className="pb-4 pt-6">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <div className="mt-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold">
                                ${isAnnual ? displayPrice.toFixed(0) : displayPrice}
                              </span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                            {isAnnual && (
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  <span className="line-through">${plan.monthlyPrice}/mo</span>
                                  <span className="ml-2 text-primary font-medium">
                                    Save ${plan.savings}/year
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Billed as ${totalPrice}/year
                                </p>
                              </div>
                            )}
                            {!isAnnual && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Billed monthly
                              </p>
                            )}
                          </div>
                          <CardDescription className="mt-2">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-3">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            onClick={() => setData(prev => ({ ...prev, selected_plan: plan.id }))}
                            className={cn(
                              "w-full h-11 mt-4",
                              plan.popular 
                                ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/25" 
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            )}
                          >
                            {plan.popular ? (
                              <>
                                <Crown className="mr-2 h-4 w-4" />
                                Select {plan.name}
                              </>
                            ) : (
                              <>Select {plan.name}</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* Selected Plan Summary + Payment Form - Only show after plan selected */}
            {data.selected_plan && (
              <div className="max-w-lg mx-auto space-y-4 animate-fade-in-up">
                {/* Selected Plan Summary */}
                {(() => {
                  const selectedPlan = PLANS.find(p => p.id === data.selected_plan);
                  const isAnnual = data.billing_period === 'annual';
                  const displayPrice = isAnnual ? selectedPlan?.annualMonthly : selectedPlan?.monthlyPrice;
                  const totalPrice = isAnnual ? selectedPlan?.annualPrice : selectedPlan?.monthlyPrice;
                  
                  return (
                    <Card className="border-2 border-primary/50 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {selectedPlan?.name} Plan 
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                  ({isAnnual ? 'Annual' : 'Monthly'})
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${displayPrice?.toFixed(isAnnual ? 0 : 0)}/month after trial
                                {isAnnual && (
                                  <span className="ml-1 text-primary">
                                    (${totalPrice}/year)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setData(prev => ({ ...prev, selected_plan: '' }))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Change
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Checkout Card - Redirects to Dodo hosted checkout */}
                {(() => {
                  const selectedPlan = PLANS.find(p => p.id === data.selected_plan);
                  const isAnnual = data.billing_period === 'annual';
                  const displayPrice = isAnnual ? selectedPlan?.annualMonthly : selectedPlan?.monthlyPrice;
                  const totalPrice = isAnnual ? selectedPlan?.annualPrice : selectedPlan?.monthlyPrice;

                  // Calculate trial dates
                  const trialStartDate = new Date();
                  const trialEndDate = new Date();
                  trialEndDate.setDate(trialEndDate.getDate() + 7);

                  const formatDate = (date: Date) => {
                    return date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  };

                  return (
                    <Card className="border-2 border-border shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Confirm Your Free Trial</CardTitle>
                            <CardDescription className="text-base">Review your plan details before continuing</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Trial Timeline */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                          <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Your Trial Timeline
                          </h4>

                          <div className="space-y-3">
                            {/* Start Date */}
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Trial Starts Today</p>
                                <p className="text-xs text-muted-foreground">{formatDate(trialStartDate)}</p>
                              </div>
                            </div>

                            {/* Dotted line connector */}
                            <div className="ml-4 border-l-2 border-dashed border-primary/30 h-6" />

                            {/* End Date */}
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Trial Ends</p>
                                <p className="text-xs text-muted-foreground">{formatDate(trialEndDate)}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  First charge of
                                  <span className="font-medium text-foreground">
                                    {isAnnual
                                      ? ` $${totalPrice}/year `
                                      : ` $${displayPrice}/month `
                                    }
                                  </span>
                                  after this date
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key Points */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              You won't be charged for 7 days
                            </p>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              Cancel anytime before trial ends - no questions asked
                            </p>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Zap className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              Upgrade or downgrade your plan anytime
                            </p>
                          </div>
                        </div>

                        {/* Next Step Info */}
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                          <CreditCard className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Next Step: Enter Payment Details</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You'll be redirected to our secure checkout page to enter your card information.
                              Your card will only be charged after the 7-day trial ends.
                            </p>
                          </div>
                        </div>

                        {/* Security Note */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shield className="w-4 h-4 text-primary" />
                          <span>Your payment info is secured with 256-bit SSL encryption</span>
                        </div>

                        {error && (
                          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                          </div>
                        )}

                        {isAnnual && selectedPlan && (
                          <div className="text-center text-sm text-primary font-medium">
                            You're saving ${selectedPlan.savings}/year with annual billing!
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setStep(2)}
                            className="h-12"
                            disabled={isRedirecting}
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                          <Button
                            onClick={handleStep3Next}
                            className="flex-1 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-base"
                            disabled={isRedirecting}
                          >
                            {isRedirecting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Redirecting to checkout...
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-5 w-5" />
                                Start Free Trial
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {/* Back button when viewing plans */}
            {!data.selected_plan && (
              <div className="flex justify-center">
                <Button 
                  variant="outline"
                  onClick={() => setStep(2)} 
                  className="h-11"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to ICP Settings
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {step < 3
            ? "You can always update these settings later in your dashboard"
            : "By starting your trial, you agree to our Terms of Service and Privacy Policy"
          }
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams()
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  );
}
