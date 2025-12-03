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
  Coins,
  Zap,
  TrendingUp,
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

type SettingsTab = "account" | "billing" | "icp" | "export" | "notifications" | "danger";

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Billing & Credits", icon: CreditCard },
  { id: "icp", label: "ICP Filters", icon: Target },
  { id: "export", label: "Export", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
                <h2 className="text-xl font-semibold">Billing & Credits</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your credits and subscription
                </p>
              </div>

              {/* Credit Balance Card */}
              <div className="p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/20">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Available Credits</div>
                      <div className="text-3xl font-bold">0</div>
                    </div>
                  </div>
                  <Button>
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Credits
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Credits are used for post analysis, profile enrichment, and exports.
                </div>
              </div>

              {/* Current Plan */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Current Plan</label>
                <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Free Trial</div>
                      <div className="text-sm text-muted-foreground">
                        50 credits on signup
                      </div>
                    </div>
                    <Button variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>

              {/* Credit Usage Breakdown */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Credit Costs</label>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium">Action</th>
                        <th className="text-right px-4 py-2.5 font-medium">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-medium">Post Analysis</div>
                          <div className="text-xs text-muted-foreground">Fetch post details & reactions</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">—</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-medium">Profile Enrichment</div>
                          <div className="text-xs text-muted-foreground">Full LinkedIn profile data</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">—</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-medium">CSV Export</div>
                          <div className="text-xs text-muted-foreground">Download leads as CSV</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">—</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <div className="font-medium">Save to CRM</div>
                          <div className="text-xs text-muted-foreground">Add lead to your CRM</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Credit costs will be updated soon. Check docs/BILLING.md for integration notes.
                </p>
              </div>

              {/* Usage History */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Recent Usage</label>
                <div className="p-8 rounded-lg border border-dashed border-border/50 text-center">
                  <div className="text-sm text-muted-foreground">No usage history yet</div>
                </div>
              </div>
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
  );
}
