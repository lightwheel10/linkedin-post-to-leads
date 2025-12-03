"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  History,
  Settings,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
  Database,
  Coins,
  LogOut,
  ChevronUp,
  User
} from "lucide-react";

interface SidebarProps {
  userEmail: string;
  credits: number;
  crmLeadsCount?: number;
}

export function Sidebar({ userEmail, credits, crmLeadsCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const handleLogout = async () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
          L
        </div>
        <span className="text-sm font-semibold">LeadLift</span>
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

      {/* Bottom Section - Credits & User */}
      <div className="p-2 space-y-2 border-t border-border/50">
        {/* Credits Display */}
        <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground">Credits</span>
            </div>
            <span className="text-sm font-bold">{credits}</span>
          </div>
          <Link
            href="/#pricing"
            className="flex items-center justify-center gap-1 rounded-md bg-primary/90 hover:bg-primary px-2 py-1.5 text-[10px] font-medium text-primary-foreground transition-colors"
          >
            <Sparkles className="h-2.5 w-2.5" />
            Get More
          </Link>
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
              <p className="text-[9px] text-muted-foreground">Free</p>
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
