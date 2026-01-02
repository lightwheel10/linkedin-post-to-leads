"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  User,
  Target,
  Shield,
  Save,
  Loader2,
  Plus,
  X,
  Check,
  AlertCircle,
  FileText,
  Bell,
  CreditCard,
  Zap,
  Clock,
  Calendar,
  Crown,
  AlertTriangle,
  Download,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface UserSettings {
  icp_keywords: string[];
  exclude_keywords: string[];
  default_export_format: "csv" | "json";
  notifications_enabled: boolean;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  settings: UserSettings;
}

interface BillingInfo {
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
}

type SettingsTab = "account" | "billing" | "icp" | "export" | "notifications" | "danger";

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Billing & Usage", icon: CreditCard },
  { id: "icp", label: "ICP Filters", icon: Target },
  { id: "export", label: "Export", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: Shield },
];

// Plan configuration for display
const PLAN_DISPLAY = {
  free: {
    name: "Free",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-border",
  },
  pro: {
    name: "Pro",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  growth: {
    name: "Growth",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  scale: {
    name: "Scale",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
};

// Card brand display component
function CardBrandIcon({ brand }: { brand: string | null }) {
  const brandColors: Record<string, string> = {
    visa: 'from-blue-600 to-blue-800',
    mastercard: 'from-red-500 to-orange-500',
    amex: 'from-blue-500 to-cyan-500',
    discover: 'from-orange-400 to-orange-600',
    jcb: 'from-green-500 to-emerald-600',
    diners: 'from-blue-400 to-blue-600',
    card: 'from-slate-700 to-slate-800',
  };
  
  const gradientClass = brandColors[brand || 'card'] || brandColors.card;
  
  return (
    <div className={cn("w-10 h-7 rounded bg-gradient-to-br flex items-center justify-center", gradientClass)}>
      <CreditCard className="w-5 h-3 text-white" />
    </div>
  );
}

// Plans data for modal (wallet-based)
const PLANS = [
  {
    id: "pro",
    name: "Pro",
    walletCredits: 150,
    reactionCap: 300,
    commentCap: 200,
    monthlyPrice: 79,
    annualPrice: 790,
    annualMonthly: 65.83,
    savings: 158,
    features: ["$150 wallet credits/month", "Up to 300 reactions/post", "Up to 200 comments/post", "Email support"]
  },
  {
    id: "growth",
    name: "Growth",
    walletCredits: 300,
    reactionCap: 600,
    commentCap: 400,
    monthlyPrice: 179,
    annualPrice: 1790,
    annualMonthly: 149.17,
    savings: 358,
    popular: true,
    features: ["$300 wallet credits/month", "Up to 600 reactions/post", "Up to 400 comments/post", "Priority support"]
  },
  {
    id: "scale",
    name: "Scale",
    walletCredits: 500,
    reactionCap: 1000,
    commentCap: 600,
    monthlyPrice: 279,
    annualPrice: 2790,
    annualMonthly: 232.50,
    savings: 558,
    features: ["$500 wallet credits/month", "Up to 1,000 reactions/post", "Up to 600 comments/post", "Dedicated support"]
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [user, setUser] = useState<UserData | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Plan modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [modalBillingPeriod, setModalBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Form state
  const [icpKeywords, setIcpKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // New keyword inputs
  const [newIcpKeyword, setNewIcpKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setIcpKeywords(data.user.settings.icp_keywords || []);
          setExcludeKeywords(data.user.settings.exclude_keywords || []);
          setExportFormat(data.user.settings.default_export_format || "csv");
          setNotificationsEnabled(data.user.settings.notifications_enabled ?? true);
        }
      } catch (e) {
        console.error("Failed to fetch user:", e);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch("/api/billing");
        const data = await res.json();
        if (data.billing) {
          setBilling(data.billing);
          setModalBillingPeriod(data.billing.period === 'annual' ? 'annual' : 'monthly');
        }
      } catch (e) {
        console.error("Failed to fetch billing:", e);
      } finally {
        setBillingLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            icp_keywords: icpKeywords,
            exclude_keywords: excludeKeywords,
            default_export_format: exportFormat,
            notifications_enabled: notificationsEnabled,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    // =============================================================================
    // TODO: DODO PAYMENT GATEWAY INTEGRATION
    // - If upgrading: Create checkout session with new plan
    // - If downgrading: Schedule downgrade at end of billing period
    // - If changing billing period: Prorate charges
    // =============================================================================
    console.log('Selected plan:', planId, 'Period:', modalBillingPeriod);
    alert(`Plan change to ${planId} (${modalBillingPeriod}) - Payment integration coming soon!`);
    setShowPlanModal(false);
  };

  const addIcpKeyword = () => {
    const keyword = newIcpKeyword.trim().toLowerCase();
    if (keyword && !icpKeywords.includes(keyword)) {
      setIcpKeywords([...icpKeywords, keyword]);
      setNewIcpKeyword("");
    }
  };

  const addExcludeKeyword = () => {
    const keyword = newExcludeKeyword.trim().toLowerCase();
    if (keyword && !excludeKeywords.includes(keyword)) {
      setExcludeKeywords([...excludeKeywords, keyword]);
      setNewExcludeKeyword("");
    }
  };

  const removeIcpKeyword = (keyword: string) => {
    setIcpKeywords(icpKeywords.filter((k) => k !== keyword));
  };

  const removeExcludeKeyword = (keyword: string) => {
    setExcludeKeywords(excludeKeywords.filter((k) => k !== keyword));
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-primary";
  };

  const getUsageTextColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return "text-red-500";
    if (percentage >= 80) return "text-amber-500";
    return "text-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const planDisplay = PLAN_DISPLAY[billing?.plan as keyof typeof PLAN_DISPLAY] || PLAN_DISPLAY.free;

  // Get price display for current plan
  const getCurrentPlanPrice = () => {
    if (!billing || billing.plan === 'free') return null;
    const plan = PLANS.find(p => p.id === billing.plan);
    if (!plan) return null;
    if (billing.period === 'annual') {
      return `$${plan.annualMonthly.toFixed(0)}/mo (billed annually)`;
    }
    return `$${plan.monthlyPrice}/month`;
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Panel - Navigation */}
        <aside className="w-56 shrink-0 border-r border-border/50 bg-card/20">
          <div className="sticky top-0 p-4">
            <h1 className="text-lg font-semibold mb-1">Settings</h1>
            <p className="text-xs text-muted-foreground mb-6">Manage your preferences</p>

            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isDanger = tab.id === "danger";
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      activeTab === tab.id
                        ? isDanger
                          ? "bg-red-500/10 text-red-500"
                          : "bg-primary/10 text-primary"
                        : isDanger
                          ? "text-red-500/70 hover:bg-red-500/5 hover:text-red-500"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Panel - Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl p-8">
            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account information
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="mt-1.5 bg-muted/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <Input
                      value={
                        user?.created_at
                          ? new Date(user.created_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""
                      }
                      disabled
                      className="mt-1.5 bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Billing & Usage</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your subscription and track usage
                  </p>
                </div>

                {billingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : billing ? (
                  <>
                    {/* Current Plan Card */}
                    <div className={cn(
                      "p-6 rounded-xl border-2",
                      planDisplay.borderColor,
                      planDisplay.bgColor
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2.5 rounded-lg", planDisplay.bgColor)}>
                            {billing.plan === 'scale' ? (
                              <Crown className={cn("w-5 h-5", planDisplay.color)} />
                            ) : (
                              <Zap className={cn("w-5 h-5", planDisplay.color)} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-2xl font-bold", planDisplay.color)}>
                                {billing.planName}
                              </span>
                              {billing.plan !== 'free' && (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  billing.isTrialing 
                                    ? "bg-amber-500/20 text-amber-500" 
                                    : "bg-green-500/20 text-green-500"
                                )}>
                                  {billing.isTrialing ? 'Trial' : 'Active'}
                                </span>
                              )}
                            </div>
                            {getCurrentPlanPrice() && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {getCurrentPlanPrice()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          variant={billing.plan === 'free' ? 'default' : 'outline'}
                          onClick={() => setShowPlanModal(true)}
                        >
                          {billing.plan === 'free' ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade
                            </>
                          ) : (
                            'Change Plan'
                          )}
                        </Button>
                      </div>

                      {/* Trial countdown */}
                      {billing.isTrialing && billing.trialDaysRemaining > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-4">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">
                            <span className="font-medium text-amber-500">{billing.trialDaysRemaining} days</span>
                            <span className="text-muted-foreground"> remaining in your trial</span>
                          </span>
                        </div>
                      )}

                      {/* Period info */}
                      {billing.currentPeriodEnd && billing.plan !== 'free' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {billing.isTrialing ? 'Trial ends' : 'Next billing'}: {new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Usage This Month */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Usage This Month</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                          <div className={cn("text-2xl font-bold", getUsageTextColor(billing.analysesUsed, billing.analysesLimit))}>
                            {billing.analysesUsed} / {billing.analysesLimit}
                          </div>
                          <div className="text-sm text-muted-foreground">Post Analyses</div>
                          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", getUsageColor(billing.analysesUsed, billing.analysesLimit))}
                              style={{ width: `${Math.min((billing.analysesUsed / billing.analysesLimit) * 100, 100)}%` }} 
                            />
                          </div>
                          {billing.analysesUsed >= billing.analysesLimit && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                              <AlertTriangle className="w-3 h-3" />
                              Limit reached
                            </div>
                          )}
                        </div>
                        <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                          <div className={cn("text-2xl font-bold", getUsageTextColor(billing.enrichmentsUsed, billing.enrichmentsLimit))}>
                            {billing.enrichmentsUsed} / {billing.enrichmentsLimit}
                          </div>
                          <div className="text-sm text-muted-foreground">Profile Enrichments</div>
                          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", getUsageColor(billing.enrichmentsUsed, billing.enrichmentsLimit))}
                              style={{ width: `${Math.min((billing.enrichmentsUsed / billing.enrichmentsLimit) * 100, 100)}%` }} 
                            />
                          </div>
                          {billing.enrichmentsUsed >= billing.enrichmentsLimit && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                              <AlertTriangle className="w-3 h-3" />
                              Limit reached
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Payment Method</label>
                      <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                        {/* =============================================================================
                            TODO: DODO PAYMENT GATEWAY INTEGRATION
                            - "Update Card" button opens Dodo card update flow
                            - Handle card update webhook to refresh stored card info
                        ============================================================================= */}
                        {billing.cardLastFour ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardBrandIcon brand={billing.cardBrand} />
                              <div>
                                <div className="font-medium">•••• •••• •••• {billing.cardLastFour}</div>
                                <div className="text-xs text-muted-foreground">
                                  {billing.cardBrand && (
                                    <span className="capitalize">{billing.cardBrand}</span>
                                  )}
                                  {billing.cardExpiry && (
                                    <span> · Expires {billing.cardExpiry}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* TODO: Implement card update flow with Dodo */}
                            <Button variant="ghost" size="sm" disabled>
                              Update
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              No payment method on file
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowPlanModal(true)}>
                              Add Card
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Billing History */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Billing History</label>
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        {/* =============================================================================
                            TODO: DODO PAYMENT GATEWAY INTEGRATION
                            - Fetch invoices from Dodo API
                            - Display date, description, amount, status
                            - Download PDF button for each invoice
                        ============================================================================= */}
                        {billing.plan !== 'free' ? (
                          <div className="divide-y divide-border/50">
                            <div className="flex items-center justify-between p-4 bg-card/30">
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <div className="font-medium">{billing.planName} Plan - Trial</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">$0.00</span>
                                <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-sm text-muted-foreground">
                            No billing history yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cancel Subscription */}
                    {billing.plan !== 'free' && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Subscription</label>
                        <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Cancel Subscription</div>
                              <div className="text-sm text-muted-foreground">
                                You'll retain access until the end of your billing period
                              </div>
                            </div>
                            {/* =============================================================================
                                TODO: DODO PAYMENT GATEWAY INTEGRATION
                                - Call Dodo API to cancel subscription
                                - Show confirmation dialog first
                                - Update local state after cancellation
                            ============================================================================= */}
                            <Button variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500/10" disabled>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 rounded-lg border border-dashed border-border/50 text-center">
                    <div className="text-sm text-muted-foreground">Failed to load billing information</div>
                  </div>
                )}
              </div>
            )}

            {/* ICP Tab */}
            {activeTab === "icp" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">ICP Filters</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define your Ideal Customer Profile to filter leads
                  </p>
                </div>

                {/* Include Keywords */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Include Keywords</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Leads with these keywords in their headline will match your ICP
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {icpKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-sm border border-primary/20"
                      >
                        {keyword}
                        <button
                          onClick={() => removeIcpKeyword(keyword)}
                          className="hover:bg-primary/20 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {icpKeywords.length === 0 && (
                      <span className="text-sm text-muted-foreground">No keywords added</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., ceo, founder, director"
                      value={newIcpKeyword}
                      onChange={(e) => setNewIcpKeyword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addIcpKeyword())
                      }
                    />
                    <Button variant="outline" size="icon" onClick={addIcpKeyword}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border/50" />

                {/* Exclude Keywords */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Exclude Keywords</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Leads with these keywords will be filtered out
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {excludeKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-sm border border-red-500/20"
                      >
                        {keyword}
                        <button
                          onClick={() => removeExcludeKeyword(keyword)}
                          className="hover:bg-red-500/20 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {excludeKeywords.length === 0 && (
                      <span className="text-sm text-muted-foreground">No keywords added</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., student, intern, retired"
                      value={newExcludeKeyword}
                      onChange={(e) => setNewExcludeKeyword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addExcludeKeyword())
                      }
                    />
                    <Button variant="outline" size="icon" onClick={addExcludeKeyword}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === "export" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Export</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure how your data is exported
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Default Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportFormat("csv")}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        exportFormat === "csv"
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Excel, Google Sheets
                      </div>
                    </button>
                    <button
                      onClick={() => setExportFormat("json")}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        exportFormat === "json"
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        API integrations
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage how you receive updates
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Updates about analyses and new features
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      notificationsEnabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        notificationsEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Irreversible actions for your account
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Delete Account</div>
                      <div className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500/50 hover:bg-red-500/10 shrink-0"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPlanModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto m-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Choose Your Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {billing?.isTrialing 
                    ? "Select a plan to continue after your trial"
                    : "Upgrade or change your subscription"
                  }
                </p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex justify-center py-6">
              <div className="inline-flex items-center gap-2 p-1 rounded-full bg-muted/50 border border-border/50">
                <button
                  onClick={() => setModalBillingPeriod('monthly')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    modalBillingPeriod === 'monthly' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setModalBillingPeriod('annual')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    modalBillingPeriod === 'annual' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Annual
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    2 months free
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6 p-6 pt-0">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === billing?.plan && modalBillingPeriod === billing?.period;
                const isDowngrade = billing?.plan === 'scale' && plan.id !== 'scale' ||
                                   billing?.plan === 'growth' && plan.id === 'pro';
                const price = modalBillingPeriod === 'annual' ? plan.annualMonthly : plan.monthlyPrice;
                
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-xl border-2 p-6 transition-all",
                      plan.popular ? "border-primary" : "border-border",
                      isCurrent && "ring-2 ring-primary/20 bg-primary/5"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="mt-3">
                        <span className="text-4xl font-bold">${price.toFixed(0)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {modalBillingPeriod === 'annual' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="line-through">${plan.monthlyPrice}/mo</span>
                          <span className="text-primary ml-2">Save ${plan.savings}/year</span>
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className={cn("w-full", plan.popular && "bg-primary hover:bg-primary/90")}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        {isDowngrade ? 'Downgrade' : 'Select Plan'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="border-t border-border/50 p-6 text-center text-sm text-muted-foreground">
              All plans include CSV/JSON export and CRM storage. 
              {billing?.isTrialing && " Your trial will continue until you select a plan."}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
