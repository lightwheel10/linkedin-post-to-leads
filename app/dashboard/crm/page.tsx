"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast, useConfirm } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  Linkedin,
  Loader2,
  Check,
  Database,
  Sparkles,
  Download,
  Trash2,
  Building,
  MapPin,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  BadgeCheck,
  GraduationCap,
  Briefcase,
  UserCheck,
  Mail,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES - Matching our API response
// ============================================================================
interface EnrichedData {
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

interface CRMLead {
  id: string;
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

// ============================================================================
// ENRICHED DETAILS PANEL - Expandable section showing full profile
// ============================================================================
function EnrichedDetails({ data }: { data: EnrichedData }) {
  return (
    <div className="px-4 py-4 bg-muted/20 border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - About & Stats */}
        <div className="space-y-4">
          {/* About */}
          {data.about && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">About</h4>
              <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                {data.about}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs">
            {data.followerCount && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{data.followerCount.toLocaleString()}</span> followers
              </div>
            )}
            {data.connectionCount && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{data.connectionCount.toLocaleString()}</span> connections
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {data.isInfluencer && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> Influencer
              </span>
            )}
            {data.isCreator && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <BadgeCheck className="w-3 h-3" /> Creator
              </span>
            )}
            {data.isPremium && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Premium
              </span>
            )}
            {data.openToWork && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Open to Work
              </span>
            )}
          </div>

          {/* Topics */}
          {data.topics && data.topics.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Topics</h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {data.topics.map((topic, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Experience & Education */}
        <div className="space-y-4">
          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Experience
              </h4>
              <div className="space-y-2">
                {data.experience.map((exp, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {exp.companyLogo ? (
                      <img src={exp.companyLogo} alt="" className="w-8 h-8 rounded object-cover bg-muted" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <Building className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exp.title || 'Unknown Role'}</p>
                      <p className="text-xs text-muted-foreground truncate">{exp.company || 'Unknown Company'}</p>
                      {exp.duration && (
                        <p className="text-[10px] text-muted-foreground">{exp.duration}</p>
                      )}
                    </div>
                    {exp.isCurrent && (
                      <span className="text-[10px] text-emerald-500 font-medium">Current</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Education
              </h4>
              <div className="space-y-2">
                {data.education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {edu.schoolLogo ? (
                      <img src={edu.schoolLogo} alt="" className="w-8 h-8 rounded object-cover bg-muted" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{edu.school || 'Unknown School'}</p>
                      {edu.duration && (
                        <p className="text-xs text-muted-foreground">{edu.duration}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enriched timestamp */}
      <div className="mt-4 pt-3 border-t border-border/30 text-[10px] text-muted-foreground">
        Enriched {new Date(data.enrichedAt).toLocaleDateString()} at {new Date(data.enrichedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

// ============================================================================
// LEAD ROW COMPONENT
// ============================================================================
function LeadRow({ 
  lead, 
  isSelected, 
  onSelect,
  onEnrich,
  onGetEmail,
  isExpanded,
  onToggleExpand
}: { 
  lead: CRMLead; 
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEnrich: () => void;
  onGetEmail: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  // Use enriched data if available, fallback to original
  const displayName = lead.enriched_data?.fullName || lead.name;
  const displayHeadline = lead.enriched_data?.headline || lead.headline;
  const displayPicture = lead.enriched_data?.profilePicture || lead.profile_picture;
  const displayCompany = lead.enriched_data?.currentCompany;
  const displayLocation = lead.enriched_data?.location;

  return (
    <div className={cn(
      "border-b border-border/30 transition-colors",
      isSelected && "bg-primary/5"
    )}>
      {/* Main Row */}
      <div
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 cursor-pointer",
          "hover:bg-muted/40",
        )}
        onClick={() => onSelect(!isSelected)}
      >
        {/* Expand button (only if enriched) */}
        <div className="flex-shrink-0 w-5">
          {lead.enrichment_status === 'enriched' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-0.5 rounded hover:bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>

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
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted ring-2 ring-border/50">
            {displayPicture ? (
              <img 
                src={displayPicture} 
                alt={displayName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Name & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {displayName}
            </span>
            {/* Status badge */}
            {lead.enrichment_status === 'enriched' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                <BadgeCheck className="w-3 h-3" />
              </span>
            )}
            {lead.enrichment_status === 'enriching' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {displayHeadline}
          </p>
          {/* Show company/location if enriched */}
          {(displayCompany || displayLocation) && (
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
              {displayCompany && (
                <span className="inline-flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {displayCompany}
                </span>
              )}
              {displayLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {displayLocation}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Added Date */}
        <div className="flex-shrink-0 w-20 text-xs text-muted-foreground">
          {formatDate(lead.added_at)}
        </div>

        {/* Actions */}
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
              className="h-8 w-8 text-muted-foreground hover:text-[#0077b5] hover:bg-[#0077b5]/10"
            >
              <Linkedin className="w-4 h-4" />
            </Button>
          </a>

          {lead.enrichment_status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEnrich();
              }}
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              Enrich
            </Button>
          )}

          {lead.enrichment_status === 'enriching' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled
            >
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              Enriching...
            </Button>
          )}

          {lead.enrichment_status === 'enriched' && (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Enriched
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onGetEmail();
                }}
              >
                <Mail className="w-3 h-3 mr-1.5" />
                Get Email
              </Button>
            </>
          )}

          {lead.enrichment_status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-red-500 border-red-500/30"
              onClick={(e) => {
                e.stopPropagation();
                onEnrich();
              }}
            >
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && lead.enriched_data && (
        <EnrichedDetails data={lead.enriched_data} />
      )}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Database className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No leads in CRM yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        Go to History and add leads from your analyses to start building your pipeline.
      </p>
      <Link href="/dashboard/history">
        <Button>
          View Analysis History
        </Button>
      </Link>
    </div>
  );
}

// ============================================================================
// STATS CARD
// ============================================================================
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CRM PAGE
// ============================================================================
export default function CRMPage() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'enriched'>('all');
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

  // Load leads from API on mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/crm/leads');
        const data = await response.json();
        if (data.success) {
          setLeads(data.leads);
        }
      } catch (error) {
        console.error('Failed to fetch CRM leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'pending' && lead.enrichment_status === 'pending') ||
      (filterStatus === 'enriched' && lead.enrichment_status === 'enriched');
    return matchesSearch && matchesFilter;
  });

  // Stats
  const totalLeads = leads.length;
  const enrichedCount = leads.filter(l => l.enrichment_status === 'enriched').length;
  const pendingCount = leads.filter(l => l.enrichment_status === 'pending').length;

  // Toggle functions
  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string, selected: boolean) => {
    const newSet = new Set(selectedLeads);
    if (selected) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedLeads(newSet);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedLeads);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedLeads(newSet);
  };

  // Enrich a single lead
  const handleEnrich = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    // Set status to enriching in UI
    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, enrichment_status: 'enriching' as const } : l
    ));

    // Also update status in database
    await fetch('/api/crm/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enrichment_status: 'enriching' })
    });

    try {
      const response = await fetch('/api/crm/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl: lead.profile_url })
      });

      const data = await response.json();

      if (data.success && data.profile) {
        // Update in database
        await fetch('/api/crm/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            enrichment_status: 'enriched',
            enriched_data: data.profile,
            name: data.profile.fullName || lead.name,
            headline: data.profile.headline || lead.headline,
            profile_picture: data.profile.profilePicture || lead.profile_picture,
          })
        });

        setLeads(prev => prev.map(l => 
          l.id === id ? { 
            ...l, 
            enrichment_status: 'enriched' as const,
            enriched_data: data.profile,
            name: data.profile.fullName || l.name,
            headline: data.profile.headline || l.headline,
            profile_picture: data.profile.profilePicture || l.profile_picture,
          } : l
        ));
        // Auto-expand to show results
        setExpandedLeads(prev => new Set([...prev, id]));
      } else {
        // Update failed status in database
        await fetch('/api/crm/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, enrichment_status: 'failed' })
        });

        setLeads(prev => prev.map(l => 
          l.id === id ? { ...l, enrichment_status: 'failed' as const } : l
        ));
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      
      // Update failed status in database
      await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enrichment_status: 'failed' })
      });

      setLeads(prev => prev.map(l => 
        l.id === id ? { ...l, enrichment_status: 'failed' as const } : l
      ));
    }
  };

  // Get email for a lead (placeholder - would use email finding API)
  const handleGetEmail = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    // For now, show a toast that this feature is coming
    // In the future, this would call an email finder API
    addToast("info", "Email finder coming soon", `We'll help you find ${lead.name}'s email address`);
  };

  // Bulk actions
  const handleBulkEnrich = async () => {
    const selectedArray = Array.from(selectedLeads);
    for (const id of selectedArray) {
      const lead = leads.find(l => l.id === id);
      if (lead && lead.enrichment_status === 'pending') {
        await handleEnrich(id);
      }
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: "Delete leads",
      description: `Permanently delete ${selectedLeads.size} leads from your CRM? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });
    
    if (!confirmed) return;
    
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedLeads) })
      });

      const data = await response.json();
      if (data.success) {
        const count = selectedLeads.size;
        setLeads(prev => prev.filter(l => !selectedLeads.has(l.id)));
        setSelectedLeads(new Set());
        addToast("success", "Leads deleted", `${count} leads removed from your CRM`);
      } else {
        addToast("error", "Delete failed", data.error || "Could not delete leads");
      }
    } catch (error) {
      console.error('Failed to delete leads:', error);
      addToast("error", "Delete failed", "Could not connect to the server");
    }
  };

  const handleExport = () => {
    // Create CSV
    const headers = ['Name', 'Headline', 'Company', 'Location', 'LinkedIn URL', 'Status'];
    const rows = leads.map(l => [
      l.enriched_data?.fullName || l.name,
      l.enriched_data?.headline || l.headline,
      l.enriched_data?.currentCompany || '',
      l.enriched_data?.location || '',
      l.profile_url,
      l.enrichment_status
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crm-leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading CRM leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and enrich your leads
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          icon={Users} 
          label="Total Leads" 
          value={totalLeads} 
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard 
          icon={BadgeCheck} 
          label="Enriched" 
          value={enrichedCount} 
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard 
          icon={Clock} 
          label="Pending" 
          value={pendingCount} 
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Leads Table */}
      <div className="rounded-lg border border-border/50 bg-card/30 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Leads</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {filteredLeads.length}
            </span>
            {selectedLeads.size > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                {selectedLeads.size} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {selectedLeads.size > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleBulkEnrich}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Enrich ({selectedLeads.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/30"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Delete
                </Button>
                <div className="w-px h-5 bg-border/50" />
              </>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-40 pl-8 text-xs bg-background/50 border-border/50"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted/50 border border-border/50">
              <Button
                variant={filterStatus === 'all' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="h-6 px-2 text-[10px]"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className="h-6 px-2 text-[10px]"
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'enriched' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus('enriched')}
                className="h-6 px-2 text-[10px]"
              >
                Enriched
              </Button>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-muted/20 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <div className="flex-shrink-0 w-5"></div>
          <div className="flex-shrink-0 w-5">
            <div
              className={cn(
                "w-4 h-4 rounded border-2 transition-all flex items-center justify-center cursor-pointer",
                selectedLeads.size === filteredLeads.length && filteredLeads.length > 0
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground/30 hover:border-muted-foreground/50"
              )}
              onClick={toggleSelectAll}
            >
              {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
          </div>
          <div className="flex-shrink-0 w-10"></div>
          <div className="flex-1">Lead</div>
          <div className="flex-shrink-0 w-20">Added</div>
          <div className="flex-shrink-0 w-32 text-right">Actions</div>
        </div>

        {/* Rows */}
        <div>
          {filteredLeads.length === 0 ? (
            leads.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="text-center py-12">
                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No leads match your search</p>
              </div>
            )
          ) : (
            filteredLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={(selected) => toggleSelect(lead.id, selected)}
                onEnrich={() => handleEnrich(lead.id)}
                onGetEmail={() => handleGetEmail(lead.id)}
                isExpanded={expandedLeads.has(lead.id)}
                onToggleExpand={() => toggleExpand(lead.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 bg-muted/20">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="text-foreground font-medium">{filteredLeads.length}</span> leads
              </span>
              <span>
                <span className="text-emerald-500 font-medium">{enrichedCount}</span> enriched
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Click the arrow to expand enriched profiles
            </p>
          </div>
        )}
      </div>

      {/* Quick Action Card */}
      {leads.length > 0 && pendingCount > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{pendingCount} leads waiting to be enriched</p>
                <p className="text-sm text-muted-foreground">Get full LinkedIn profile data</p>
              </div>
            </div>
            <Button onClick={() => {
              setFilterStatus('pending');
              const pendingIds = leads.filter(l => l.enrichment_status === 'pending').map(l => l.id);
              setSelectedLeads(new Set(pendingIds));
            }}>
              <Sparkles className="w-4 h-4 mr-2" />
              Select All Pending
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
