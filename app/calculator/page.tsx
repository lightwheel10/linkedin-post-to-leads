"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { 
    Calculator, 
    Users, 
    Mail, 
    Sparkles,
    ArrowRight,
    Target,
    CheckCircle2,
    Gift,
    Zap,
    TrendingDown,
    Crown,
    FileText,
    Search,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// PRICING DATA - Based on actual wallet costs
// =============================================================================

const COSTS = {
    postAnalysis: 5,      // $5 per post analyzed
    aiSearch: 15,         // $15 per AI search (finds & analyzes 3 posts)
    profileMonitor: 3,    // $3 to add a profile to monitor
    monitoredPost: 4,     // $4 per monitored post analysis
    enrichment: 0.02,     // $0.02 per profile enrichment
    emailFind: 0.07,      // $0.07 per email
};

const LEADS_PER = {
    post: 500,            // Up to 500 leads per post (300 reactions + 200 comments)
    aiSearch: 1500,       // 3 posts × 500 = 1,500 leads
    monitoredPost: 400,   // 200 reactions + 200 comments per monitored post
};

const PLANS = [
    {
        name: "Pro",
        price: 79,
        credits: 150,
        description: "For individuals getting started",
    },
    {
        name: "Growth", 
        price: 179,
        credits: 300,
        description: "For growing sales teams",
        popular: true,
    },
    {
        name: "Scale",
        price: 279,
        credits: 500,
        description: "For agencies & high volume",
    },
];

export default function CalculatorPage() {
    // User inputs - the real activities
    const [postsToAnalyze, setPostsToAnalyze] = useState(10);
    const [aiSearches, setAiSearches] = useState(2);
    const [profilesToMonitor, setProfilesToMonitor] = useState(5);
    const [monitoredPosts, setMonitoredPosts] = useState(10);
    const [enrichmentsNeeded, setEnrichmentsNeeded] = useState(500);
    const [emailsNeeded, setEmailsNeeded] = useState(200);

    // Calculate everything
    const calculations = useMemo(() => {
        // Leads from different sources
        const leadsFromPosts = postsToAnalyze * LEADS_PER.post;
        const leadsFromAI = aiSearches * LEADS_PER.aiSearch;
        const leadsFromMonitoring = monitoredPosts * LEADS_PER.monitoredPost;
        const totalLeads = leadsFromPosts + leadsFromAI + leadsFromMonitoring;

        // Wallet cost
        const postCost = postsToAnalyze * COSTS.postAnalysis;
        const aiCost = aiSearches * COSTS.aiSearch;
        const monitorCost = profilesToMonitor * COSTS.profileMonitor;
        const monitoredPostCost = monitoredPosts * COSTS.monitoredPost;
        const enrichCost = enrichmentsNeeded * COSTS.enrichment;
        const emailCost = emailsNeeded * COSTS.emailFind;
        const totalCreditsNeeded = postCost + aiCost + monitorCost + monitoredPostCost + enrichCost + emailCost;

        // Find the right plan
        let recommendedPlan = PLANS[0];
        for (const plan of PLANS) {
            if (plan.credits >= totalCreditsNeeded) {
                recommendedPlan = plan;
                break;
            }
            recommendedPlan = plan;
        }

        // Extra credits needed beyond plan
        const extraCreditsNeeded = Math.max(0, totalCreditsNeeded - recommendedPlan.credits);
        const topUpCost = Math.ceil(extraCreditsNeeded / 1.5); // 1.5x multiplier on top-ups

        const totalMonthlyCost = recommendedPlan.price + topUpCost;
        const costPerLead = totalLeads > 0 ? totalMonthlyCost / totalLeads : 0;
        const costPerEnrichedLead = enrichmentsNeeded > 0 ? totalMonthlyCost / enrichmentsNeeded : 0;

        // Savings vs traditional ($0.50/lead industry average)
        const traditionalCost = totalLeads * 0.50;
        const savings = traditionalCost - totalMonthlyCost;
        const savingsPercent = traditionalCost > 0 ? Math.round((savings / traditionalCost) * 100) : 0;

        return {
            leadsFromPosts,
            leadsFromAI,
            leadsFromMonitoring,
            totalLeads,
            postCost,
            aiCost,
            monitorCost,
            monitoredPostCost,
            enrichCost,
            emailCost,
            totalCreditsNeeded,
            recommendedPlan,
            extraCreditsNeeded,
            topUpCost,
            totalMonthlyCost,
            costPerLead,
            costPerEnrichedLead,
            savings,
            savingsPercent,
            creditsUsagePercent: Math.min((totalCreditsNeeded / recommendedPlan.credits) * 100, 100),
        };
    }, [postsToAnalyze, aiSearches, profilesToMonitor, monitoredPosts, enrichmentsNeeded, emailsNeeded]);

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Background */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
                <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
            </div>

            <Navbar />

            <main className="pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                            <Calculator className="w-4 h-4" />
                            <span>Pricing Calculator</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                            Calculate Your <span className="text-gradient">Lead Generation</span> Costs
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We extract leads from LinkedIn post engagement. Tell us how many posts you want to analyze.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                        
                        {/* Input Section */}
                        <div className="lg:col-span-3 space-y-6">
                            
                            {/* How It Works - Brief */}
                            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-start gap-3">
                                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">How it works:</span> We extract reactions and comments from LinkedIn posts, then AI scores each person based on buying intent. You get a list of warm leads.
                                </p>
                            </div>

                            {/* Main Calculator Card */}
                            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8">
                                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Your Monthly Usage
                                </h2>

                                <div className="space-y-8">
                                    
                                    {/* Posts to Analyze */}
                                    <SliderInput
                                        icon={<FileText className="w-5 h-5" />}
                                        label="LinkedIn Posts to Analyze"
                                        description="Paste post URLs and we extract everyone who engaged"
                                        value={postsToAnalyze}
                                        onChange={setPostsToAnalyze}
                                        min={0}
                                        max={50}
                                        step={1}
                                        costPer={COSTS.postAnalysis}
                                        leadsPer={LEADS_PER.post}
                                        unit="posts"
                                        color="primary"
                                    />

                                    {/* AI Searches */}
                                    <SliderInput
                                        icon={<Search className="w-5 h-5" />}
                                        label="AI-Powered Searches"
                                        description="AI finds relevant posts in your niche and analyzes top 3"
                                        value={aiSearches}
                                        onChange={setAiSearches}
                                        min={0}
                                        max={15}
                                        step={1}
                                        costPer={COSTS.aiSearch}
                                        leadsPer={LEADS_PER.aiSearch}
                                        unit="searches"
                                        color="purple"
                                    />

                                    {/* Profile Monitoring */}
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-6">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Eye className="w-4 h-4" />
                                            Profile Monitoring
                                        </div>
                                        
                                        <SliderInput
                                            icon={<Users className="w-5 h-5" />}
                                            label="Profiles to Monitor"
                                            description="Track influencers & competitors for new posts"
                                            value={profilesToMonitor}
                                            onChange={setProfilesToMonitor}
                                            min={0}
                                            max={30}
                                            step={1}
                                            costPer={COSTS.profileMonitor}
                                            unit="profiles"
                                            color="cyan"
                                        />

                                        <SliderInput
                                            icon={<Zap className="w-5 h-5" />}
                                            label="Monitored Posts to Analyze"
                                            description="Analyze posts from your monitored profiles"
                                            value={monitoredPosts}
                                            onChange={setMonitoredPosts}
                                            min={0}
                                            max={50}
                                            step={1}
                                            costPer={COSTS.monitoredPost}
                                            leadsPer={LEADS_PER.monitoredPost}
                                            unit="posts"
                                            color="cyan"
                                        />
                                    </div>

                                    {/* Enrichments */}
                                    <SliderInput
                                        icon={<Sparkles className="w-5 h-5" />}
                                        label="Profile Enrichments"
                                        description="Get full profile data: job title, company, location, etc."
                                        value={enrichmentsNeeded}
                                        onChange={setEnrichmentsNeeded}
                                        min={0}
                                        max={5000}
                                        step={100}
                                        costPer={COSTS.enrichment}
                                        unit="profiles"
                                        color="amber"
                                    />

                                    {/* Email Finds */}
                                    <SliderInput
                                        icon={<Mail className="w-5 h-5" />}
                                        label="Email Discovery"
                                        description="Find verified business emails via Apollo.io"
                                        value={emailsNeeded}
                                        onChange={setEmailsNeeded}
                                        min={0}
                                        max={2000}
                                        step={50}
                                        costPer={COSTS.emailFind}
                                        unit="emails"
                                        color="emerald"
                                    />
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
                                <h3 className="font-semibold mb-4">Credit Usage Breakdown</h3>
                                <div className="space-y-3">
                                    <CostRow label="Post Analysis" value={calculations.postCost} detail={`${postsToAnalyze} × $${COSTS.postAnalysis}`} />
                                    <CostRow label="AI Searches" value={calculations.aiCost} detail={`${aiSearches} × $${COSTS.aiSearch}`} />
                                    <CostRow label="Profile Monitoring" value={calculations.monitorCost} detail={`${profilesToMonitor} × $${COSTS.profileMonitor}`} />
                                    <CostRow label="Monitored Posts" value={calculations.monitoredPostCost} detail={`${monitoredPosts} × $${COSTS.monitoredPost}`} />
                                    <CostRow label="Enrichments" value={calculations.enrichCost} detail={`${enrichmentsNeeded} × $${COSTS.enrichment}`} />
                                    <CostRow label="Email Finds" value={calculations.emailCost} detail={`${emailsNeeded} × $${COSTS.emailFind}`} />
                                    <div className="border-t border-border pt-3 flex justify-between font-semibold">
                                        <span>Total Credits Needed</span>
                                        <span className="text-primary">${calculations.totalCreditsNeeded.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 sticky top-24">
                                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-primary" />
                                    Your Results
                                </h2>

                                {/* Total Leads */}
                                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        <span className="text-sm text-muted-foreground">Total Leads Discoverable</span>
                                    </div>
                                    <p className="text-4xl font-bold text-primary">{calculations.totalLeads.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {calculations.leadsFromPosts.toLocaleString()} from posts + {calculations.leadsFromAI.toLocaleString()} from AI + {calculations.leadsFromMonitoring.toLocaleString()} from monitoring
                                    </p>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                        <p className="text-xs text-muted-foreground mb-1">Cost Per Lead</p>
                                        <p className="text-xl font-bold">${calculations.costPerLead.toFixed(3)}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                        <p className="text-xs text-muted-foreground mb-1">You Save</p>
                                        <p className="text-xl font-bold text-green-500">
                                            {calculations.savingsPercent > 0 ? `${calculations.savingsPercent}%` : "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Recommended Plan */}
                                <div className="border-t border-border pt-6 mb-6">
                                    <p className="text-sm text-muted-foreground mb-3">Recommended Plan</p>
                                    <div className={cn(
                                        "p-4 rounded-xl border-2 transition-all",
                                        calculations.recommendedPlan.popular 
                                            ? "border-primary bg-primary/5" 
                                            : "border-border bg-muted/30"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-lg">{calculations.recommendedPlan.name}</span>
                                            {calculations.recommendedPlan.popular && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-3xl font-bold">${calculations.recommendedPlan.price}</span>
                                            <span className="text-muted-foreground">/mo</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Includes ${calculations.recommendedPlan.credits} in credits
                                        </p>

                                        {/* Credits Usage Bar */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-muted-foreground">Credits Usage</span>
                                                <span className={cn(
                                                    "font-medium",
                                                    calculations.creditsUsagePercent > 100 ? "text-red-500" : "text-primary"
                                                )}>
                                                    ${calculations.totalCreditsNeeded.toFixed(0)} / ${calculations.recommendedPlan.credits}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        calculations.creditsUsagePercent > 100 
                                                            ? "bg-red-500" 
                                                            : "bg-gradient-to-r from-primary to-emerald-500"
                                                    )}
                                                    style={{ width: `${Math.min(calculations.creditsUsagePercent, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Top-up Notice */}
                                        {calculations.topUpCost > 0 && (
                                            <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                                    + ${calculations.topUpCost} top-up needed for extra credits
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Total Cost */}
                                <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Total Monthly Cost</span>
                                        <span className="text-2xl font-bold text-primary">
                                            ${calculations.totalMonthlyCost}
                                        </span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <Button asChild size="lg" className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    <Link href="/waitlist" className="flex items-center justify-center gap-2">
                                        Start 3-Day Free Trial
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-3">
                                    No charges for 3 days. Cancel anytime.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Plan Comparison */}
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-center mb-2">All Plans</h2>
                        <p className="text-center text-muted-foreground mb-8">Each plan includes credits you can use flexibly</p>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            {PLANS.map((plan) => {
                                const isRecommended = plan.name === calculations.recommendedPlan.name;
                                const maxPosts = Math.floor(plan.credits / COSTS.postAnalysis);
                                const maxSearches = Math.floor(plan.credits / COSTS.aiSearch);
                                const maxEmails = Math.floor(plan.credits / COSTS.emailFind);
                                
                                return (
                                    <div 
                                        key={plan.name}
                                        className={cn(
                                            "relative p-6 rounded-2xl border-2 transition-all",
                                            isRecommended 
                                                ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
                                                : "border-border bg-card/50"
                                        )}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                                MOST POPULAR
                                            </div>
                                        )}
                                        
                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-4xl font-bold">${plan.price}</span>
                                                <span className="text-muted-foreground">/mo</span>
                                            </div>
                                            <p className="text-sm text-primary font-medium mt-1">
                                                ${plan.credits} in credits
                                            </p>
                                        </div>

                                        <div className="space-y-2 mb-6 text-sm">
                                            <div className="flex justify-between p-2 rounded bg-muted/30">
                                                <span className="text-muted-foreground">Post analyses</span>
                                                <span className="font-medium">up to {maxPosts}</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-muted/30">
                                                <span className="text-muted-foreground">AI searches</span>
                                                <span className="font-medium">up to {maxSearches}</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded bg-muted/30">
                                                <span className="text-muted-foreground">Email finds</span>
                                                <span className="font-medium">up to {maxEmails.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-2 mb-6 text-sm">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span>AI lead scoring</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span>Profile enrichment</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span>CSV & JSON export</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span>Profile monitoring</span>
                                            </li>
                                        </ul>

                                        <Button 
                                            asChild 
                                            variant={isRecommended ? "default" : "outline"} 
                                            className={cn(
                                                "w-full rounded-full",
                                                isRecommended && "bg-primary hover:bg-primary/90"
                                            )}
                                        >
                                            <Link href="/waitlist">
                                                {isRecommended ? "Start Free Trial" : "Get Started"}
                                            </Link>
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mt-16 max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
                        <div className="space-y-4">
                            <FAQItem 
                                question="How do you get leads from LinkedIn posts?"
                                answer="When someone reacts to or comments on a LinkedIn post, we can extract their profile. We then use AI to score them based on their job title, company, and engagement type to identify who's most likely to be a buyer."
                            />
                            <FAQItem 
                                question="What's the difference between post analysis and AI search?"
                                answer="With post analysis, you paste a specific LinkedIn post URL. With AI search, you describe what you're looking for (e.g., 'posts about sales automation') and our AI finds the most relevant posts automatically, then analyzes the top 3."
                            />
                            <FAQItem 
                                question="What does profile enrichment include?"
                                answer="Enrichment adds detailed data to each lead: full job title, company name, company size, industry, location, and more. This helps you filter and prioritize your outreach."
                            />
                            <FAQItem 
                                question="Can I top up if I run out of credits?"
                                answer="Yes! You can add credits anytime at a 1.5x rate — pay $50, get $75 in credits. Credits never expire within your billing cycle."
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface SliderInputProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    costPer: number;
    leadsPer?: number;
    unit: string;
    color: "primary" | "purple" | "cyan" | "amber" | "emerald";
}

const colorClasses = {
    primary: {
        bg: "bg-primary/10",
        text: "text-primary",
        thumb: "bg-primary",
    },
    purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        thumb: "bg-purple-500",
    },
    cyan: {
        bg: "bg-cyan-500/10",
        text: "text-cyan-500",
        thumb: "bg-cyan-500",
    },
    amber: {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        thumb: "bg-amber-500",
    },
    emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        thumb: "bg-emerald-500",
    },
};

function SliderInput({ 
    icon, 
    label, 
    description, 
    value, 
    onChange, 
    min, 
    max, 
    step, 
    costPer,
    leadsPer,
    unit,
    color,
}: SliderInputProps) {
    const totalCost = value * costPer;
    const totalLeads = leadsPer ? value * leadsPer : 0;
    const colors = colorClasses[color];

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg shrink-0", colors.bg, colors.text)}>
                        {icon}
                    </div>
                    <div>
                        <label className="font-medium text-foreground">{label}</label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className={cn("text-2xl font-bold", colors.text)}>{value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{unit}</div>
                </div>
            </div>
            
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={cn(
                    "w-full h-2 bg-muted rounded-full appearance-none cursor-pointer",
                    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer",
                    "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer",
                    color === "primary" && "[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary",
                    color === "purple" && "[&::-webkit-slider-thumb]:bg-purple-500 [&::-moz-range-thumb]:bg-purple-500",
                    color === "cyan" && "[&::-webkit-slider-thumb]:bg-cyan-500 [&::-moz-range-thumb]:bg-cyan-500",
                    color === "amber" && "[&::-webkit-slider-thumb]:bg-amber-500 [&::-moz-range-thumb]:bg-amber-500",
                    color === "emerald" && "[&::-webkit-slider-thumb]:bg-emerald-500 [&::-moz-range-thumb]:bg-emerald-500",
                )}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>${costPer < 1 ? costPer.toFixed(2) : costPer} per {unit.slice(0, -1)}</span>
                <div className="flex gap-4">
                    {leadsPer && totalLeads > 0 && (
                        <span className={cn("font-medium", colors.text)}>≈ {totalLeads.toLocaleString()} leads</span>
                    )}
                    <span className="font-medium text-foreground">${totalCost.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}

function CostRow({ label, value, detail }: { label: string; value: number; detail: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <div>
                <span className="text-muted-foreground">{label}</span>
                <span className="text-xs text-muted-foreground/60 ml-2">({detail})</span>
            </div>
            <span className="font-medium">${value.toFixed(2)}</span>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="p-4 rounded-xl bg-card/50 border border-border">
            <h3 className="font-medium mb-2">{question}</h3>
            <p className="text-sm text-muted-foreground">{answer}</p>
        </div>
    );
}
