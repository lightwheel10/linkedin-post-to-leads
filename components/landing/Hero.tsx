"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Play, Sparkles, TrendingUp, Search, Mail, Building2, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";

type Lead = {
    id: string;
    name: string;
    role: string;
    company: string;
    matchScore: number;
    image: string;
    action: 'commented' | 'find_email' | 'view';
    comment?: string;
    email?: string;
    location?: string;
    matchColor: string;
    matchBg: string;
    isGrayscale?: boolean;
    opacity?: string;
};

type LeadTab = 'hot' | 'warm' | 'all';

const TAB_SEQUENCE: LeadTab[] = ['hot', 'warm', 'all'];
const TAB_ROTATION_DELAY = 6500; // milliseconds between automatic tab switches

const LEAD_DATA: Record<LeadTab, Lead[]> = {
    hot: [
        {
            id: '1',
            name: 'Sarah Johnson',
            role: 'VP of Sales',
            company: 'TechCorp',
            matchScore: 92,
            image: 'Sarah',
            action: 'commented',
            comment: '"This is exactly what we need for our team..."',
            email: 'sarah.j@techcorp.com',
            location: 'Mumbai, India',
            matchColor: 'text-emerald-500',
            matchBg: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            id: '2',
            name: 'Mike Chen',
            role: 'Founder',
            company: 'StartFlow',
            matchScore: 88,
            image: 'Mike',
            action: 'find_email',
            matchColor: 'text-emerald-500',
            matchBg: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            id: '3',
            name: 'Alex Ritz',
            role: 'Dev Lead',
            company: 'FinTech Co',
            matchScore: 74,
            image: 'Alex',
            action: 'view',
            matchColor: 'text-yellow-500',
            matchBg: 'bg-yellow-500/10 border-yellow-500/20',
            isGrayscale: true,
            opacity: 'opacity-70'
        }
    ],
    // 2. Improved Data for 'warm' and 'all' tabs to be less plain
    warm: [
        {
            id: '4',
            name: 'David Kim',
            role: 'Product Manager',
            company: 'InnovateInc',
            matchScore: 68,
            image: 'David',
            action: 'find_email', // Upgraded from 'view'
            matchColor: 'text-yellow-500',
            matchBg: 'bg-yellow-500/10 border-yellow-500/20'
        },
        {
            id: '5',
            name: 'Emily Davis',
            role: 'Marketing Lead',
            company: 'CreativeSol',
            matchScore: 65,
            image: 'Emily',
            action: 'view',
            matchColor: 'text-yellow-500',
            matchBg: 'bg-yellow-500/10 border-yellow-500/20'
        },
        {
            id: '6',
            name: 'Chris Wilson',
            role: 'Sales Director',
            company: 'GlobalTech',
            matchScore: 62,
            image: 'Chris',
            action: 'view',
            matchColor: 'text-yellow-500',
            matchBg: 'bg-yellow-500/10 border-yellow-500/20'
        }
    ],
    all: [
        {
            id: '7',
            name: 'Jessica Lee',
            role: 'HR Manager',
            company: 'PeopleFirst',
            matchScore: 45,
            image: 'Jessica',
            action: 'view',
            matchColor: 'text-muted-foreground',
            matchBg: 'bg-muted/10 border-muted/20'
        },
        {
            id: '8',
            name: 'Tom Brown',
            role: 'Consultant',
            company: 'BizSols',
            matchScore: 42,
            image: 'Tom',
            action: 'find_email', // Upgraded from 'view'
            matchColor: 'text-muted-foreground',
            matchBg: 'bg-muted/10 border-muted/20'
        },
        {
            id: '9',
            name: 'Lisa Wang',
            role: 'Analyst',
            company: 'DataCorp',
            matchScore: 38,
            image: 'Lisa',
            action: 'view',
            matchColor: 'text-muted-foreground',
            matchBg: 'bg-muted/10 border-muted/20'
        }
    ]
};

export function Hero() {
    const [activeTab, setActiveTab] = useState<LeadTab>('hot');
    const [animationCycle, setAnimationCycle] = useState(0);
    const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const visibleLeads = LEAD_DATA[activeTab];

    const rotateToNextTab = useCallback(() => {
        setActiveTab((current) => {
            const currentIndex = TAB_SEQUENCE.indexOf(current);
            const nextIndex = (currentIndex + 1) % TAB_SEQUENCE.length;
            return TAB_SEQUENCE[nextIndex];
        });
    }, []);

    const startAutoCycle = useCallback(() => {
        if (cycleTimerRef.current) {
            clearInterval(cycleTimerRef.current);
        }
        cycleTimerRef.current = setInterval(rotateToNextTab, TAB_ROTATION_DELAY);
    }, [rotateToNextTab]);

    useEffect(() => {
        startAutoCycle();
        return () => {
            if (cycleTimerRef.current) {
                clearInterval(cycleTimerRef.current);
            }
        };
    }, [startAutoCycle]);

    useEffect(() => {
        // Force-remount the list whenever the active tab changes so CSS can replay
        setAnimationCycle((prev) => prev + 1);
    }, [activeTab]);

    const handleTabChange = (tab: LeadTab) => {
        if (tab === activeTab) {
            // Restart animation even when clicking the same tab for a manual refresh
            setAnimationCycle((prev) => prev + 1);
        } else {
            setActiveTab(tab);
        }
        startAutoCycle();
    };

    return (
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-32 pb-8 md:pt-36 md:pb-10">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                {/* Grid with Fade Mask */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                {/* Subtle Top Glow */}
                <div className="absolute left-0 right-0 top-[-10%] h-[500px] w-full bg-primary/10 blur-[120px] opacity-30" />
            </div>

            <div className="container px-4 md:px-6 relative z-10 max-w-6xl mx-auto">
                {/* Two-Panel Layout */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* LEFT PANEL - Copy & CTA */}
                    <div className="flex flex-col space-y-4 text-left max-w-2xl mx-auto lg:mx-0">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary/80 w-fit animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                            <Sparkles className="w-3 h-3" />
                            <span>AI-Powered Lead Generation</span>
                        </div>

                        {/* Headline */}
                        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-foreground pl-1">
                                Turn Your LinkedIn Engagement Into <br className="hidden lg:block" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_auto] animate-shimmer">
                                    Qualified Leads
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg pl-1">
                                Stop losing warm leads hiding in your notifications. Get qualified profiles with emails, ready for outreach.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-start gap-2.5 pt-1 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                            <Button
                                size="default"
                                className="h-10 px-5 text-sm font-medium rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] w-full sm:w-auto"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="default"
                                className="h-10 px-5 text-sm font-medium rounded-full border-primary/20 bg-background/50 hover:bg-primary/5 backdrop-blur-sm transition-all hover:scale-[1.02] w-full sm:w-auto group"
                            >
                                <Link href="/demo">
                                    <Play className="mr-1.5 w-3.5 h-3.5 fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
                                    Watch Demo
                                </Link>
                            </Button>
                        </div>

                        {/* Social Proof Stats */}
                        <div className="flex flex-wrap items-center gap-4 pt-3 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-1.5">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 15}`}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <div className="flex text-yellow-500 text-[10px] gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => <span key={s}>★</span>)}
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground">Trusted by Founders & Sales Teams</p>
                                </div>
                            </div>

                            <div className="h-6 w-px bg-border/50 hidden sm:block" />

                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
                                <TrendingUp className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-medium text-primary/80">3x faster outreach</span>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground/80 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                            <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-primary" />
                                <span>14-day free trial</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL - Dashboard Mockup */}
                    <div className="relative mt-8 lg:mt-0 animate-float perspective-1000">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-emerald-500/20 to-primary/30 rounded-3xl blur-2xl opacity-30" />

                        <div className="relative rounded-xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden w-full transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-500 hover:rotate-y-0 hover:rotate-x-0 ring-1 ring-white/5">
                            {/* Mockup Header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[9px] font-medium text-primary">Processing Job #1024</span>
                                </div>
                            </div>

                            {/* Mockup Tabs */}
                            <div className="flex items-center gap-1 px-2 pt-2 border-b border-white/5 bg-white/[0.02]">
                                <div
                                    onClick={() => handleTabChange('hot')}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-medium cursor-pointer transition-colors border-b-2",
                                        activeTab === 'hot' ? "text-primary border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground border-transparent"
                                    )}
                                >
                                    Hot Leads ({LEAD_DATA.hot.length})
                                </div>
                                <div
                                    onClick={() => handleTabChange('warm')}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-medium cursor-pointer transition-colors border-b-2",
                                        activeTab === 'warm' ? "text-primary border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground border-transparent"
                                    )}
                                >
                                    Warm Leads ({LEAD_DATA.warm.length})
                                </div>
                                <div
                                    onClick={() => handleTabChange('all')}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-medium cursor-pointer transition-colors border-b-2",
                                        activeTab === 'all' ? "text-primary border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground border-transparent"
                                    )}
                                >
                                    All ({LEAD_DATA.all.length + 835})
                                </div>
                            </div>

                            {/* Mockup Content - Lead List */}
                            <div key={`${activeTab}-${animationCycle}`} className="p-3 space-y-2 bg-gradient-to-b from-transparent to-background/50 min-h-[220px]">
                                {visibleLeads.map((lead, index) => {
                                    const baseDelay = index * 300;
                                    const cardDelay = `${baseDelay}ms`;
                                    const discoveryDelay = `${baseDelay + 900}ms`;
                                    const statusDelay = `${baseDelay + 600}ms`;
                                    const matchBadgeClass = cn(
                                        "text-[9px] px-1 py-px rounded-full border font-medium",
                                        lead.matchBg,
                                        lead.matchColor
                                    );

                                    return (
                                        <div
                                            key={lead.id}
                                            // Each card replays the slide animation as the animationCycle key bumps per tab
                                            className={cn(
                                                "animate-lead-slide motion-reduce:animate-none transition-colors duration-300 group",
                                                lead.action === 'commented' ? "flex flex-col gap-2 p-2.5 rounded-lg bg-card/40 border border-white/5 hover:bg-card/60 hover:border-primary/20 shadow-sm" :
                                                    lead.action === 'find_email' ? "flex items-center justify-between p-2.5 rounded-lg bg-card/40 border border-white/5 hover:bg-card/60 hover:border-primary/20 shadow-sm" :
                                                        // Improved "View" card style
                                                        "flex items-center justify-between p-2.5 rounded-lg bg-card/30 border border-white/5 hover:bg-card/50 hover:border-primary/10 transition-colors"
                                            )}
                                            style={{ animationDelay: cardDelay, animationFillMode: 'both' }}
                                        >
                                            {/* Conditional Rendering based on Lead Type */}
                                            {lead.action === 'commented' ? (
                                                <>
                                                    <div className="flex items-start justify-between w-full">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn("w-8 h-8 rounded-full border border-white/10 overflow-hidden", lead.isGrayscale ? "bg-muted grayscale" : "bg-gradient-to-br from-blue-500/20 to-purple-500/20")}>
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.image}`} alt={lead.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[11px] font-semibold text-foreground">{lead.name}</span>
                                                                    <span className={matchBadgeClass}>{lead.matchScore}% Match</span>
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                                    <span>{lead.role}</span>
                                                                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                                                    <span>{lead.company}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 status-flare"
                                                            style={{ animationDelay: statusDelay }}
                                                        >
                                                            Commented
                                                        </div>
                                                    </div>
                                                    <div className="pl-[42px] space-y-1.5">
                                                        <div className="text-[10px] text-muted-foreground/80 italic border-l-2 border-white/10 pl-2">
                                                            {lead.comment}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="flex items-center gap-1 text-[9px] text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 found-pill"
                                                                style={{ animationDelay: discoveryDelay }}
                                                            >
                                                                <CheckCircle className="w-2.5 h-2.5" />
                                                                {lead.email}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                {lead.location}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn("w-8 h-8 rounded-full border border-white/10 overflow-hidden", lead.isGrayscale ? "bg-muted grayscale" : "bg-gradient-to-br from-orange-500/20 to-red-500/20")}>
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.image}`} alt={lead.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn("text-[11px] font-medium", lead.action === 'view' ? "text-muted-foreground" : "text-foreground font-semibold")}>{lead.name}</span>
                                                                <span className={matchBadgeClass}>{lead.matchScore}% Match</span>
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                                <span>{lead.role}</span>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                                                <span>{lead.company}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {lead.action === 'find_email' ? (
                                                        <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 border-primary/30 text-primary scan-button gap-1.5">
                                                            <Loader2 className="w-3 h-3 spinner-slow" />
                                                            <Search className="w-2.5 h-2.5 opacity-70" />
                                                            Finding Email
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-muted-foreground">
                                                            View
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
