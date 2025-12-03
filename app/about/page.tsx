"use client";

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowRight, Linkedin, Twitter, Sparkles, Target, Users, Globe, Zap, Shield, Heart, CheckCircle2, TrendingUp, Search, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

// --- Micro-Components for "Living" UI ---

const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={cn(
                "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/20",
                className
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
};

const SignalVisual = () => (
    <div className="relative h-24 w-full overflow-hidden rounded-xl bg-black/20 border border-white/5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="w-1.5 bg-emerald-500/50 rounded-full animate-pulse"
                    style={{
                        height: `${Math.random() * 60 + 20}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '1s'
                    }}
                />
            ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-medium text-emerald-500">Signal Detected</span>
        </div>
    </div>
);

const TrustVisual = () => (
    <div className="relative h-24 w-full overflow-hidden rounded-xl bg-black/20 border border-white/5 flex items-center justify-center group-hover:bg-black/30 transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />
        <Shield className="w-12 h-12 text-blue-500/20 absolute" />
        <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 backdrop-blur-md transform transition-all duration-300 group-hover:scale-110">
                <Fingerprint className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-200">Verified & Secure</span>
            </div>
            <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-black bg-white/10 backdrop-blur-sm flex items-center justify-center text-[8px] text-white/60">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Cinematic Background */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
            </div>

            <Navbar />

            <main className="container mx-auto px-4 py-24 md:py-32">
                {/* HERO SECTION - "The Manifesto" */}
                <section className="mb-24 relative">
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary/80 mb-10 animate-fade-in-up backdrop-blur-md hover:bg-primary/10 transition-colors cursor-default">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <span>Our Manifesto</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            Sales is <span className="text-foreground">human.</span> <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/20 font-medium tracking-tighter">
                                Everything else is noise.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up font-light" style={{ animationDelay: '200ms' }}>
                            We're not just building another lead gen tool. We're rebuilding the trust layer of the internet, one conversation at a time.
                        </p>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-40 mix-blend-screen" />
                </section>

                {/* VALUES BENTO GRID - Interactive & Alive */}
                <section className="mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-4xl mx-auto">

                        {/* Card 1: The Vision (Large) */}
                        <SpotlightCard className="md:col-span-8 md:row-span-2 min-h-[360px] group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop')] bg-cover bg-center opacity-20 transition-all duration-700 group-hover:scale-105 group-hover:opacity-30 grayscale group-hover:grayscale-0" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 backdrop-blur-md border border-primary/10 flex items-center justify-center mb-4 shadow-xl">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 tracking-tight">People Buy From People</h3>
                                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                                    In a world of AI-generated spam, authenticity is the ultimate competitive advantage. We build technology that amplifies your humanity, rather than replacing it.
                                </p>
                            </div>
                        </SpotlightCard>

                        {/* Card 2: Signal (Interactive) */}
                        <SpotlightCard className="md:col-span-4 min-h-[170px] p-5 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors -rotate-45 group-hover:rotate-0 duration-300" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-1">Signal over Noise</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">We filter out 99% of the internet to find the 1% that matters.</p>
                            </div>
                            <div className="mt-2">
                                <SignalVisual />
                            </div>
                        </SpotlightCard>

                        {/* Card 3: Trust (Interactive) */}
                        <SpotlightCard className="md:col-span-4 min-h-[170px] p-5 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors -rotate-45 group-hover:rotate-0 duration-300" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-1">Trust is Everything</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">Your reputation is your best asset. We help you protect it.</p>
                            </div>
                            <div className="mt-2">
                                <TrustVisual />
                            </div>
                        </SpotlightCard>

                    </div>
                </section>

                {/* FOUNDER SECTION - Cinematic Parallax */}
                <section className="mb-24">
                    <div className="max-w-5xl mx-auto">
                        <div className="relative rounded-[32px] overflow-hidden bg-card border border-border shadow-2xl">
                            <div className="grid md:grid-cols-2 gap-0">
                                {/* Image Side */}
                                <div className="relative h-[500px] md:h-auto group overflow-hidden">
                                    <Image
                                        src="/images/ceo.jpeg"
                                        alt="Sarah Jenkins"
                                        fill
                                        className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent mix-blend-multiply" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />

                                    {/* Floating Badge */}
                                    <div className="absolute bottom-6 left-6 backdrop-blur-xl bg-white/10 border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-gray-400 border border-white/20" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-medium text-white">Trusted by 10k+ leaders</span>
                                    </div>
                                </div>

                                {/* Content Side */}
                                <div className="p-10 md:p-16 flex flex-col justify-center relative">
                                    {/* Decorative Background Elements */}
                                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
                                        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="mb-6">
                                            <h2 className="text-xs font-bold tracking-widest text-primary uppercase mb-2">The Origin Story</h2>
                                            <div className="h-px w-10 bg-primary/50" />
                                        </div>

                                        <blockquote className="text-xl md:text-3xl font-medium leading-tight mb-6 text-foreground">
                                            "I built LinkMind because I was tired of missing opportunities that were staring me right in the face."
                                        </blockquote>

                                        <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                                            <p>
                                                After a decade in sales leadership, I realized the best leads weren't in a database—they were in the comments section.
                                            </p>
                                            <p>
                                                We're building the tool I wish I had 10 years ago. One that respects your time, values your relationships, and actually delivers results.
                                            </p>
                                        </div>

                                        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                                            <div>
                                                <div className="text-lg font-bold text-foreground">Sarah Jenkins</div>
                                                <div className="text-xs text-muted-foreground">Founder & CEO</div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Link href="#" className="group p-2.5 rounded-full bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/20 transition-all">
                                                    <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                </Link>
                                                <Link href="#" className="group p-2.5 rounded-full bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/20 transition-all">
                                                    <Twitter className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA SECTION - The Finale */}
                <section className="mb-16">
                    <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-b from-primary/5 to-transparent border border-primary/10 p-10 md:p-24 text-center group">
                        {/* Dynamic Background */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[2s] ease-in-out" />

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-foreground">
                                Ready to find your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary animate-shimmer bg-[length:200%_auto]">
                                    signal?
                                </span>
                            </h2>
                            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                                Join thousands of sales professionals who are turning engagement into revenue. Start your free trial today.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/">
                                    <button className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                                        Get Started Free
                                    </button>
                                </Link>
                                <Link href="/contact">
                                    <button className="h-14 px-8 rounded-full bg-background/50 border border-input text-foreground font-medium text-base hover:bg-accent hover:text-accent-foreground transition-all hover:scale-105 backdrop-blur-md">
                                        Talk to Sales
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
