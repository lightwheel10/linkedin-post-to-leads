"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Wrench, Zap, Bug, Calendar } from "lucide-react";

type ChangeType = "feature" | "improvement" | "fix";

interface Change {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  changes: Change[];
}

const RELEASES: Release[] = [
  {
    version: "1.0.0",
    date: "December 3, 2025",
    title: "Initial Release",
    changes: [
      { type: "feature", text: "LinkedIn post analysis - extract reactors from any public post" },
      { type: "feature", text: "ICP filtering - automatically identify decision-makers based on job titles" },
      { type: "feature", text: "CRM system - save and manage qualified leads" },
      { type: "feature", text: "Profile enrichment - get full LinkedIn profile data via Apify" },
      { type: "feature", text: "CSV export - download leads for your outreach tools" },
      { type: "feature", text: "Credit system - 50 free credits on signup" },
      { type: "feature", text: "Email OTP authentication - passwordless secure login" },
      { type: "improvement", text: "Supabase integration for reliable data storage" },
    ],
  },
];

const typeConfig: Record<ChangeType, { icon: typeof Sparkles; label: string; color: string }> = {
  feature: {
    icon: Sparkles,
    label: "New",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  improvement: {
    icon: Zap,
    label: "Improved",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  fix: {
    icon: Bug,
    label: "Fixed",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

function ChangeItem({ change }: { change: Change }) {
  const config = typeConfig[change.type];
  const Icon = config.icon;

  return (
    <li className="flex items-start gap-3 py-2">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color} mt-0.5`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
      <span className="text-sm text-muted-foreground">{change.text}</span>
    </li>
  );
}

function ReleaseCard({ release, isLatest }: { release: Release; isLatest: boolean }) {
  return (
    <article className="relative">
      {/* Timeline connector */}
      <div className="absolute left-[7px] top-10 bottom-0 w-px bg-border/50" />
      
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 ${isLatest ? "bg-primary border-primary" : "bg-background border-border"}`} />
      
      <div className="pl-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-xl font-bold tracking-tight">v{release.version}</h2>
          {isLatest && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
              Latest
            </span>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {release.date}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-4">{release.title}</h3>

        {/* Changes */}
        <ul className="space-y-1 border-l-2 border-border/30 pl-4 mb-12">
          {release.changes.map((change, idx) => (
            <ChangeItem key={idx} change={change} />
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
          </div>
          <p className="text-muted-foreground">
            New features, improvements, and fixes. We ship updates regularly.
          </p>
        </header>

        {/* Releases */}
        <div className="relative">
          {RELEASES.map((release, idx) => (
            <ReleaseCard key={release.version} release={release} isLatest={idx === 0} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Want to request a feature?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Get in touch
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

