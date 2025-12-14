"use client";

import Link from "next/link";
import { Check, Sparkles, Wallet, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { trackSignupCTAClick, trackPricingView, trackContactSalesClick } from "@/lib/analytics";

type PricingPlan = {
    name: string;
    description: string;
    originalPrice: number;
    price: number;
    walletBase: number;
    walletBonus: number;
    limits: {
        reactionsPerPost: number;
        commentsPerPost: number;
        monitoredReactions: number;
        monitoredComments: number;
    };
    features: string[];
    highlight?: boolean;
    icon: any;
    badge?: string;
};

const PRICING_PLANS: PricingPlan[] = [
    {
        name: "Pro",
        description: "For solo founders and SDRs discovering intent-based leads",
        originalPrice: 99,
        price: 79,
        walletBase: 100,
        walletBonus: 50,
        limits: {
            reactionsPerPost: 300,
            commentsPerPost: 200,
            monitoredReactions: 200,
            monitoredComments: 200,
        },
        features: [
            "AI-powered post discovery",
            "Up to 300 reactions per post",
            "Up to 200 comments per post",
            "Profile monitoring",
            "Lead scoring & enrichment",
            "Email discovery (Apollo)",
            "Export to CSV/JSON",
            "Email support"
        ],
        icon: Sparkles,
    },
    {
        name: "Growth",
        description: "For sales teams capturing buying signals at scale",
        originalPrice: 229,
        price: 179,
        walletBase: 200,
        walletBonus: 100,
        limits: {
            reactionsPerPost: 600,
            commentsPerPost: 400,
            monitoredReactions: 400,
            monitoredComments: 400,
        },
        features: [
            "Everything in Pro, plus:",
            "Up to 600 reactions per post",
            "Up to 400 comments per post",
            "2x wallet credits ($300)",
            "Advanced filtering & sorting",
            "Bulk operations",
            "CRM integrations",
            "Priority support"
        ],
        highlight: true,
        icon: Rocket,
        badge: "MOST POPULAR"
    },
    {
        name: "Scale",
        description: "For agencies running intent-based campaigns for clients",
        originalPrice: 379,
        price: 279,
        walletBase: 300,
        walletBonus: 200,
        limits: {
            reactionsPerPost: 1000,
            commentsPerPost: 600,
            monitoredReactions: 600,
            monitoredComments: 600,
        },
        features: [
            "Everything in Growth, plus:",
            "Up to 1,000 reactions per post",
            "Up to 600 comments per post",
            "3.5x wallet credits ($600)",
            "Unlimited profile monitoring",
            "Team collaboration tools",
            "API access & webhooks",
            "Dedicated account manager"
        ],
        icon: Crown,
        badge: "BEST VALUE"
    }
];

export function Pricing() {
    const sectionRef = useRef<HTMLElement>(null);
    const hasTrackedView = useRef(false);

    // Track when pricing section comes into view (once per page load)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasTrackedView.current) {
                    trackPricingView();
                    hasTrackedView.current = true;
                }
            },
            { threshold: 0.3 } // Trigger when 30% of section is visible
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="pricing" className="py-24 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-30" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <div className="container px-4 md:px-6 relative z-10 max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary/80 mb-4">
                        <Wallet className="w-3 h-3" />
                        <span>Wallet-Based Pricing</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
                        Simple pricing, <span className="text-gradient">full control</span>
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed mb-3">
                        Wallet credits let you spend on what matters: AI Search, Post Analysis, or Profile Monitoring. Your choice.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="text-sm font-semibold text-green-600">🎉 7-Day Free Trial</span>
                        <span className="text-xs text-muted-foreground">• Cancel anytime</span>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
                    {PRICING_PLANS.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <div 
                                key={plan.name}
                                className={cn(
                                    "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
                                    plan.highlight 
                                        ? "bg-background/60 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/5 ring-1 ring-primary/20 z-10 scale-105 md:-translate-y-4" 
                                        : "bg-background/40 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-background/50 shadow-lg"
                                )}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-[10px] font-bold text-white shadow-lg shadow-primary/20 border border-white/20">
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Header */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            plan.highlight ? "bg-primary/10" : "bg-muted"
                                        )}>
                                            <Icon className={cn(
                                                "w-5 h-5",
                                                plan.highlight ? "text-primary" : "text-muted-foreground"
                                            )} />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                                </div>

                                {/* Pricing */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-4xl font-bold text-foreground">
                                            ${plan.price}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-lg text-muted-foreground/60 line-through leading-none">
                                                ${plan.originalPrice}
                                            </span>
                                            <span className="text-muted-foreground text-xs">/month</span>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet className="w-4 h-4 text-primary shrink-0" />
                                            <span className="text-xs font-medium text-muted-foreground">Wallet Credits</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-primary">${plan.walletBase + plan.walletBonus}</span>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="text-muted-foreground/70">${plan.walletBase}</span>
                                                <span className="text-muted-foreground/50">+</span>
                                                <span className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-500 font-semibold">
                                                    ${plan.walletBonus} bonus
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Limits */}
                                <div className="mb-6 p-3 rounded-lg bg-muted/30 border border-white/5">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Limits per action:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Reactions:</span>{" "}
                                            <span className="font-semibold text-foreground">{plan.limits.reactionsPerPost}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Comments:</span>{" "}
                                            <span className="font-semibold text-foreground">{plan.limits.commentsPerPost}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex-1 space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground/90">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div>
                                    <Button
                                        asChild
                                        variant={plan.highlight ? "default" : "outline"}
                                        size="lg"
                                        className={cn(
                                            "w-full rounded-full transition-all",
                                            plan.highlight ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30" : "",
                                            !plan.highlight ? "border-primary/20 hover:bg-primary/5" : ""
                                        )}
                                        onClick={() => trackSignupCTAClick('pricing', 'Start 7-Day Free Trial', plan.name.toLowerCase())}
                                    >
                                        <Link href="/signup">
                                            Start 7-Day Free Trial
                                        </Link>
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Cancel anytime
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Enterprise Option */}
                <div className="max-w-3xl mx-auto mb-8">
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/5 via-primary/5 to-transparent border border-primary/20">
                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-bold text-foreground mb-1">Need more? Looking for Enterprise?</h3>
                            <p className="text-sm text-muted-foreground">
                                Custom limits, dedicated support, and volume discounts available
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full border-primary/30 hover:bg-primary/10 shrink-0"
                            onClick={() => trackContactSalesClick()}
                        >
                            <Link href="/contact">
                                Contact Sales
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Trial Terms */}
                <div className="max-w-2xl mx-auto text-center">
                    <p className="text-sm text-muted-foreground">
                        Start your 7-day free trial with any plan.
                        Cancel anytime during the trial period and you won't be charged.
                        After the trial, you'll be automatically charged the monthly rate.
                    </p>
                </div>
            </div>
        </section>
    );
}

