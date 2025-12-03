"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Analysis } from "@/lib/data-store";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Users,
  Target,
  MessageCircle,
  ThumbsUp,
  Share2,
  Calendar,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Clock,
  Zap
} from "lucide-react";

// ============================================================================
// ANALYSIS CARD COMPONENT - Focus on POST content, not author
// ============================================================================
function AnalysisCard({
  analysis,
  index,
  onDelete,
  onExport
}: {
  analysis: Analysis;
  index: number;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      style={{ 
        animationDelay: `${index * 80}ms`,
        animation: 'fadeSlideUp 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      <div className="p-4">
        {/* Header - Analyzed timestamp & actions */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Analyzed {formatDate(analysis.created_at)}
          </span>
          <div className="flex items-center gap-1">
            <a href={analysis.post_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-[#0077b5]">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onExport(analysis.id)}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-red-500"
              onClick={() => onDelete(analysis.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* POST CONTENT - The main focus */}
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">
            {analysis.post_data.content}
          </p>
        </div>

        {/* Attribution - small, not prominent */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {analysis.post_data.author_image ? (
              <img
                src={analysis.post_data.author_image}
                alt={analysis.post_data.author}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-medium">
                {analysis.post_data.author.charAt(0)}
              </div>
            )}
          </div>
          <span>Posted by <span className="text-foreground font-medium">{analysis.post_data.author}</span></span>
        </div>

        {/* Engagement Stats - Horizontal row */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">{analysis.post_data.total_reactions?.toLocaleString() || analysis.total_reactors.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-green-500" />
            <span className="font-medium">{analysis.post_data.total_comments || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-medium">{analysis.post_data.total_shares || 0}</span>
          </div>
        </div>

        {/* Leads discovered - The key metric */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{analysis.leads.length} Leads Discovered</p>
              <p className="text-xs text-muted-foreground">{analysis.qualified_leads_count} match your ICP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{analysis.qualified_leads_count}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Qualified</p>
          </div>
        </div>

        {/* View Leads button */}
        <Link href={`/dashboard/history/${analysis.id}`}>
          <Button 
            className="w-full"
            size="sm"
          >
            View Leads
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/80 via-card/50 to-card/30 p-12 text-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
      
      <div className="relative">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 animate-pulse">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          No Analyses Yet
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Start by analyzing a LinkedIn post to discover qualified leads who are actively engaging with content in your industry.
        </p>
        
        <Link href="/dashboard/analyze">
          <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-xl shadow-primary/25 border-0 px-8">
            <Sparkles className="w-5 h-5 mr-2" />
            Analyze Your First Post
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "leads" | "reactions">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchAnalyses = async () => {
    try {
      const res = await fetch('/api/analyses');
      const data = await res.json();
      setAnalyses(data.analyses || []);
    } catch (e) {
      console.error('Failed to fetch analyses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    
    try {
      await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const res = await fetch(`/api/analyses/${id}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  // Filter and sort
  const filteredAnalyses = analyses
    .filter(analysis => {
      const query = searchQuery.toLowerCase();
      return (
        analysis.post_data.author.toLowerCase().includes(query) ||
        analysis.post_data.content.toLowerCase().includes(query) ||
        analysis.post_url.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "leads") {
        return b.qualified_leads_count - a.qualified_leads_count;
      } else if (sortBy === "reactions") {
        return b.total_reactors - a.total_reactors;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Stats
  const totalLeads = analyses.reduce((sum, a) => sum + a.leads.length, 0);
  const totalQualified = analyses.reduce((sum, a) => sum + a.qualified_leads_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            Analysis History
          </h1>
          <p className="text-muted-foreground mt-1">
            Your LinkedIn post analyses and discovered leads
          </p>
        </div>

        {analyses.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick stats */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{totalLeads} Total</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{totalQualified} Qualified</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {analyses.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters & Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by author or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-background/50 border-border/40 focus:border-primary/50"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-background/50 border border-border/40">
                <Button
                  variant={sortBy === "date" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("date")}
                  className="h-8 px-3 text-xs"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Recent
                </Button>
                <Button
                  variant={sortBy === "leads" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("leads")}
                  className="h-8 px-3 text-xs"
                >
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Leads
                </Button>
                <Button
                  variant={sortBy === "reactions" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("reactions")}
                  className="h-8 px-3 text-xs"
                >
                  <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                  Reactions
                </Button>
              </div>

              {/* View toggle */}
              <div className="flex items-center p-1 rounded-lg bg-background/50 border border-border/40">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredAnalyses.length} of {analyses.length} analyses
          </p>

          {/* Grid */}
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className={cn(
              "grid gap-5",
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1 max-w-4xl"
            )}>
              {filteredAnalyses.map((analysis, index) => (
                <AnalysisCard
                  key={analysis.id}
                  analysis={analysis}
                  index={index}
                  onDelete={handleDelete}
                  onExport={handleExport}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

