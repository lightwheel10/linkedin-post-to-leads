"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingTier = {
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: string[];
    notIncluded?: string[];
    highlight?: boolean;
    ctaText: string;
    ctaVariant: "default" | "outline" | "secondary" | "ghost";
};

const PRICING_TIERS: PricingTier[] = [
    {
        name: "Starter",
        description: "Perfect for individuals just getting started with LinkedIn growth.",
        price: {
            monthly: 0,
            yearly: 0,
        },
        features: [
            "50 Lead Credits / month",
            "Basic Profile Enrichment",
            "Manual Export to CSV",
            "7-day Data Retention",
            "Community Support"
        ],
        notIncluded: [
            "CRM Integrations",
            "Advanced Filtering",
            "Priority Support",
            "Team Access"
        ],
        ctaText: "Start Free",
        ctaVariant: "outline",
    },
    {
        name: "Pro",
        description: "For serious creators and sales professionals scaling their outreach.",
        price: {
            monthly: 49,
            yearly: 39,
        },
        features: [
            "1,000 Lead Credits / month",
            "Full Email & Phone Enrichment",
            "One-click CRM Sync (HubSpot, Salesforce)",
            "30-day Data Retention",
            "Advanced Filtering & Scoring",
            "Priority Email Support",
            "Export to CSV/Excel"
        ],
        highlight: true,
        ctaText: "Get Started",
        ctaVariant: "default",
    },
    {
        name: "Business",
        description: "Power up your entire sales team with advanced automation.",
        price: {
            monthly: 149,
            yearly: 119,
        },
        features: [
            "5,000 Lead Credits / month",
            "Unlimited Enrichment",
            "All CRM Integrations + API Access",
            "Unlimited Data Retention",
            "Team Management & Roles",
            "Dedicated Account Manager",
            "Custom Onboarding"
        ],
        ctaText: "Contact Sales",
        ctaVariant: "outline",
    }
];

export function Pricing() {
    const [isYearly, setIsYearly] = useState(true);

    return (
        <section id="pricing" className="py-24 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-30" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <div className="container px-4 md:px-6 relative z-10 max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary/80 mb-4">
                        <Sparkles className="w-3 h-3" />
                        <span>Simple Pricing</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
                        Choose the plan that fits your <span className="text-gradient">growth</span>
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        Start for free, upgrade as you grow. No hidden fees.
                    </p>

                    {/* Toggle */}
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-12 h-6 rounded-full bg-muted border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                        >
                            <span 
                                className={cn(
                                    "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-primary shadow-sm transition-transform duration-200",
                                    isYearly ? "translate-x-6" : "translate-x-0"
                                )} 
                            />
                        </button>
                        <span className={cn("text-sm font-medium transition-colors flex items-center gap-1.5", isYearly ? "text-foreground" : "text-muted-foreground")}>
                            Yearly
                            <span className="inline-block px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] text-green-500 font-semibold">
                                Save 20%
                            </span>
                        </span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {PRICING_TIERS.map((tier) => (
                        <div 
                            key={tier.name}
                            className={cn(
                                "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
                                tier.highlight 
                                    ? "bg-background/60 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/5 ring-1 ring-primary/20 z-10 scale-105 md:-translate-y-4" 
                                    : "bg-background/40 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-background/50 shadow-lg"
                            )}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-[10px] font-bold text-white shadow-lg shadow-primary/20 border border-white/20">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1.5 min-h-[40px]">{tier.description}</p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-foreground">
                                        ${isYearly ? tier.price.yearly : tier.price.monthly}
                                    </span>
                                    <span className="text-muted-foreground text-sm">/month</span>
                                </div>
                                {isYearly && tier.price.monthly > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Billed ${tier.price.yearly * 12} yearly
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground/90">
                                        <div className="mt-0.5 p-0.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                                {tier.notIncluded?.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground/50">
                                        <div className="mt-0.5 p-0.5 rounded-full bg-muted border border-white/5 shrink-0">
                                            <X className="w-3 h-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                variant={tier.ctaVariant}
                                size="lg"
                                className={cn(
                                    "w-full rounded-full transition-all",
                                    tier.highlight ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30" : "",
                                    tier.ctaVariant === "outline" ? "border-primary/20 hover:bg-primary/5" : ""
                                )}
                            >
                                {tier.ctaText}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        Need a custom enterprise plan?{" "}
                        <a href="#" className="text-primary hover:underline font-medium">
                            Talk to sales
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}

