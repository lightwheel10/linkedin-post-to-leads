"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  Target,
  Shield,
  Save,
  Loader2,
  Plus,
  X,
  Check,
  AlertCircle,
  FileText,
  Bell
} from "lucide-react";

interface UserSettings {
  icp_keywords: string[];
  exclude_keywords: string[];
  default_export_format: 'csv' | 'json';
  notifications_enabled: boolean;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  settings: UserSettings;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [icpKeywords, setIcpKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // New keyword inputs
  const [newIcpKeyword, setNewIcpKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setIcpKeywords(data.user.settings.icp_keywords || []);
          setExcludeKeywords(data.user.settings.exclude_keywords || []);
          setExportFormat(data.user.settings.default_export_format || 'csv');
          setNotificationsEnabled(data.user.settings.notifications_enabled ?? true);
        }
      } catch (e) {
        console.error('Failed to fetch user:', e);
        setError('Failed to load settings');
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
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            icp_keywords: icpKeywords,
            exclude_keywords: excludeKeywords,
            default_export_format: exportFormat,
            notifications_enabled: notificationsEnabled
          }
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Failed to save settings. Please try again.');
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
    setIcpKeywords(icpKeywords.filter(k => k !== keyword));
  };

  const removeExcludeKeyword = (keyword: string) => {
    setExcludeKeywords(excludeKeywords.filter(k => k !== keyword));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and ICP preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "min-w-[120px]",
            saved && "bg-emerald-500 hover:bg-emerald-600"
          )}
        >
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

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Section */}
      <section className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/20">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Account</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="mt-1.5 bg-muted/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Member Since</label>
            <Input
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }) : ''}
              disabled
              className="mt-1.5 bg-muted/30"
            />
          </div>
        </div>
      </section>

      {/* ICP Configuration */}
      <section className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/20">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Ideal Customer Profile (ICP)</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Include Keywords */}
          <div>
            <label className="text-sm font-medium">Include Keywords</label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Leads with these keywords in their headline will be marked as matching your ICP
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {icpKeywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                >
                  {keyword}
                  <button
                    onClick={() => removeIcpKeyword(keyword)}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword (e.g., 'ceo', 'founder')"
                value={newIcpKeyword}
                onChange={(e) => setNewIcpKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIcpKeyword())}
                className="flex-1"
              />
              <Button variant="outline" onClick={addIcpKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Exclude Keywords */}
          <div>
            <label className="text-sm font-medium">Exclude Keywords</label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Leads with these keywords will be filtered out
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {excludeKeywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 text-sm border border-red-500/20"
                >
                  {keyword}
                  <button
                    onClick={() => removeExcludeKeyword(keyword)}
                    className="ml-1 hover:bg-red-500/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword (e.g., 'student', 'intern')"
                value={newExcludeKeyword}
                onChange={(e) => setNewExcludeKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExcludeKeyword())}
                className="flex-1"
              />
              <Button variant="outline" onClick={addExcludeKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Export Preferences */}
      <section className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/20">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Export Preferences</h2>
        </div>
        <div className="p-6">
          <label className="text-sm font-medium">Default Export Format</label>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setExportFormat('csv')}
              className={cn(
                "flex-1 p-4 rounded-lg border-2 transition-all",
                exportFormat === 'csv'
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
            >
              <div className="font-medium">CSV</div>
              <div className="text-xs text-muted-foreground mt-1">
                Compatible with Excel, Google Sheets
              </div>
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={cn(
                "flex-1 p-4 rounded-lg border-2 transition-all",
                exportFormat === 'json'
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
            >
              <div className="font-medium">JSON</div>
              <div className="text-xs text-muted-foreground mt-1">
                For developers and API integrations
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/20">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive updates about your analyses and new features
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative w-12 h-7 rounded-full transition-colors",
                notificationsEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                  notificationsEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/20">
          <Shield className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-red-500">Danger Zone</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Delete Account</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </div>
            </div>
            <Button variant="outline" className="text-red-500 border-red-500/50 hover:bg-red-500/10">
              Delete Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

