"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  History,
  Settings,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
  Database,
  LogOut,
  ChevronUp,
  User,
  Zap,
  Users,
  AlertTriangle,
  Crown
} from "lucide-react";

interface UsageInfo {
  analysesUsed: number;
  analysesLimit: number;
  enrichmentsUsed: number;
  enrichmentsLimit: number;
  plan: string;
  planName: string;
  isTrialing: boolean;
  trialDaysRemaining?: number;
}

interface SidebarProps {
  userEmail: string;
  crmLeadsCount?: number;
  initialUsage?: UsageInfo;
}

export function Sidebar({ userEmail, crmLeadsCount = 0, initialUsage }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(initialUsage || null);

  // Fetch usage info
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/billing');
      const data = await res.json();
      if (data.billing) {
        setUsage({
          analysesUsed: data.billing.analysesUsed,
          analysesLimit: data.billing.analysesLimit,
          enrichmentsUsed: data.billing.enrichmentsUsed,
          enrichmentsLimit: data.billing.enrichmentsLimit,
          plan: data.billing.plan,
          planName: data.billing.planName,
          isTrialing: data.billing.isTrialing,
          trialDaysRemaining: data.billing.trialDaysRemaining,
        });
      }
    } catch (e) {
      console.error('Failed to fetch usage:', e);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (!initialUsage) {
      fetchUsage();
    }
  }, [initialUsage]);

  // Listen for usage update events (triggered after analysis completes)
  useEffect(() => {
    const handleUsageUpdate = () => {
      fetchUsage();
    };
    
    window.addEventListener('usage-updated', handleUsageUpdate);
    return () => window.removeEventListener('usage-updated', handleUsageUpdate);
  }, []);

  // Refetch when route changes (user navigates back to dashboard)
  useEffect(() => {
    fetchUsage();
  }, [pathname]);

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 80) return 'text-amber-500';
    return 'text-primary';
  };

  const getProgressColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-primary';
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'scale': return 'text-amber-500';
      case 'growth': return 'text-primary';
      case 'pro': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const NAV_ITEMS = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true
    },
    {
      label: "Analyze",
      href: "/dashboard/analyze",
      icon: Search,
      badge: "AI"
    },
    {
      label: "History",
      href: "/dashboard/history",
      icon: History
    },
    {
      label: "CRM",
      href: "/dashboard/crm",
      icon: Database,
      count: crmLeadsCount
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings
    }
  ];

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  // MIGRATION: Updated to use Supabase Auth logout endpoint
  // Previously just cleared the auth_token cookie manually
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const initials = userEmail
    .split('@')[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-44 border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 border-b border-border/50 px-3">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md shadow-primary/25">
          G
        </div>
        <span className="text-sm font-semibold">Guffles</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}

              <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", active && "text-primary")} />
              <span className="flex-1 truncate">{item.label}</span>

              {item.badge && (
                <span className="flex items-center gap-0.5 rounded bg-primary/15 px-1 py-0.5 text-[9px] font-semibold text-primary">
                  {item.badge === "AI" && <Sparkles className="h-2 w-2" />}
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && item.count > 0 && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  {item.count}
                </span>
              )}

              {active && <ChevronRight className="h-3 w-3 text-primary/50 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Usage & User */}
      <div className="p-2 space-y-2 border-t border-border/50">
        {/* Usage Display */}
        <div className="relative rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-card/50 p-2.5 space-y-2 overflow-hidden">
          {/* Decorative blur effects like CTA */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/30 rounded-full blur-[40px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-500/30 rounded-full blur-[40px] pointer-events-none" />
          {/* Plan Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {usage?.plan === 'scale' ? (
                <Crown className={cn("h-3 w-3", getPlanColor(usage?.plan || 'free'))} />
              ) : (
                <Zap className={cn("h-3 w-3", getPlanColor(usage?.plan || 'free'))} />
              )}
              <span className={cn("text-[10px] font-medium", getPlanColor(usage?.plan || 'free'))}>
                {usage?.planName || 'Free'}
              </span>
            </div>
            {usage?.isTrialing && usage.trialDaysRemaining && usage.trialDaysRemaining > 0 && (
              <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {usage.trialDaysRemaining}d left
              </span>
            )}
          </div>

          {/* Analyses Usage */}
          {usage && (
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Search className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Analyses</span>
                </div>
                <span className={cn("text-[10px] font-medium", getUsageColor(usage.analysesUsed, usage.analysesLimit))}>
                  {usage.analysesUsed}/{usage.analysesLimit}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getProgressColor(usage.analysesUsed, usage.analysesLimit))}
                  style={{ width: `${Math.min((usage.analysesUsed / usage.analysesLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Enrichments Usage */}
          {usage && (
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Enrichments</span>
                </div>
                <span className={cn("text-[10px] font-medium", getUsageColor(usage.enrichmentsUsed, usage.enrichmentsLimit))}>
                  {usage.enrichmentsUsed}/{usage.enrichmentsLimit}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getProgressColor(usage.enrichmentsUsed, usage.enrichmentsLimit))}
                  style={{ width: `${Math.min((usage.enrichmentsUsed / usage.enrichmentsLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Warning or Upgrade */}
          {usage && (usage.analysesUsed >= usage.analysesLimit || usage.enrichmentsUsed >= usage.enrichmentsLimit) ? (
            <div className="relative z-10 flex items-center gap-1.5 p-1.5 rounded bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <span className="text-[9px] text-red-500">Limit reached</span>
            </div>
          ) : usage?.plan === 'free' ? (
            <Link
              href="/dashboard/settings?tab=billing"
              className="relative z-10 flex items-center justify-center gap-1 rounded-md bg-primary hover:bg-primary/90 px-2 py-1.5 text-[10px] font-medium text-primary-foreground transition-all shadow-lg shadow-primary/30 hover:scale-[1.02]"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Upgrade
            </Link>
          ) : null}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg p-2 transition-all",
              "hover:bg-muted/50",
              showUserMenu && "bg-muted/50"
            )}
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-medium truncate">{userEmail.split('@')[0]}</p>
              <p className={cn("text-[9px]", getPlanColor(usage?.plan || 'free'))}>
                {usage?.planName || 'Free'}
              </p>
            </div>
            <ChevronUp className={cn(
              "h-3 w-3 text-muted-foreground transition-transform flex-shrink-0",
              !showUserMenu && "rotate-180"
            )} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute bottom-full left-0 right-0 z-50 mb-1.5 rounded-lg border border-border/50 bg-popover p-1 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2 py-1.5 border-b border-border/50 mb-1">
                  <p className="text-[10px] font-medium truncate">{userEmail}</p>
                </div>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <User className="h-3 w-3" />
                  Settings
                </Link>

                <div className="my-1 h-px bg-border/50" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
