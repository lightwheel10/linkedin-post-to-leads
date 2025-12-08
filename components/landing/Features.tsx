"use client";

import { cn } from "@/lib/utils";
import { 
    Zap, 
    MessageSquare, 
    LineChart, 
    TrendingUp,
    TrendingDown,
    Shield, 
    Globe, 
    Layout, 
    Share2,
    FileSpreadsheet,
    ArrowRight,
    UploadCloud,
    Mail, 
    Sparkles,
    Database,
    Building,
    Check,
    Loader2
} from "lucide-react";
import { useState } from "react";

const PROFILES = [
    {
        name: "Alex Rivera",
        maskedName: "Al•• Riv•••",
        role: "Head of Growth @ TechFlow",
        email: "alex.rivera@techflow.io",
        maskedEmail: "alex••••@••••.io",
        initials: "AR",
        color: "from-blue-500 to-purple-600"
    },
    {
        name: "Sarah Chen",
        maskedName: "Sa••• Ch••",
        role: "Product Lead @ Sallas",
        email: "sarah.chen@sallas.com",
        maskedEmail: "sarah••••@••••.com",
        initials: "SC",
        color: "from-emerald-500 to-teal-600"
    },
    {
        name: "Mike Ross",
        maskedName: "Mi•• Ro••",
        role: "Senior SDR @ CloudScale",
        email: "mike.ross@cloudscale.inc",
        maskedEmail: "mike••••@•••••.inc",
        initials: "MR",
        color: "from-orange-500 to-red-600"
    }
];


export function Features() {
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
    const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

    const MOCK_LEADS = [
        {
            id: '1',
            name: 'Sarah Johnson',
            role: 'VP of Sales',
            company: 'TechCorp',
            matchScore: 92,
            image: 'Sarah',
            matchColor: 'text-emerald-500',
            matchBg: 'bg-emerald-500/10 border-emerald-500/20',
            action: "commented on this post",
            icon: MessageSquare
        },
        {
            id: '2',
            name: 'Mike Chen',
            role: 'Founder',
            company: 'StartFlow',
            matchScore: 88,
            image: 'Mike',
            matchColor: 'text-emerald-500',
            matchBg: 'bg-emerald-500/10 border-emerald-500/20',
            action: "liked this post",
            icon: TrendingUp
        },
        {
            id: '3',
            name: 'Alex Ritz',
            role: 'Dev Lead',
            company: 'FinTech Co',
            matchScore: 74,
            image: 'Alex',
            matchColor: 'text-yellow-500',
            matchBg: 'bg-yellow-500/10 border-yellow-500/20',
            action: "reposted this",
            icon: Share2
        }
    ];
    
    const CHART_DATA = [
        { height: 35, label: 'Mon', value: '12', change: '+2.5%' },
        { height: 60, label: 'Tue', value: '28', change: '+12.4%' },
        { height: 45, label: 'Wed', value: '18', change: '-3.2%' },
        { height: 75, label: 'Thu', value: '35', change: '+8.5%' },
        { height: 50, label: 'Fri', value: '22', change: '+4.1%' },
        { height: 85, label: 'Sat', value: '42', change: '+15.2%' },
        { height: 65, label: 'Sun', value: '30', change: '-1.8%' },
        { height: 95, label: 'Today', value: '54', change: '+24.5%' }
    ];

    const profile = PROFILES[currentProfileIndex];

    const handleMouseEnter = () => {
        setIsHovered(true);
        setIsLoading(true);
        
        // Simulate network delay then switch profile
        setTimeout(() => {
            setIsLoading(false);
            setCurrentProfileIndex((prev) => (prev + 1) % PROFILES.length);
        }, 600);
    };

    return (
        <section id="features" className="py-20 relative overflow-hidden">
            {/* Background Decoration - Matching Hero's subtle glow */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-primary/5 blur-[120px] rounded-full opacity-50" />
            </div>

            <div className="container px-4 md:px-6 relative z-10 max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary/80 mb-4">
                        <Sparkles className="w-3 h-3" />
                        <span>Three Ways to Find Leads</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
                        Find intent signals <span className="text-gradient">your way</span>
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        AI Search, Direct Post Analysis, or Profile Monitoring. Use whichever method fits your workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]">
                    
                    {/* Feature 1: AI Search */}
                    <div className="group md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-sm ring-1 ring-white/5 p-6 transition-all duration-300 hover:shadow-2xl hover:border-primary/20 hover:ring-primary/10">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Zap className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">AI Search</h3>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                                    Describe your ideal customer in plain English. AI finds relevant posts and extracts everyone who engaged. Up to 1,500 leads per search.
                                </p>
                            </div>
                            
                            {/* Skeleton: Infinite Vertical Scroll */}
                            <div className="relative w-full flex-1 min-h-[220px] bg-card/40 border border-white/5 rounded-lg overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                                <div className="absolute inset-x-0 space-y-3 animate-scroll-vertical p-4 hover:[animation-play-state:paused]">
                                    {/* Duplicated list for seamless loop */}
                                    {[...Array(2)].map((_, groupIndex) => (
                                        <div key={groupIndex} className="space-y-3">
                                            {MOCK_LEADS.map((lead) => (
                                                <div 
                                                    key={`${groupIndex}-${lead.id}`} 
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group/card cursor-default"
                                                >
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                                            <img 
                                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.image}`} 
                                                                alt={lead.name} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        </div>
                                                        <div className={cn(
                                                            "absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-background shadow-sm",
                                                            lead.matchColor,
                                                            lead.matchBg
                                                        )}>
                                                            {lead.matchScore}%
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 relative h-9">
                                                        {/* Default State: Profile Info */}
                                                        <div className="absolute inset-0 flex flex-col justify-center transition-all duration-300 group-hover/card:opacity-0 group-hover/card:translate-y-2">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <h4 className="text-xs font-semibold text-foreground truncate">{lead.name}</h4>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <span className="truncate max-w-[80px]">{lead.role}</span>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                                                                <span className="truncate max-w-[60px]">{lead.company}</span>
                                                            </div>
                                                        </div>

                                                        {/* Hover State: Action Context */}
                                                        <div className="absolute inset-0 flex items-center transition-all duration-300 opacity-0 -translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0">
                                                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/90">
                                                                <lead.icon className="w-3 h-3 text-primary" />
                                                                <span className="truncate">
                                                                    <span className="font-semibold text-foreground">{lead.name.split(' ')[0]}</span> {lead.action}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        {/* Non-Hover: Status Indicator */}
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50 group-hover/card:hidden animate-pulse" />
                                                        
                                                        {/* Hover: Action Button */}
                                                        <div className="hidden group-hover/card:flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary transition-all hover:bg-primary/20">
                                                            <span>Add</span>
                                                            <ArrowRight className="w-2.5 h-2.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Feature 2: Direct Post Analysis */}
                    <div
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-sm ring-1 ring-white/5 p-6 transition-all duration-300 hover:shadow-2xl hover:border-primary/20 hover:ring-primary/10"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Database className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Direct Post Analysis</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Found a viral post in your industry? Paste the URL. We extract everyone who engaged and enrich with verified emails.
                                </p>
                            </div>

                            <div className="flex-1 bg-card/40 border border-white/5 rounded-lg p-4 flex flex-col justify-center relative overflow-hidden group-hover:bg-card/60 transition-colors">
                                
                                {/* Profile Card UI */}
                                <div className="relative z-10 space-y-4">
                                    
                                    {/* Profile Header */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${profile.color} flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/10 transition-all duration-500`}>
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : profile.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* Name Reveal */}
                                            <div className="h-5 relative overflow-hidden">
                                                {/* Masked Name */}
                                                <div className={`absolute inset-0 flex items-center transition-all duration-300 ${isHovered && !isLoading ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                                                    <span className="text-sm font-medium text-muted-foreground/60 font-mono">{profile.maskedName}</span>
                                                </div>
                                                
                                                {/* Real Name */}
                                                <div className={`absolute inset-0 flex items-center transition-all duration-300 ${isHovered && !isLoading ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                                                    <span className="text-sm font-medium text-foreground">{profile.name}</span>
                                                </div>

                                                {/* Loading State */}
                                                {isLoading && (
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="h-2.5 w-24 bg-white/10 rounded-full animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="text-xs text-muted-foreground truncate">{profile.role}</div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px w-full bg-white/5" />

                                    {/* Email Row */}
                                    <div className="space-y-1.5">
                                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-0.5">Work Email</div>
                                        
                                        <div className="relative h-10 bg-black/20 rounded-md border border-white/5 flex items-center px-3 overflow-hidden group/email">
                                            <Mail className="w-3.5 h-3.5 text-muted-foreground mr-2.5 flex-shrink-0" />
                                            
                                            <div className="flex-1 relative h-full">
                                                {/* State 1: Masked (Default) */}
                                                <div className={`absolute inset-0 flex items-center justify-between transition-all duration-300 ${isHovered ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                                                    <span className="text-sm text-muted-foreground/40 tracking-widest font-mono">{profile.maskedEmail}</span>
                                                    <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-muted-foreground border border-white/5">Hidden</div>
                                                </div>

                                                {/* State 2: Fetching (Loading) */}
                                                <div className={`absolute inset-0 flex items-center gap-2 transition-all duration-300 ${isLoading ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                                                    <div className="h-2 w-32 bg-white/10 rounded-full animate-pulse" />
                                                    <span className="text-xs text-muted-foreground animate-pulse">Fetching...</span>
                                                </div>

                                                {/* State 3: Revealed (Success) */}
                                                <div className={`absolute inset-0 flex items-center gap-2 transition-all duration-300 ${!isLoading && isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                                                    <span className="text-sm text-foreground font-mono truncate">{profile.email}</span>
                                                    
                                                    {/* Verified Badge */}
                                                    <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-medium text-emerald-500 animate-in zoom-in duration-300">
                                                        <Check className="w-2.5 h-2.5" />
                                                        <span>Verified</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Scanning Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none transition-transform duration-[1.5s] ease-in-out ${isHovered ? 'translate-y-full' : '-translate-y-full'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Profile Monitoring */}
                    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-sm ring-1 ring-white/5 p-6 transition-all duration-300 hover:shadow-2xl hover:border-primary/20 hover:ring-primary/10">
                        <div className="relative z-10">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <LineChart className="w-4 h-4 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Profile Monitoring</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Add influencers or competitors to monitor. We auto-track who engages with their new posts for 72 hours.
                                </p>
                            </div>
                            
                            {/* Chart Container */}
                            <div 
                                className="relative h-32 w-full bg-card/40 border border-white/5 rounded-lg overflow-hidden p-4 flex items-end group/chart"
                                onMouseLeave={() => setHoveredBarIndex(null)}
                            >
                                
                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                                {/* Interactive Bars */}
                                {CHART_DATA.map((bar, i) => (
                                    <div 
                                        key={i}
                                        className="relative flex-1 h-full flex items-end justify-center px-1 group/bar min-w-0"
                                        onMouseEnter={() => setHoveredBarIndex(i)}
                                    >
                                        <div 
                                            className="relative w-full bg-white/5 rounded-t-[2px] transition-all duration-300 hover:bg-primary/10 border-t border-white/10 hover:border-primary/30"
                                            style={{ height: `${bar.height}%` }}
                                        >
                                            {/* Content Mask for Fills */}
                                            <div className="absolute inset-0 rounded-t-[2px] overflow-hidden">
                                                {/* Standard State - Subtle Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
                                                
                                                {/* Hover Glow Effect - Bottom Up Fill */}
                                                <div className="absolute inset-x-0 bottom-0 top-5 bg-gradient-to-t from-primary/40 via-primary/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-all duration-500 transform translate-y-full group-hover/bar:translate-y-0" />

                                                {/* Animated Growth Fill (Initial Load) */}
                                                <div 
                                                    className="absolute bottom-0 left-0 w-full bg-white/5 transition-all duration-[1000ms] ease-out"
                                                    style={{ 
                                                        height: '100%',
                                                        transform: 'scaleY(0)',
                                                        animation: `grow-up 1s ease-out forwards ${i * 0.1}s` 
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Dynamic Data Tooltip - Positioned Top Left */}
                                <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-md border border-green-500/20 shadow-lg rounded-lg p-1.5 px-2.5 flex items-center gap-2.5 z-20 transition-all duration-200 min-w-[100px] pointer-events-none">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                                            {hoveredBarIndex !== null ? CHART_DATA[hoveredBarIndex].label : 'Weekly'}
                                        </span>
                                        <span className="text-base font-bold text-foreground leading-none transition-all duration-200 mt-0.5">
                                            {hoveredBarIndex !== null ? CHART_DATA[hoveredBarIndex].value : '241'}
                                        </span>
                                    </div>
                                    <div className="h-6 w-px bg-border" />
                                    <div className={`flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full border transition-colors duration-200 ${
                                        (hoveredBarIndex !== null ? CHART_DATA[hoveredBarIndex].change : '+12.5%').startsWith('+') 
                                            ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                                            : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                                    }`}>
                                        {(hoveredBarIndex !== null ? CHART_DATA[hoveredBarIndex].change : '+12.5%').startsWith('+') 
                                            ? <TrendingUp className="w-2 h-2" /> 
                                            : <TrendingDown className="w-2 h-2" />
                                        }
                                        <span>{hoveredBarIndex !== null ? CHART_DATA[hoveredBarIndex].change : '+12.5%'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4: Export & Integrate */}
                    <div className="group md:col-span-2 relative overflow-hidden rounded-xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-sm ring-1 ring-white/5 p-6 transition-all duration-300 hover:shadow-2xl hover:border-primary/20 hover:ring-primary/10">
                        <div className="grid md:grid-cols-2 gap-8 items-center h-full">
                            <div className="relative z-10">
                                <div className="mb-6 md:mb-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Share2 className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Export & Integrate</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Export to CSV or sync with HubSpot, Salesforce, and more. Start your warm outreach while intent is fresh.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="relative h-40 bg-card/40 border border-white/5 rounded-lg overflow-hidden flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05]" />
                                
                                {/* Animated Background Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                                <div className="relative z-10 flex items-center gap-3">
                                    {/* Source: Lead */}
                                    <div className="relative flex flex-col items-center justify-center z-20">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center relative">
                                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                                            <Database className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="absolute -bottom-6 text-[10px] font-medium text-muted-foreground whitespace-nowrap">Leads</span>
                                    </div>

                                    {/* SVG Connection Lines */}
                                    <div className="w-24 h-24 relative flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 96 96" fill="none">
                                            {/* Static Base Lines */}
                                            <path 
                                                d="M0 48 H32 C 48 48, 48 28, 96 28" 
                                                stroke="currentColor" 
                                                className="text-white/10" 
                                                strokeWidth="2" 
                                                strokeDasharray="4 4" 
                                            />
                                            <path 
                                                d="M0 48 H32 C 48 48, 48 68, 96 68" 
                                                stroke="currentColor" 
                                                className="text-white/10" 
                                                strokeWidth="2" 
                                                strokeDasharray="4 4" 
                                            />
                                            
                                            {/* Animated Overlay Lines (Visible on Hover) */}
                                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <path 
                                                    d="M0 48 H32 C 48 48, 48 28, 96 28" 
                                                    stroke="url(#gradient-flow)" 
                                                    strokeWidth="2" 
                                                    strokeDasharray="4 4" 
                                                    className="animate-dash-shuttle" 
                                                />
                                                <path 
                                                    d="M0 48 H32 C 48 48, 48 68, 96 68" 
                                                    stroke="url(#gradient-flow)" 
                                                    strokeWidth="2" 
                                                    strokeDasharray="4 4" 
                                                    className="animate-dash-shuttle" 
                                                />
                                            </g>

                                            <defs>
                                                <linearGradient id="gradient-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="var(--primary)" />
                                                    <stop offset="100%" stopColor="#6366f1" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>

                                    {/* Destinations */}
                                    <div className="flex flex-col justify-center gap-6 z-20">
                                        <div className="flex items-center gap-2 p-1.5 px-2.5 rounded bg-white/5 border border-white/10 transition-colors group-hover:border-green-500/30 group-hover:bg-green-500/5">
                                            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-[10px] font-medium">Excel Export</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-1.5 px-2.5 rounded bg-white/5 border border-white/10 transition-colors group-hover:border-blue-500/30 group-hover:bg-blue-500/5">
                                            <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[10px] font-medium">CRM Sync</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
