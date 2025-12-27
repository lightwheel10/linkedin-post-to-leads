"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
    Calculator,
    TrendingDown,
    ArrowRight,
    Sparkles,
    DollarSign,
    Users,
    Target,
    Zap,
    LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// LINKEDIN LEAD COST CALCULATOR
// =============================================================================
// Purpose: SEO-friendly ROI calculator showing potential savings vs competitors
//
// How it works:
// 1. User inputs their current lead volume and cost per lead
// 2. We calculate their current spend vs what they'd pay with Guffles
// 3. Show savings + comparison table against industry alternatives
//
// Pricing assumptions (update these when pricing changes):
// - Guffles Growth plan: $179/month (our recommended plan for comparison)
// - Effective cost per lead with Guffles: ~$0.15 (based on typical usage)
// =============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS - Update these when pricing or benchmarks change
// -----------------------------------------------------------------------------

const GUFFLES_MONTHLY_PRICE = 179; // Growth plan price
const GUFFLES_COST_PER_LEAD = 0.15; // Effective cost based on typical usage

/** Industry benchmark costs per lead (for comparison table) */
const COMPETITOR_COSTS = {
    linkedInAds: 5.26,      // Average LinkedIn Ads CPL
    leadDatabases: 0.50,    // ZoomInfo, Apollo, etc.
} as const;

/** Slider configuration for consistent ranges */
const SLIDER_CONFIG = {
    leads: { min: 100, max: 5000, step: 100, default: 500 },
    costPerLead: { min: 0.25, max: 10, step: 0.25, default: 2 },
} as const;

/** Features shown in "What you get" section */
const FEATURES = [
    {
        icon: Target,
        title: "Buyer Intent Leads",
        description: "People who liked or commented on posts about your topic. They're already interested.",
    },
    {
        icon: Users,
        title: "Full Profile Data",
        description: "Name, job title, company, location, and LinkedIn URL for every lead.",
    },
    {
        icon: Zap,
        title: "AI Lead Scoring",
        description: "Each lead gets a score from 1-100 based on how well they match your ideal customer.",
    },
    {
        icon: DollarSign,
        title: "Verified Emails",
        description: "Get verified email addresses for your best leads. Only pay for emails that work.",
    },
] as const;

// -----------------------------------------------------------------------------
// REUSABLE COMPONENTS
// -----------------------------------------------------------------------------

/** Styled range slider with label and value display */
function RangeSlider({
    label,
    value,
    onChange,
    min,
    max,
    step,
    formatValue,
    hint,
    accentColor = "primary",
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    formatValue: (v: number) => string;
    hint?: string;
    accentColor?: "primary" | "foreground";
}) {
    const thumbClass = accentColor === "primary"
        ? "[&::-webkit-slider-thumb]:bg-primary"
        : "[&::-webkit-slider-thumb]:bg-foreground";

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <label className="font-medium">{label}</label>
                <div className={cn(
                    "text-2xl font-bold",
                    accentColor === "primary" ? "text-primary" : "text-foreground"
                )}>
                    {formatValue(value)}
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
                    "w-full h-3 bg-muted rounded-full appearance-none cursor-pointer",
                    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6",
                    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer",
                    thumbClass
                )}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatValue(min)}</span>
                <span>{formatValue(max)}</span>
            </div>
            {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
        </div>
    );
}

/** Feature card with icon, title, and description */
function FeatureCard({ icon: Icon, title, description }: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-medium mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

/** Reusable stat card for displaying cost comparisons */
function StatCard({
    label,
    value,
    subtext,
    variant = "default",
}: {
    label: string;
    value: string;
    subtext: string;
    variant?: "default" | "highlight" | "muted";
}) {
    const styles = {
        default: "bg-muted/30 border-border",
        highlight: "bg-gradient-to-br from-primary/10 to-emerald-500/10 border-primary/20",
        muted: "bg-muted/30 border-border",
    };

    const valueStyles = {
        default: "text-foreground",
        highlight: "text-primary",
        muted: "text-muted-foreground line-through",
    };

    return (
        <div className={cn("p-5 rounded-xl border", styles[variant])}>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-3xl font-bold", valueStyles[variant])}>{value}</p>
            <p className="text-sm text-muted-foreground">{subtext}</p>
        </div>
    );
}

/** Call-to-action button linking to waitlist */
function CTAButton({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <Button
            asChild
            size="lg"
            className={cn(
                "rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20",
                className
            )}
        >
            <Link href="/waitlist" className="flex items-center justify-center gap-2">
                {children}
                <ArrowRight className="w-5 h-5" />
            </Link>
        </Button>
    );
}

// -----------------------------------------------------------------------------
// CALCULATION LOGIC
// -----------------------------------------------------------------------------

function useCalculations(leadsPerMonth: number, currentCostPerLead: number) {
    return useMemo(() => {
        // Current spend
        const currentMonthlySpend = leadsPerMonth * currentCostPerLead;
        const currentYearlySpend = currentMonthlySpend * 12;

        // Guffles effective cost (based on leads requested vs flat monthly price)
        const effectiveCostPerLead = leadsPerMonth > 0
            ? GUFFLES_MONTHLY_PRICE / leadsPerMonth
            : 0;

        // Savings calculation
        const monthlySavings = Math.max(0, currentMonthlySpend - GUFFLES_MONTHLY_PRICE);
        const yearlySavings = monthlySavings * 12;
        const savingsPercent = currentMonthlySpend > 0
            ? Math.round((monthlySavings / currentMonthlySpend) * 100)
            : 0;

        // Competitor costs for comparison table
        const linkedInAdsMonthly = leadsPerMonth * COMPETITOR_COSTS.linkedInAds;
        const databaseMonthly = leadsPerMonth * COMPETITOR_COSTS.leadDatabases;

        return {
            currentMonthlySpend,
            currentYearlySpend,
            effectiveCostPerLead,
            monthlySavings,
            yearlySavings,
            savingsPercent,
            linkedInAdsMonthly,
            databaseMonthly,
        };
    }, [leadsPerMonth, currentCostPerLead]);
}

// -----------------------------------------------------------------------------
// MAIN PAGE COMPONENT
// -----------------------------------------------------------------------------

export default function CalculatorPage() {
    const [leadsPerMonth, setLeadsPerMonth] = useState<number>(SLIDER_CONFIG.leads.default);
    const [currentCostPerLead, setCurrentCostPerLead] = useState<number>(SLIDER_CONFIG.costPerLead.default);

    const calc = useCalculations(leadsPerMonth, currentCostPerLead);

    // Comparison table data (keeps table DRY)
    const comparisonRows = [
        { name: "LinkedIn Ads", costPerLead: COMPETITOR_COSTS.linkedInAds, monthly: calc.linkedInAdsMonthly },
        { name: "Lead Databases (Apollo, ZoomInfo)", costPerLead: COMPETITOR_COSTS.leadDatabases, monthly: calc.databaseMonthly },
        { name: "Your Current Method", costPerLead: currentCostPerLead, monthly: calc.currentMonthlySpend },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
                <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
            </div>

            <Navbar />

            <main className="pt-24 pb-16">
                <div className="container px-4 md:px-6 max-w-4xl mx-auto">

                    {/* SEO-optimized header */}
                    <header className="text-center max-w-2xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-500 mb-4">
                            <Calculator className="w-4 h-4" />
                            <span>Free Calculator</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                            LinkedIn Lead Cost Calculator
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Find out how much you could save on LinkedIn lead generation.
                            Most teams overpay by 70%+ for the same quality leads.
                        </p>
                    </header>

                    {/* Main calculator card */}
                    <section className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-6">Your current situation</h2>

                        <RangeSlider
                            label="How many leads do you need per month?"
                            value={leadsPerMonth}
                            onChange={setLeadsPerMonth}
                            {...SLIDER_CONFIG.leads}
                            formatValue={(v) => v.toLocaleString()}
                            accentColor="primary"
                        />

                        <RangeSlider
                            label="What do you pay per lead right now?"
                            value={currentCostPerLead}
                            onChange={setCurrentCostPerLead}
                            {...SLIDER_CONFIG.costPerLead}
                            formatValue={(v) => `$${v.toFixed(2)}`}
                            hint="Include ad spend, tool subscriptions, and time spent. Most teams spend $2-5 per lead."
                            accentColor="foreground"
                        />

                        <div className="h-px bg-border my-8" />

                        {/* Results section */}
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Your potential savings
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            <StatCard
                                label="You currently spend"
                                value={`$${calc.currentMonthlySpend.toLocaleString()}`}
                                subtext="per month"
                                variant="muted"
                            />
                            <StatCard
                                label="With Guffles"
                                value={`$${GUFFLES_MONTHLY_PRICE}`}
                                subtext="per month (Growth plan)"
                                variant="highlight"
                            />
                        </div>

                        {/* Savings highlight (only show if there are savings) */}
                        {calc.monthlySavings > 0 && (
                            <div className="text-center p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <TrendingDown className="w-6 h-6 text-emerald-500" />
                                    <span className="text-sm font-medium text-emerald-500">You could save</span>
                                </div>
                                <p className="text-5xl font-bold text-emerald-500 mb-1">
                                    ${calc.yearlySavings.toLocaleString()}
                                </p>
                                <p className="text-muted-foreground">
                                    per year ({calc.savingsPercent}% less than you pay now)
                                </p>
                            </div>
                        )}

                        <CTAButton className="w-full h-14 text-lg">
                            Get These Savings
                        </CTAButton>
                        <p className="text-xs text-center text-muted-foreground mt-3">
                            Join the waitlist for early access pricing
                        </p>
                    </section>

                    {/* What you get section */}
                    <section className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-2">What you get with Guffles</h2>
                        <p className="text-muted-foreground mb-6">
                            We find people who are already interested in what you sell.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {FEATURES.map((feature) => (
                                <FeatureCard key={feature.title} {...feature} />
                            ))}
                        </div>
                    </section>

                    {/* Comparison table */}
                    <section className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-6">How we compare</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 pr-4 font-medium">Method</th>
                                        <th className="text-right py-3 px-4 font-medium">Cost per Lead</th>
                                        <th className="text-right py-3 pl-4 font-medium">Monthly Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr key={row.name} className="border-b border-border/50">
                                            <td className="py-3 pr-4">{row.name}</td>
                                            <td className="text-right py-3 px-4 text-muted-foreground">
                                                ~${row.costPerLead.toFixed(2)}
                                            </td>
                                            <td className="text-right py-3 pl-4 text-muted-foreground">
                                                ${row.monthly.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Guffles row highlighted */}
                                    <tr className="bg-primary/5">
                                        <td className="py-3 pr-4 font-semibold text-primary">Guffles</td>
                                        <td className="text-right py-3 px-4 font-semibold text-primary">
                                            ~${calc.effectiveCostPerLead.toFixed(2)}
                                        </td>
                                        <td className="text-right py-3 pl-4 font-semibold text-primary">
                                            ${GUFFLES_MONTHLY_PRICE}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4">
                            * Guffles leads have higher intent because they're actively engaging with relevant content,
                            not just names from a database.
                        </p>
                    </section>

                    {/* Final CTA */}
                    <section className="text-center max-w-xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4">Ready to stop overpaying for leads?</h2>
                        <p className="text-muted-foreground mb-6">
                            Join the waitlist and be first to access intent-based LinkedIn leads at a fraction of the cost.
                        </p>
                        <CTAButton className="h-12 px-8">
                            Join the Waitlist
                        </CTAButton>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
