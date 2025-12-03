"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  CheckCircle2,
  Users,
  Filter,
  Mail,
  ArrowRight,
  Linkedin,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Share2,
  BadgeCheck,
  Loader2,
  Check,
  Eye,
  ExternalLink,
  ThumbsUp,
  MoreHorizontal,
  Globe,
  Send,
  Download,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzePost, filterByICP } from "@/app/actions/analyze-post";

const STEPS = [
  { id: 1, label: "Post Analysis", icon: Search },
  { id: 2, label: "Reactions", icon: Users },
  { id: 3, label: "ICP Filtering", icon: Filter },
  { id: 4, label: "Qualified Leads", icon: Mail },
];

interface PostInfo {
  author: string;
  authorHeadline?: string;
  authorImage?: string;
  content: string;
  postImage?: string;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
}

interface Lead {
  name: string;
  headline: string;
  profileUrl: string;
  profilePicture?: string;
  matchesICP: boolean;
}

function LinkedInPostCard({ post }: { post: PostInfo }) {
  return (
    <div className="bg-white text-black rounded-lg border border-[#e0e0e0] shadow-sm max-w-[555px] mx-auto overflow-hidden font-sans text-left">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-3">
          <div className="relative w-12 h-12 flex-shrink-0 cursor-pointer">
            {post.authorImage ? (
              <img src={post.authorImage} alt={post.author} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#b8c2c8] flex items-center justify-center text-white font-bold text-lg">
                {post.author.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <span className="font-semibold text-[14px] text-[rgba(0,0,0,0.9)] hover:text-[#0a66c2] hover:underline cursor-pointer leading-tight">
                {post.author}
              </span>
              <span className="text-[rgba(0,0,0,0.6)] text-[12px]">• 2nd</span>
            </div>
            <div className="text-[12px] text-[rgba(0,0,0,0.6)] truncate max-w-md leading-tight mt-0.5">
              {post.authorHeadline || "LinkedIn Member"}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[rgba(0,0,0,0.6)] mt-0.5">
              <span>1h</span>
              <span>•</span>
              <Globe className="w-3 h-3 opacity-70" />
            </div>
          </div>
          <button className="text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.08)] p-1 rounded-full transition-colors h-8 w-8 flex items-center justify-center -mr-2">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-4 py-1 pb-2">
        <p className="text-[14px] text-[rgba(0,0,0,0.9)] whitespace-pre-wrap leading-[1.5] break-words" style={{ direction: 'ltr' }}>
          {post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content}
        </p>
      </div>

      {post.postImage && (
        <div className="mt-1 w-full">
          <img src={post.postImage} alt="Post content" className="w-full h-auto object-cover block border-y border-[#e0e0e0]/50" />
        </div>
      )}

      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-[12px] text-[rgba(0,0,0,0.6)]">
          <div className="flex items-center hover:text-[#0a66c2] hover:underline cursor-pointer">
            <div className="flex -space-x-1 mr-1.5">
              <div className="w-4 h-4 rounded-full bg-[#1485BD] flex items-center justify-center z-30 border border-white ring-1 ring-white">
                <ThumbsUp className="w-2.5 h-2.5 text-white fill-current" />
              </div>
              <div className="w-4 h-4 rounded-full bg-[#D93F2C] flex items-center justify-center z-20 border border-white ring-1 ring-white">
                <div className="text-[7px] text-white leading-none mt-[1px]">❤️</div>
              </div>
              <div className="w-4 h-4 rounded-full bg-[#5EA278] flex items-center justify-center z-10 border border-white ring-1 ring-white">
                <div className="text-[7px] text-white leading-none mt-[1px]">👏</div>
              </div>
            </div>
            <span>{post.totalReactions.toLocaleString()}</span>
          </div>
          <div className="flex gap-2 text-[rgba(0,0,0,0.6)]">
            <span className="hover:text-[#0a66c2] hover:underline cursor-pointer">
              {post.totalComments} comments
            </span>
            <span>•</span>
            <span className="hover:text-[#0a66c2] hover:underline cursor-pointer">
              {post.totalShares} reposts
            </span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="h-[1px] bg-[#e0e0e0]" />
      </div>

      <div className="px-2 py-1 flex items-center justify-between">
        <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 rounded hover:bg-[rgba(0,0,0,0.08)] transition-colors text-[rgba(0,0,0,0.6)] font-semibold text-sm group">
          <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[1.5px]" />
          <span className="font-semibold text-sm">Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 rounded hover:bg-[rgba(0,0,0,0.08)] transition-colors text-[rgba(0,0,0,0.6)] font-semibold text-sm group">
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[1.5px]" />
          <span className="font-semibold text-sm">Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 rounded hover:bg-[rgba(0,0,0,0.08)] transition-colors text-[rgba(0,0,0,0.6)] font-semibold text-sm group">
          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[1.5px]" />
          <span className="font-semibold text-sm">Repost</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 rounded hover:bg-[rgba(0,0,0,0.08)] transition-colors text-[rgba(0,0,0,0.6)] font-semibold text-sm group">
          <Send className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[1.5px] -rotate-12 translate-y-[-2px]" />
          <span className="font-semibold text-sm">Send</span>
        </button>
      </div>
    </div>
  );
}

function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'finding' | 'found' | 'view'>('idle');

  const handleFindEmail = () => {
    setEmailStatus('finding');
    setTimeout(() => {
      setEmailStatus('found');
      setTimeout(() => {
        setEmailStatus('view');
      }, 1500);
    }, 2000);
  };

  return (
    <div
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 border border-border/50 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
            {lead.profilePicture ? (
              <img src={lead.profilePicture} alt={lead.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                {lead.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 ring-1 ring-border">
            <div className="bg-[#0077b5] rounded-full p-0.5">
              <Linkedin className="w-2 h-2 text-white fill-current" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center flex-wrap gap-1.5">
            <a
              href={lead.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {lead.name}
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
            </a>
            {lead.matchesICP && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-medium border border-emerald-500/20">
                <BadgeCheck className="w-2.5 h-2.5" />
                Match
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground/80 transition-colors">
            {lead.headline}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end md:pl-4 md:border-l border-border/50 flex-shrink-0">
        <Button
          size="sm"
          variant={emailStatus === 'view' ? "secondary" : "outline"}
          className={cn(
            "h-7 min-w-[100px] text-xs transition-all duration-300 font-medium",
            emailStatus === 'idle' && "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            emailStatus === 'finding' && "opacity-80 cursor-wait",
            emailStatus === 'found' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
            emailStatus === 'view' && "bg-secondary text-secondary-foreground"
          )}
          onClick={handleFindEmail}
          disabled={emailStatus === 'finding' || emailStatus === 'found'}
        >
          {emailStatus === 'idle' && (
            <>
              <Mail className="w-3 h-3 mr-1" />
              Find Email
            </>
          )}
          {emailStatus === 'finding' && (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Finding...
            </>
          )}
          {emailStatus === 'found' && (
            <>
              <Check className="w-3 h-3 mr-1" />
              Found
            </>
          )}
          {emailStatus === 'view' && (
            <>
              <Eye className="w-3 h-3 mr-1" />
              View
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [progressStep, setProgressStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const [allReactors, setAllReactors] = useState<Lead[]>([]);
  const [qualifiedLeads, setQualifiedLeads] = useState<Lead[]>([]);
  const [totalReactorsCount, setTotalReactorsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  // Fetch current credits on mount
  useEffect(() => {
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => setCredits(data.remaining))
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!url) return;

    try {
      // Check credits first
      const creditCheck = await fetch('/api/credits');
      const creditData = await creditCheck.json();
      
      if (creditData.remaining <= 0) {
        setError("No credits remaining. Please upgrade your plan.");
        setStatus('error');
        return;
      }

      setStatus('processing');
      setProgressStep(1);
      setActiveTab(1);
      setError(null);
      setSavedAnalysisId(null);
      setLogs(["🔄 Connecting to LinkedIn...", "🔍 Analyzing post URL..."]);

      const result = await analyzePost(url);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to analyze post");
      }

      const { post, reactors, totalReactors } = result.data;

      setPostInfo({
        author: post.author,
        authorHeadline: post.authorHeadline,
        authorImage: post.image,
        content: post.content,
        postImage: post.postImage,
        totalReactions: post.totalReactions,
        totalComments: post.totalComments,
        totalShares: post.totalShares
      });

      setLogs(prev => [
        ...prev,
        `✅ Post found by ${post.author}`,
        `📊 Total engagement: ${post.totalReactions.toLocaleString()} reactions, ${post.totalComments} comments`
      ]);

      setTimeout(() => {
        setProgressStep(2);
        setActiveTab(2);
        setTotalReactorsCount(totalReactors);
        setLogs(prev => [
          ...prev,
          `🎯 Found ${totalReactors.toLocaleString()} total reactions`,
          `📥 Fetching reactor profiles... (${reactors.length} sampled)`
        ]);
      }, 1500);

      setTimeout(async () => {
        setProgressStep(3);
        setActiveTab(3);
        setLogs(prev => [
          ...prev,
          "🔬 Analyzing profiles against ICP criteria...",
          "🚫 Removing unqualified leads (students, recruiters, etc.)"
        ]);

        const leads: Lead[] = reactors.map(r => ({
          name: r.name,
          headline: r.headline,
          profileUrl: r.profileUrl,
          profilePicture: r.profilePicture,
          matchesICP: false
        }));

        setAllReactors(leads);

        const filtered = await filterByICP(reactors);
        const qualifiedLeadsList: Lead[] = filtered.map(r => ({
          name: r.name,
          headline: r.headline,
          profileUrl: r.profileUrl,
          profilePicture: r.profilePicture,
          matchesICP: true
        }));

        setQualifiedLeads(qualifiedLeadsList);

        setLogs(prev => [
          ...prev,
          `✅ ${qualifiedLeadsList.length} leads match your ICP criteria`
        ]);

        // Save the analysis and deduct credit
        try {
          const saveRes = await fetch('/api/analyses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_url: url,
              post_data: {
                author: post.author,
                author_headline: post.authorHeadline,
                author_image: post.image,
                content: post.content,
                post_image: post.postImage,
                total_reactions: post.totalReactions,
                total_comments: post.totalComments,
                total_shares: post.totalShares
              },
              total_reactors: totalReactors,
              qualified_leads_count: qualifiedLeadsList.length,
              leads: qualifiedLeadsList.map(l => ({
                name: l.name,
                headline: l.headline,
                profile_url: l.profileUrl,
                profile_picture: l.profilePicture,
                matches_icp: l.matchesICP
              }))
            })
          });
          
          const saveData = await saveRes.json();
          if (saveData.analysis?.id) {
            setSavedAnalysisId(saveData.analysis.id);
          }
          if (typeof saveData.remainingCredits === 'number') {
            setCredits(saveData.remainingCredits);
          }
        } catch (e) {
          console.error('Failed to save analysis:', e);
        }
      }, 4000);

      setTimeout(() => {
        setStatus('complete');
        setProgressStep(4);
        setActiveTab(4);
        setLogs(prev => [
          ...prev,
          "📧 Email enrichment ready",
          `🎉 Analysis complete!`
        ]);
      }, 6000);

    } catch (err) {
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      setLogs(prev => [...prev, `❌ Error: ${errorMsg}`]);
    }
  };

  const reset = () => {
    setStatus('idle');
    setUrl('');
    setLogs([]);
    setProgressStep(0);
    setActiveTab(0);
    setPostInfo(null);
    setAllReactors([]);
    setQualifiedLeads([]);
    setError(null);
    setSavedAnalysisId(null);
  };

  const handleExport = async () => {
    if (!savedAnalysisId) return;
    
    try {
      const res = await fetch(`/api/analyses/${savedAnalysisId}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${savedAnalysisId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Analyze LinkedIn Post</h1>
          <p className="text-muted-foreground text-xs">
            Extract qualified leads from post engagement
          </p>
        </div>
        {credits !== null && (
          <div className="flex items-center gap-1.5 text-xs">
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{credits}</span>
            <span className="text-muted-foreground">credits</span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="relative bg-card/30 border border-border/50 rounded-xl p-4 md:p-6 backdrop-blur-sm min-h-[450px] flex flex-col">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] rounded-2xl" />

        {/* IDLE State */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 animate-in fade-in zoom-in duration-500">
            <div className="w-full max-w-lg space-y-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                  <Linkedin className="h-4 w-4 text-muted-foreground group-focus-within:text-[#0077b5] transition-colors" />
                </div>
                <Input
                  type="text"
                  placeholder="Paste LinkedIn Post URL (e.g., linkedin.com/posts/...)"
                  className="pl-8 h-10 text-sm bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-lg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <Button
                size="sm"
                className="w-full h-9 text-sm font-medium rounded-lg shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                onClick={handleAnalyze}
                disabled={!url || (credits !== null && credits <= 0)}
              >
                {credits !== null && credits <= 0 ? (
                  "No Credits - Upgrade Plan"
                ) : url ? (
                  <>
                    Analyze Post
                    <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </>
                ) : (
                  "Paste URL to Start"
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Uses real LinkedIn data • 1 credit per analysis
              </p>
            </div>
          </div>
        )}

        {/* PROCESSING / COMPLETE State */}
        {(status === 'processing' || status === 'complete') && (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Progress Steps */}
            <div className="grid grid-cols-4 gap-1.5 md:gap-3 mb-5 relative">
              <div className="absolute top-4 left-[12.5%] w-[75%] h-0.5 bg-border/30 -z-10">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${((progressStep - 1) / 3) * 100}%` }}
                />
              </div>

              {STEPS.map((step) => {
                const isCompleted = progressStep >= step.id;
                const isActive = activeTab === step.id;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => isCompleted && setActiveTab(step.id)}
                    disabled={!isCompleted}
                    className={cn(
                      "flex flex-col items-center gap-1.5 group focus:outline-none z-10 relative",
                      !isCompleted && "cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                      isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :
                        isCompleted ? "bg-primary/20 border-primary text-primary hover:bg-primary/30" :
                          "border-border/50 text-muted-foreground/50"
                    )}>
                      {isCompleted && !isActive && step.id < progressStep ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium transition-colors duration-300 hidden md:block",
                      isActive ? "text-primary" :
                        isCompleted ? "text-foreground" :
                          "text-muted-foreground/50"
                    )}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-[280px] relative">
              {/* Tab 1: Post Analysis */}
              {activeTab === 1 && postInfo && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                  <div className="text-center mb-4">
                    <h2 className="text-base font-bold mb-1">Scanning Target Post</h2>
                    <p className="text-muted-foreground text-xs">Analyzing content and engagement...</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-3 bg-muted/20 rounded-lg border border-border/50 overflow-y-auto">
                    <div className="w-full max-w-lg">
                      <LinkedInPostCard post={postInfo} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Reactions */}
              {activeTab === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                  <div className="text-center mb-4">
                    <h2 className="text-base font-bold mb-1">Extracting Reactions</h2>
                    <p className="text-muted-foreground text-xs">Identifying potential leads...</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-muted/20 border border-border/50 rounded-lg p-4 text-center">
                      <Users className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
                      <div className="text-xl font-bold">{totalReactorsCount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Reactions</div>
                    </div>
                    <div className="bg-muted/20 border border-border/50 rounded-lg p-4 text-center">
                      <MessageCircle className="w-6 h-6 text-green-400 mx-auto mb-1.5" />
                      <div className="text-xl font-bold">{postInfo?.totalComments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div className="bg-muted/20 border border-border/50 rounded-lg p-4 text-center">
                      <Share2 className="w-6 h-6 text-purple-400 mx-auto mb-1.5" />
                      <div className="text-xl font-bold">{postInfo?.totalShares}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/40 rounded-lg border border-border/50 p-3 font-mono text-xs overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-6 bg-muted/20 border-b border-border/50 flex items-center px-3">
                      <span className="text-[10px] text-muted-foreground">extraction-log</span>
                    </div>
                    <div className="mt-6 space-y-1.5 max-h-[120px] overflow-y-auto">
                      {logs.filter(l => l.includes("Found") || l.includes("Fetching")).map((log, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="text-primary">➜</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Filtering */}
              {activeTab === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                  <div className="text-center mb-4">
                    <h2 className="text-base font-bold mb-1">ICP Filtering</h2>
                    <p className="text-muted-foreground text-xs">Matching against your Ideal Customer Profile...</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 mb-5">
                    <div className="text-center opacity-50">
                      <div className="text-2xl font-bold mb-0.5">{allReactors.length}</div>
                      <div className="text-[10px] text-muted-foreground">Total Profiles</div>
                    </div>
                    <ArrowRight className="text-muted-foreground h-4 w-4" />
                    <div className="text-center text-primary scale-110">
                      <div className="text-3xl font-bold mb-0.5">{qualifiedLeads.length}</div>
                      <div className="text-[10px] font-semibold">Qualified Leads</div>
                    </div>
                  </div>

                  <div className="flex-1 bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 p-3 max-h-[160px] overflow-y-auto">
                      {qualifiedLeads.slice(0, 6).map((lead, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                            {lead.profilePicture ? (
                              <img src={lead.profilePicture} alt={lead.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                                {lead.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{lead.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{lead.headline}</div>
                          </div>
                          <BadgeCheck className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Results */}
              {activeTab === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 mb-3 ring-1 ring-emerald-500/20">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold tracking-tight mb-1">Qualified Leads Found</h2>
                    <p className="text-muted-foreground text-sm">
                      Found <span className="text-foreground font-bold">{qualifiedLeads.length}</span> decision makers matching your ICP
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="grid gap-3 pb-3">
                      {qualifiedLeads.slice(0, 10).map((lead, index) => (
                        <LeadCard key={index} lead={lead} index={index} />
                      ))}
                    </div>
                    {qualifiedLeads.length > 10 && (
                      <p className="text-center text-xs text-muted-foreground mb-3">
                        + {qualifiedLeads.length - 10} more leads
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/50 flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport} disabled={!savedAnalysisId}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => savedAnalysisId && router.push(`/dashboard/history/${savedAnalysisId}`)}>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <Button size="sm" className="h-8 text-xs" onClick={reset}>
                      Analyze Another
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR State */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 animate-in fade-in zoom-in duration-500">
            <div className="max-w-sm text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500 mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">Analysis Failed</h2>
              <p className="text-muted-foreground text-sm">{error || "Something went wrong"}</p>
              <div className="pt-3">
                <Button variant="outline" size="sm" onClick={reset}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

