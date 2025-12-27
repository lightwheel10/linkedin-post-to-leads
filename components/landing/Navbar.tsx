"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackSignupCTAClick } from "@/lib/analytics";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsScrolled(currentScrollY > 20);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <header
                style={{
                    willChange: 'transform, opacity, width, padding, background-color, border-color',
                    transition: 'all 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
                className={cn(
                    "pointer-events-auto relative",
                    isScrolled
                        ? "mt-4 rounded-full border border-white/10 bg-background/60 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] w-[90%] md:w-[800px] py-2.5 px-4 supports-[backdrop-filter]:bg-background/60"
                        : "mt-0 w-full border-b border-transparent bg-transparent py-4 px-4 md:px-8"
                )}
            >
                {/* Inner Glow for Scrolled State */}
                {isScrolled && (
                    <div className="absolute inset-0 rounded-full pointer-events-none border border-white/5 shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]" />
                )}

                <div className="flex items-center justify-between relative z-10">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 ring-1 ring-white/10">
                            G
                        </div>
                        <span
                            style={{
                                transition: 'opacity 500ms cubic-bezier(0.4, 0.0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0.0, 0.2, 1)'
                            }}
                            className={cn(
                                "text-lg font-semibold tracking-tight text-foreground/90",
                                isScrolled ? "hidden md:block" : "block"
                            )}
                        >
                            Guffles
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-muted-foreground/80">
                        <Link href="/#features" className="hover:text-primary transition-colors hover:drop-shadow-sm">
                            Features
                        </Link>
                        <Link href="/#how-it-works" className="hover:text-primary transition-colors hover:drop-shadow-sm">
                            How it works
                        </Link>
                        <Link href="/#pricing" className="hover:text-primary transition-colors hover:drop-shadow-sm">
                            Pricing
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button
                            asChild
                            size="sm"
                            className={cn(
                                "h-8 px-4 text-[13px] font-medium rounded-full transition-all duration-300",
                                "bg-primary hover:bg-primary/90 text-primary-foreground",
                                "shadow-[0_1px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
                                "border border-white/10"
                            )}
                            onClick={() => trackSignupCTAClick('navbar', 'Join Waitlist')}
                        >
                            <Link href="/waitlist">Join Waitlist</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full mt-3 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <Link
                            href="/#features"
                            className="text-sm font-medium text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Features
                        </Link>
                        <Link
                            href="/#how-it-works"
                            className="text-sm font-medium text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            How it works
                        </Link>
                        <Link
                            href="/#pricing"
                            className="text-sm font-medium text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Pricing
                        </Link>
                        <div className="h-px bg-border/50 my-1" />
                        <Button
                            asChild
                            className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                            onClick={() => trackSignupCTAClick('navbar', 'Join Waitlist')}
                        >
                            <Link href="/waitlist">Join Waitlist</Link>
                        </Button>
                    </div>
                )}
            </header>
        </div>
    );
}
