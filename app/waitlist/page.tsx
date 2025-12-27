"use client";

/**
 * WAITLIST PAGE
 *
 * Collects email addresses for waitlist signups before launch.
 * Connected to Supabase 'waitlist' table via /api/waitlist endpoint.
 *
 * TODO FOR FUTURE DEVELOPMENT:
 * =============================
 *
 * 1. SEND CONFIRMATION EMAIL (optional):
 *    - Use Resend to send welcome/confirmation email
 *    - Add to /api/waitlist after successful insert
 *
 * 2. ADD ANALYTICS:
 *    - Track waitlist signups in Google Analytics
 *    - Import trackEvent from lib/analytics
 *
 * 3. WHEN READY TO LAUNCH:
 *    - Redirect /waitlist to /signup
 *    - Update all "Join Waitlist" CTAs back to "Start Free Trial"
 *    - Send launch email to waitlist subscribers
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, Loader2, Sparkles, Users } from "lucide-react";

export default function WaitlistPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

    // Fetch waitlist count on mount
    useEffect(() => {
        fetch('/api/waitlist')
            .then(res => res.json())
            .then(data => setWaitlistCount(data.count))
            .catch(() => setWaitlistCount(null));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Something went wrong. Please try again.');
                setIsLoading(false);
                return;
            }

            setIsLoading(false);
            setIsSubmitted(true);

        } catch (err) {
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    // Display count: only show if we have actual data from API
    const displayCount = waitlistCount ?? 0;

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden">
            {/* Background Effects - matches landing page styling */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-30" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full opacity-30" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* Back to Home */}
            <Link
                href="/"
                className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to home
            </Link>

            <div className="w-full max-w-md mx-auto px-6">
                {!isSubmitted ? (
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            {/* Logo */}
                            <div className="flex justify-center mb-6">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20 ring-1 ring-white/10">
                                    G
                                </div>
                            </div>

                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                                <Sparkles className="w-3 h-3" />
                                <span>Coming Soon</span>
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight">
                                Join the Waitlist
                            </h1>

                            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                Be the first to know when Guffles launches. Get early access and exclusive pricing for waitlist members.
                            </p>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 bg-card/50 border-white/10 focus:border-primary/50 rounded-xl text-center"
                                    disabled={isLoading}
                                />
                                {error && (
                                    <p className="text-xs text-red-500 text-center">{error}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    "Join Waitlist"
                                )}
                            </Button>
                        </form>

                        {/* Social Proof - Only show when there are people waiting */}
                        {displayCount > 0 && (
                            <div className="flex items-center justify-center gap-3 pt-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden ring-1 ring-white/10"
                                        >
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{displayCount} {displayCount === 1 ? 'person' : 'people'} waiting</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Success State - shown after form submission */
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">You're on the list!</h2>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                We'll email you at <span className="text-foreground font-medium">{email}</span> when Guffles is ready.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Link href="/">
                                <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to home
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
