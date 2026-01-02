"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { 
    Linkedin, 
    Zap, 
    Users, 
    CheckCircle2,
    Sparkles,
    MessageSquare,
    Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- Custom UI Components for the Redesign ---

const BrandGlow = ({ className = "" }: { className?: string }) => (
    <div className={cn("absolute pointer-events-none -z-10", className)}>
        <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse-slow" />
    </div>
);

const MetricCard = ({ label, value, description }: { label: string, value: string, description: string }) => (
    <div className="flex flex-col p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <span className="text-primary font-mono text-xs font-bold uppercase tracking-wider mb-2">{label}</span>
        <span className="text-3xl font-bold text-foreground mb-1">{value}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
    </div>
);

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Background Layer */}
            <div className="fixed inset-0 z-[-1]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <Navbar />

            <main className="relative pt-32 pb-20">
                {/* 1. HERO SECTION - The Big Why */}
                <section className="container mx-auto px-4 mb-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-8 animate-fade-in-up">
                            <Sparkles className="w-3 h-3" />
                            <span>The Future of Lead Generation</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.05] animate-fade-in-up">
                            We help you find <br className="hidden md:block" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary animate-shimmer bg-[length:200%_auto]">
                                Buying Intent
                            </span>
                            <br className="hidden md:block" />
                            in plain sight.
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up delay-100">
                            Traditional lead gen is broken. Cold outreach is dying. We built Guffles to help you reach out while intent is fresh, not months later.
                        </p>
                    </div>
                </section>

                {/* 2. THE PROBLEM/SOLUTION SECTION - Comparison */}
                <section className="container mx-auto px-4 mb-40">
                    <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Why Guffles? Because <br />
                                <span className="text-primary">Warm Beats Cold.</span>
                            </h2>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Traditional Databases</h4>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Lists of random profiles based on job titles. You're the 50th person reaching out to them today. Response rates? 1-2%.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Guffles Intent Discovery</h4>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We find people actively engaging with content about the problems you solve. Reach out while they're thinking about it. Response rates? 10-15%.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <BrandGlow className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-50" />
                            <div className="grid grid-cols-2 gap-4">
                                <MetricCard label="Efficiency" value="7x" description="Higher response rates" />
                                <MetricCard label="Accuracy" value="100%" description="Verified social intent" />
                                <MetricCard label="Speed" value="< 5m" description="From signal to lead" />
                                <MetricCard label="Integration" value="Sync" description="Native CRM pushing" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. THE FOUNDER'S STORY - Premium & Integrated */}
                <section className="relative overflow-hidden mb-40">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="relative rounded-[40px] border border-white/10 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
                            <div className="grid lg:grid-cols-2 gap-0">
                                {/* Image Column */}
                                <div className="relative h-[400px] lg:h-auto min-h-[500px]">
                                    <Image
                                        src="/images/paras.jpeg"
                                        alt="Paras Tiwari"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
                                    
                                    {/* Name Overlay for Mobile */}
                                    <div className="absolute bottom-8 left-8 lg:hidden">
                                        <div className="text-2xl font-bold">Paras Tiwari</div>
                                        <div className="text-primary text-sm font-medium">CEO & Founder, Guffles</div>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="p-8 md:p-16 lg:p-20 flex flex-col justify-center">
                                    <div className="mb-10">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                            <Quote className="w-6 h-6 text-primary fill-current" />
                                        </div>
                                        
                                        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8">
                                            "I built Guffles to fix the biggest lie in sales: that volume solves everything."
                                        </h2>

                                        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                                            <p>
                                                With my background in operations at Amazon and American Express, I've seen first-hand how companies waste millions on cold outreach to people who have zero interest. Every day, thousands of valuable opportunities are lost because businesses don't know how to listen to the market.
                                            </p>
                                            <p>
                                                At Guffles, we believe listening is the new selling. By identifying buying signals in real-time, we help you reach out with relevance, not just persistence.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                                        <div className="hidden lg:block">
                                            <div className="text-xl font-bold text-foreground">Paras Tiwari</div>
                                            <div className="text-sm text-primary font-medium">CEO & Founder, Guffles</div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Link 
                                                href="https://www.linkedin.com/in/paras-tiwari-221a9b34b" 
                                                target="_blank"
                                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all group"
                                            >
                                                <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </Link>
                                            <Link 
                                                href="#" 
                                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all group"
                                            >
                                                <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. FINAL CTA - Updated 02 Jan 2026 to match Landing Page CTA style */}
                <section className="container mx-auto px-4 py-24">
                    <div className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-primary/20 via-emerald-500/10 to-card/50 border border-primary/30 p-8 md:p-20 text-center shiny-border">
                        {/* Noise Texture */}
                        <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                            }}
                        />

                        {/* Decorative Blurs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/30 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                                Ready to turn signals <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-400 to-primary animate-shimmer bg-[length:200%_auto]">into revenue?</span>
                            </h2>

                            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                                Stop cold outreach. Start warm conversations with people actively engaging with content about problems you solve.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 w-full sm:w-auto transition-all hover:scale-105 rounded-full font-bold"
                                >
                                    <Link href="/signup">Start Free Trial</Link>
                                </Button>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/80 px-4 py-2 rounded-full border border-primary/20 shiny-border">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>7-day free trial</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
