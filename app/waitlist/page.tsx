"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WaitlistPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setErrorMessage("Please enter a valid email address");
            setStatus("error");
            return;
        }

        setStatus("loading");

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStatus("success");
        } catch {
            setStatus("error");
            setErrorMessage("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
                <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
            </div>

            <Navbar />

            <main className="container mx-auto px-4 py-24 md:py-32">
                <div className="max-w-md mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary/80 mb-6">
                        <Sparkles className="w-3 h-3" />
                        <span>Early Access</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Join the Waitlist
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Be first to turn social engagement into warm leads. Early access members get 50% off for life.
                    </p>

                    {/* Form Card */}
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-2xl blur opacity-50" />

                        <div className="relative bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                            {status === "success" ? (
                                <div className="py-4 space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto ring-1 ring-emerald-500/20">
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground mb-1">You're on the list!</h2>
                                        <p className="text-sm text-muted-foreground">
                                            We'll email you when Guffles is ready.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <Input
                                            type="email"
                                            placeholder="Enter your work email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (status === "error") setStatus("idle");
                                            }}
                                            className={cn(
                                                "h-11 bg-background/50 border-white/10 rounded-xl text-sm",
                                                status === "error" && "border-red-500/50"
                                            )}
                                        />
                                        {status === "error" && (
                                            <p className="text-xs text-red-400 text-left">{errorMessage}</p>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={status === "loading"}
                                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-sm font-medium shadow-lg shadow-primary/20"
                                        >
                                            {status === "loading" ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Joining...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>Get Early Access</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            )}
                                        </Button>
                                    </form>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            <span>No spam</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            <span>Unsubscribe anytime</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-emerald-500/20 overflow-hidden"
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 100}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">500+</span> on the waitlist
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
