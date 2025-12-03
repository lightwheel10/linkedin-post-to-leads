"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast, useConfirm } from "@/components/ui/toast";
import type { Analysis, Lead } from "@/lib/data-store";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Linkedin,
  Users,
  Search,
  BadgeCheck,
  Loader2,
  Check,
  Trash2,
  ArrowUpDown,
  Circle,
  Database,
  Plus
} from "lucide-react";

// ============================================================================
// LINEAR-STYLE TABLE ROW COMPONENT
// ============================================================================
function LeadRow({ 
  lead, 
  index, 
  isSelected, 
  onSelect,
  onAddToCRM
}: { 
  lead: Lead; 
  index: number; 
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAddToCRM: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 border-b border-border/30 transition-colors cursor-pointer",
        "hover:bg-muted/40",
        isSelected && "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={() => onSelect(!isSelected)}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 w-5">
        <div
          className={cn(
            "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
            isSelected 
              ? "bg-primary border-primary" 
              : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted ring-1 ring-border/50">
          {lead.profile_picture ? (
            <img 
              src={lead.profile_picture} 
              alt={lead.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted">
              {lead.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="w-40 flex-shrink-0 min-w-0">
        <span className="text-sm font-medium text-foreground truncate block">
          {lead.name}
        </span>
      </div>

      {/* Headline - Takes remaining space */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-muted-foreground truncate block">
          {lead.headline}
        </span>
      </div>

      {/* ICP Badge */}
      <div className="flex-shrink-0 w-14">
        {lead.matches_icp && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <BadgeCheck className="w-3 h-3" />
            ICP
          </span>
        )}
      </div>

      {/* Actions - LinkedIn + Add to CRM button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a 
          href={lead.profile_url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-[#0077b5] hover:bg-[#0077b5]/10"
          >
            <Linkedin className="w-3.5 h-3.5" />
          </Button>
        </a>

        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCRM();
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add to CRM
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AnalysisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterICP, setFilterICP] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'icp'>('icp');
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());
  const [addingToCRM, setAddingToCRM] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyses/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setAnalysis(data.analysis);
      } catch (e) {
        console.error('Failed to fetch analysis:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const handleDeleteAnalysis = async () => {
    const confirmed = await confirm({
      title: "Delete Analysis",
      description: "Are you sure you want to delete this analysis? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
    
    if (!confirmed) return;

    try {
      await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      addToast("success", "Analysis deleted", "Redirecting to history...");
      router.push('/dashboard/history');
    } catch (e) {
      console.error('Delete failed:', e);
      addToast("error", "Delete failed", "Could not delete the analysis");
    }
  };

  const handleExport = async () => {
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

  const toggleSelect = (originalIndex: number, selected: boolean) => {
    const newSet = new Set(selectedLeads);
    if (selected) {
      newSet.add(originalIndex);
    } else {
      newSet.delete(originalIndex);
    }
    setSelectedLeads(newSet);
  };

  const handleAddLeadToCRM = async (lead: Lead) => {
    setAddingToCRM(true);
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          headline: lead.headline,
          profile_url: lead.profile_url,
          profile_picture: lead.profile_picture,
          source_analysis_id: id,
          source_post_url: analysis?.post_url,
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.added > 0) {
          addToast("success", `${lead.name} added to CRM`, "Go to CRM page to enrich and find email");
        } else {
          addToast("info", "Already in CRM", `${lead.name} is already in your CRM`);
        }
      } else {
        addToast("error", "Failed to add lead", data.error);
      }
    } catch (error) {
      console.error('Failed to add to CRM:', error);
      addToast("error", "Failed to add lead", "Could not connect to the server");
    } finally {
      setAddingToCRM(false);
    }
  };

  const handleAddAllToCRM = async (leadsToAdd: { lead: Lead; originalIndex: number }[]) => {
    const confirmed = await confirm({
      title: "Add leads to CRM",
      description: `Add ${leadsToAdd.length} leads to your CRM? You can enrich them later to find emails.`,
      confirmText: "Add All",
      cancelText: "Cancel"
    });
    
    if (!confirmed) return;

    setAddingToCRM(true);
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leadsToAdd.map(({ lead }) => ({
            name: lead.name,
            headline: lead.headline,
            profile_url: lead.profile_url,
            profile_picture: lead.profile_picture,
            source_analysis_id: id,
            source_post_url: analysis?.post_url,
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const skippedMsg = data.skipped > 0 ? ` (${data.skipped} duplicates skipped)` : '';
        addToast("success", `Added ${data.added} leads to CRM${skippedMsg}`, "Go to CRM page to enrich and find emails");
      } else {
        addToast("error", "Failed to add leads", data.error);
      }
    } catch (error) {
      console.error('Failed to add to CRM:', error);
      addToast("error", "Failed to add leads", "Could not connect to the server");
    } finally {
      setAddingToCRM(false);
    }
  };

  const handleDeleteSelected = async () => {
    const confirmed = await confirm({
      title: "Delete selected leads",
      description: `Remove ${selectedLeads.size} leads from this view? This won't delete them from your CRM.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
    
    if (!confirmed) return;
    
    setDeletedIndices(prev => new Set([...prev, ...selectedLeads]));
    setSelectedLeads(new Set());
    addToast("success", "Leads removed", `${selectedLeads.size} leads removed from view`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <Search className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold mb-2">Analysis Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">This analysis may have been deleted.</p>
        <Link href="/dashboard/history">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
      </div>
    );
  }

  // Get leads with original indices, excluding deleted ones
  const leadsWithIndices = analysis.leads
    .map((lead, index) => ({ lead, originalIndex: index }))
    .filter(({ originalIndex }) => !deletedIndices.has(originalIndex));

  // Filter and sort leads
  let displayLeads = leadsWithIndices.filter(({ lead }) => {
    const matchesSearch = !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesICP = !filterICP || lead.matches_icp;
    return matchesSearch && matchesICP;
  });

  // Sort: ICP matches first, then by name
  if (sortBy === 'icp') {
    displayLeads = [...displayLeads].sort((a, b) => {
      if (a.lead.matches_icp === b.lead.matches_icp) return a.lead.name.localeCompare(b.lead.name);
      return b.lead.matches_icp ? 1 : -1;
    });
  } else {
    displayLeads = [...displayLeads].sort((a, b) => a.lead.name.localeCompare(b.lead.name));
  }

  // Toggle select all function
  const toggleSelectAll = () => {
    if (selectedLeads.size === displayLeads.length && displayLeads.length > 0) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(displayLeads.map(l => l.originalIndex)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/history"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          History
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/30"
            onClick={handleDeleteAnalysis}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Leads Table - Linear Style */}
      <div className="rounded-lg border border-border/50 bg-card/30 overflow-hidden">
        {/* Table Header with Bulk Actions */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              Leads
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {displayLeads.length}
            </span>
            {selectedLeads.size > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                {selectedLeads.size} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Actions - Always visible at top */}
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => handleAddAllToCRM(displayLeads)}
              className="h-7 text-xs"
              disabled={addingToCRM || displayLeads.length === 0}
            >
              {addingToCRM ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <Database className="w-3 h-3 mr-1.5" />
              )}
              Add All to CRM
            </Button>

            {selectedLeads.size > 0 && (
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleDeleteSelected}
                className="h-7 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/30"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Delete ({selectedLeads.size})
              </Button>
            )}

            <div className="w-px h-5 bg-border/50" />

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-40 pl-8 text-xs bg-background/50 border-border/50"
              />
            </div>
            
            <Button
              variant={filterICP ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterICP(!filterICP)}
              className={cn(
                "h-7 text-xs gap-1.5",
                filterICP && "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/30"
              )}
            >
              <Circle className={cn("w-2 h-2", filterICP ? "fill-emerald-500" : "fill-muted-foreground/30")} />
              ICP
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy(sortBy === 'icp' ? 'name' : 'icp')}
              className="h-7 text-xs gap-1.5 text-muted-foreground"
            >
              <ArrowUpDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border/30 bg-muted/20 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <div className="flex-shrink-0 w-5">
            <div
              className={cn(
                "w-4 h-4 rounded border-2 transition-all flex items-center justify-center cursor-pointer",
                selectedLeads.size === displayLeads.length && displayLeads.length > 0
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground/30 hover:border-muted-foreground/50"
              )}
              onClick={toggleSelectAll}
            >
              {selectedLeads.size === displayLeads.length && displayLeads.length > 0 && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
          </div>
          <div className="flex-shrink-0 w-8"></div>
          <div className="w-40 flex-shrink-0">Name</div>
          <div className="flex-1">Title / Headline</div>
          <div className="flex-shrink-0 w-14">Match</div>
          <div className="flex-shrink-0 w-32 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div>
          {displayLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No leads match your filters</p>
            </div>
          ) : (
            displayLeads.map(({ lead, originalIndex }) => (
              <LeadRow
                key={originalIndex}
                lead={lead}
                index={originalIndex}
                isSelected={selectedLeads.has(originalIndex)}
                onSelect={(selected) => toggleSelect(originalIndex, selected)}
                onAddToCRM={() => handleAddLeadToCRM(lead)}
              />
            ))
          )}
        </div>

        {/* Table Footer - Just stats */}
        {displayLeads.length > 0 && (
          <div className="flex items-center px-3 py-2 border-t border-border/30 bg-muted/20">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="text-foreground font-medium">{displayLeads.length}</span> leads
              </span>
              <span>
                <span className="text-emerald-500 font-medium">{displayLeads.filter(({ lead }) => lead.matches_icp).length}</span> ICP matches
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
