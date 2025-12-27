"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
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
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzePost, filterByICP } from "@/app/actions/analyze-post";
import { trackDemoStarted, trackDemoCompleted, trackEmailFound } from "@/lib/analytics";

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
                    {/* Author Avatar */}
                    <div className="relative w-12 h-12 flex-shrink-0 cursor-pointer">
                        {post.authorImage ? (
                            <img src={post.authorImage} alt={post.author} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#b8c2c8] flex items-center justify-center text-white font-bold text-lg">
                                {post.author.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Author Details */}
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

                    {/* More Options */}
                    <button className="text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.08)] p-1 rounded-full transition-colors h-8 w-8 flex items-center justify-center -mr-2">
                        <MoreHorizontal className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content Text */}
            <div className="px-4 py-1 pb-2">
                <p className="text-[14px] text-[rgba(0,0,0,0.9)] whitespace-pre-wrap leading-[1.5] break-words" style={{ direction: 'ltr' }}>
                    {post.content}
                </p>
            </div>

            {/* Post Image (If available) */}
            {post.postImage && (
                <div className="mt-1 w-full">
                    <img src={post.postImage} alt="Post content" className="w-full h-auto object-cover block border-y border-[#e0e0e0]/50" />
                </div>
            )}
            
            {/* Mock Image if no real image for demo purposes */}
            {!post.postImage && (
                <div className="mt-1 w-full bg-[#f3f2ef] min-h-[300px] flex items-center justify-center text-[rgba(0,0,0,0.6)] border-y border-[#e0e0e0]/50">
                    <div className="text-center p-8">
                         <p className="text-sm font-medium">Image Preview Not Available</p>
                         <p className="text-xs mt-1 opacity-70">(No image detected in analysis)</p>
                    </div>
                </div>
            )}

            {/* Stats / Social Proof */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-between text-[12px] text-[rgba(0,0,0,0.6)]">
                    {/* Reactions */}
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

                    {/* Comments / Reposts */}
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

            {/* Divider */}
            <div className="px-4">
                <div className="h-[1px] bg-[#e0e0e0]" />
            </div>

            {/* Action Buttons */}
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

            {/* Comment Input Section - hidden to keep card compact or can be added if needed */}
        </div>
    );
}

function LeadCard({ lead, index }: { lead: Lead; index: number }) {
    const [emailStatus, setEmailStatus] = useState<'idle' | 'finding' | 'found' | 'view'>('idle');

    const handleFindEmail = () => {
        // Track the email found event
        trackEmailFound(index);

        setEmailStatus('finding');
        // Simulate finding email
        setTimeout(() => {
            setEmailStatus('found');
            // Transition to view after a short delay
            setTimeout(() => {
                setEmailStatus('view');
            }, 1500);
        }, 2000);
    };

    return (
        <div
            className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-card/50 hover:bg-card/80 border border-border/50 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 shadow-sm hover:shadow-md"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Profile Section */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Avatar with Platform Badge */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                        {lead.profilePicture ? (
                            <img src={lead.profilePicture} alt={lead.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                                {lead.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 ring-1 ring-border">
                        <div className="bg-[#0077b5] rounded-full p-1">
                            <Linkedin className="w-3 h-3 text-white fill-current" />
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                        <a 
                            href={lead.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-lg text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                            {lead.name}
                            <ExternalLink className="w-3 h-3 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all text-muted-foreground" />
                        </a>
                        {lead.matchesICP && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium border border-emerald-500/20 shadow-sm">
                                <BadgeCheck className="w-3 h-3" />
                                High Match
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground/80 transition-colors">
                        {lead.headline}
                    </p>
                </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center justify-end md:pl-6 md:border-l border-border/50 flex-shrink-0">
                <Button 
                    size="sm" 
                    variant={emailStatus === 'view' ? "secondary" : "outline"}
                    className={cn(
                        "min-w-[140px] transition-all duration-300 shadow-sm font-medium",
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
                            <Mail className="w-4 h-4 mr-2" />
                            Find Email
                        </>
                    )}
                    {emailStatus === 'finding' && (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                        </>
                    )}
                    {emailStatus === 'found' && (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Verified
                        </>
                    )}
                    {emailStatus === 'view' && (
                        <>
                            <Eye className="w-4 h-4 mr-2" />
                            View Contact
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default function DemoPage() {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
    const [progressStep, setProgressStep] = useState(0); // Tracks the maximum step reached
    const [activeTab, setActiveTab] = useState(0); // Tracks the currently viewed tab
    const [logs, setLogs] = useState<string[]>([]);

    // Real data from backend
    const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
    const [allReactors, setAllReactors] = useState<Lead[]>([]);
    const [qualifiedLeads, setQualifiedLeads] = useState<Lead[]>([]);
    const [totalReactorsCount, setTotalReactorsCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Track demo completion when status becomes 'complete'
    useEffect(() => {
        if (status === 'complete' && qualifiedLeads.length > 0) {
            trackDemoCompleted(qualifiedLeads.length);
        }
    }, [status, qualifiedLeads.length]);

    const handleAnalyze = async () => {
        if (!url) return;

        // Track demo started
        trackDemoStarted();

        try {
            // Reset state
            setStatus('processing');
            setProgressStep(1);
            setActiveTab(1);
            setError(null);
            setLogs(["🔄 Connecting to LinkedIn...", "🔍 Analyzing post URL..."]);

            // Fetch real data from backend
            const result = await analyzePost(url);

            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to analyze post");
            }

            const { post, reactors, totalReactors } = result.data;

            // Step 1 Complete: Post Info
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

            // Move to Step 2
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

            // Move to Step 3
            setTimeout(async () => {
                setProgressStep(3);
                setActiveTab(3);
                setLogs(prev => [
                    ...prev,
                    "🔬 Analyzing profiles against ICP criteria...",
                    "🚫 Removing unqualified leads (students, recruiters, etc.)"
                ]);

                // Transform reactors to leads
                const leads: Lead[] = reactors.map(r => ({
                    name: r.name,
                    headline: r.headline,
                    profileUrl: r.profileUrl,
                    profilePicture: r.profilePicture,
                    matchesICP: false // Will be set by filter
                }));

                setAllReactors(leads);

                // Filter by ICP
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
            }, 4000);

            // Step 4 Complete
            setTimeout(() => {
                setStatus('complete');
                setProgressStep(4);
                setActiveTab(4);
                setLogs(prev => [
                    ...prev,
                    "📧 Email enrichment ready",
                    `🎉 Analysis complete! ${qualifiedLeads.length || 0} qualified leads found.`
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
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-32 md:py-40 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live Demo - Real LinkedIn Data
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        See <span className="text-gradient">Guffles</span> in Action
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Paste any LinkedIn post URL. We'll extract everyone who engaged and show you the buying signals hiding in plain sight.
                    </p>
                </div>

                {/* Interactive Demo Container */}
                <div className="relative bg-card/30 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-sm shadow-2xl min-h-[600px] flex flex-col">
                    {/* Background Grid */}
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                    {/* State: IDLE */}
                    {status === 'idle' && (
                        <div className="flex flex-col items-center justify-center flex-1 py-12 animate-in fade-in zoom-in duration-500">
                            <div className="w-full max-w-xl space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Linkedin className="h-5 w-5 text-muted-foreground group-focus-within:text-[#0077b5] transition-colors" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Paste LinkedIn Post URL (e.g., linkedin.com/posts/...)"
                                        className="pl-10 h-14 text-base bg-background/50 border-white/10 focus:border-primary/50 transition-all rounded-xl shadow-inner"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                    />
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                                    onClick={handleAnalyze}
                                    disabled={!url}
                                >
                                    {url ? "Analyze Post" : "Paste URL to Start"}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Direct Post Analysis mode. Extract everyone who liked or commented on any post.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* State: PROCESSING or COMPLETE */}
                    {(status === 'processing' || status === 'complete') && (
                        <div className="flex flex-col h-full animate-in fade-in duration-500">
                            {/* Tabs / Progress Steps */}
                            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8 relative">
                                {/* Connecting Line */}
                                <div className="absolute top-5 left-[12.5%] w-[75%] h-0.5 bg-white/5 -z-10">
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
                                                "flex flex-col items-center gap-2 group focus:outline-none z-10 relative",
                                                !isCompleted && "cursor-not-allowed"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                                                isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                                    isCompleted ? "bg-primary/20 border-primary text-primary hover:bg-primary/30" :
                                                        "border-white/10 text-muted-foreground/50"
                                            )}>
                                                {isCompleted && !isActive && step.id < progressStep ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <Icon className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium transition-colors duration-300 hidden md:block",
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

                            {/* Tab Content Area */}
                            <div className="flex-1 min-h-[400px] relative">
                                
                                {/* Tab 1: Post Analysis */}
                                {activeTab === 1 && postInfo && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                                        <div className="text-center mb-6">
                                            <h2 className="text-2xl font-bold mb-2">Scanning Target Post</h2>
                                            <p className="text-muted-foreground">Analyzing content and engagement structure...</p>
                                        </div>
                                        
                                        <div className="flex-1 flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 overflow-y-auto">
                                            <div className="w-full max-w-xl">
                                                <div className="mb-2 text-xs text-muted-foreground text-center uppercase tracking-wider font-semibold">Preview of Analyzed Post</div>
                                                <LinkedInPostCard post={postInfo} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 2: Reactions */}
                                {activeTab === 2 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                                        <div className="text-center mb-6">
                                            <h2 className="text-2xl font-bold mb-2">Extracting Reactions</h2>
                                            <p className="text-muted-foreground">Identifying potential leads from engagement...</p>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                                <div className="text-2xl font-bold">{totalReactorsCount.toLocaleString()}</div>
                                                <div className="text-sm text-muted-foreground">Total Reactions</div>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                                <MessageCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                                <div className="text-2xl font-bold">{postInfo?.totalComments}</div>
                                                <div className="text-sm text-muted-foreground">Comments</div>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                                <Share2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                                <div className="text-2xl font-bold">{postInfo?.totalShares}</div>
                                                <div className="text-sm text-muted-foreground">Shares</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-black/40 rounded-xl border border-white/10 p-4 font-mono text-sm overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                                                <span className="text-xs text-muted-foreground">extraction-log</span>
                                            </div>
                                            <div className="mt-8 space-y-2 max-h-[200px] overflow-y-auto">
                                                {logs.filter(l => l.includes("Found") || l.includes("Fetching")).map((log, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
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
                                        <div className="text-center mb-6">
                                            <h2 className="text-2xl font-bold mb-2">AI Scoring & Qualifying</h2>
                                            <p className="text-muted-foreground">AI analyzes each profile and scores them against your ideal buyer...</p>
                                        </div>

                                        <div className="flex items-center justify-center gap-8 mb-8">
                                            <div className="text-center opacity-50">
                                                <div className="text-3xl font-bold mb-1">{allReactors.length}</div>
                                                <div className="text-xs text-muted-foreground">Total Profiles</div>
                                            </div>
                                            <ArrowRight className="text-muted-foreground" />
                                            <div className="text-center text-primary scale-110">
                                                <div className="text-4xl font-bold mb-1">{qualifiedLeads.length}</div>
                                                <div className="text-xs font-semibold">Qualified Leads</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-1 overflow-hidden">
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                                                {qualifiedLeads.slice(0, 6).map((lead, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
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
                                                {qualifiedLeads.length > 6 && (
                                                    <div className="col-span-full text-center text-xs text-muted-foreground pt-2">
                                                        + {qualifiedLeads.length - 6} more qualified
                                                    </div>
                                                )}
                                             </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 4: Results */}
                                {activeTab === 4 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
                                        <div className="text-center mb-10">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 ring-1 ring-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
                                                <BadgeCheck className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-3xl font-bold tracking-tight mb-2">Qualified Leads Ready for Outreach</h2>
                                            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                                                Found <span className="text-foreground font-bold">{qualifiedLeads.length}</span> people showing buying intent. Reach out while it's fresh.
                                            </p>
                                        </div>

                                        <div className="flex-1">
                                            <div className="grid gap-4 pb-8">
                                                {qualifiedLeads.slice(0, 12).map((lead, index) => (
                                                    <LeadCard key={index} lead={lead} index={index} />
                                                ))}
                                            </div>
                                            {qualifiedLeads.length > 12 && (
                                                <p className="text-center text-sm text-muted-foreground mb-8">
                                                    + {qualifiedLeads.length - 12} more qualified leads found
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-white/10 flex justify-center">
                                            <Button variant="outline" onClick={reset}>
                                                Analyze Another Post
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* State: ERROR */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center justify-center flex-1 py-12 animate-in fade-in zoom-in duration-500">
                            <div className="max-w-md text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-500 mb-4">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold">Analysis Failed</h2>
                                <p className="text-muted-foreground">{error || "Something went wrong"}</p>
                                <div className="pt-4">
                                    <Button variant="outline" onClick={reset}>
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}