"use client";

import Link from "next/link";
import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Mail, MapPin, Phone, ChevronDown, Zap, Shield, Database, CreditCard, Link2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Background Gradients */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
                <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
            </div>

            <Navbar />

            <main className="container mx-auto px-4 py-24 md:py-32">
                {/* Header Section */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Have questions about Guffles? We're here to help. Reach out to us through any of the channels below.
                    </p>
                </div>

                {/* Contact Cards Grid */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {/* Email Card */}
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 hover:border-primary/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Email Us</h3>
                            <a
                                href="mailto:support@guffles.com"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                support@guffles.com
                            </a>
                        </div>
                    </div>

                    {/* Phone Card */}
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 hover:border-primary/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mb-4">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Call Us</h3>
                            <a
                                href="tel:+1234567890"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                +1 (234) 567-890
                            </a>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 hover:border-primary/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mb-4">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Visit Us</h3>
                            <p className="text-sm text-muted-foreground">
                                123 Innovation Street<br />
                                San Francisco, CA 94105
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <FAQSection />
            </main>

            <Footer />
        </div>
    );
}

// Modern FAQ Accordion Component
function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            icon: Zap,
            iconColor: "text-primary",
            iconBg: "bg-primary/10",
            question: "How does Guffles find leads with buying intent?",
            answer: "Guffles finds people actively engaging with content related to what you sell. You can use AI Search to describe your ideal customer in plain English, paste a viral post URL for Direct Post Analysis, or monitor influencer profiles to auto-track engagement. We extract everyone who liked or commented. These are people who showed interest in the topic."
        },
        {
            icon: Database,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-500/10",
            question: "What's included in the email enrichment feature?",
            answer: "Our enrichment service finds verified professional email addresses using Apollo integration. AI also scores each lead based on how well they match your target buyer profile. You get full profile data and verified business emails so you can reach out while the intent is fresh."
        },
        {
            icon: Link2,
            iconColor: "text-indigo-500",
            iconBg: "bg-indigo-500/10",
            question: "Can I integrate Guffles with my existing CRM?",
            answer: "Yes! Guffles offers integrations with popular CRMs including HubSpot, Salesforce, and more. Growth and Scale plans include API access for custom integrations. You can also export your leads to CSV/JSON format at any time."
        },
        {
            icon: CreditCard,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-500/10",
            question: "How does the wallet system work?",
            answer: "Instead of confusing plan limits, Guffles uses a simple wallet. You pay for credits and decide how to spend them: AI Search, Direct Post Analysis, Profile Monitoring, Enrichment, or Email Finding. Use it however you want. The wallet gives you full control."
        },
        {
            icon: Shield,
            iconColor: "text-green-500",
            iconBg: "bg-green-500/10",
            question: "Is my LinkedIn account safe when using Guffles?",
            answer: "Absolutely. We use secure, LinkedIn-compliant methods to access public engagement data. Your account credentials are never stored on our servers. We follow best practices and rate limits to ensure your account remains in good standing."
        },
        {
            icon: Target,
            iconColor: "text-orange-500",
            iconBg: "bg-orange-500/10",
            question: "What platforms does Guffles support?",
            answer: "Currently, Guffles works with LinkedIn. Twitter/X, Instagram, and Reddit are coming soon. Our goal is to help you find buying signals wherever your audience engages, across all social platforms."
        }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-medium text-primary/80 mb-4">
                    <span>FAQ</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                    Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">Everything you need to know about Guffles</p>
            </div>

            <div className="space-y-3">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    const Icon = faq.icon;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
                                isOpen
                                    ? "bg-card/60 border-primary/30 shadow-lg shadow-primary/5"
                                    : "bg-card/40 border-border hover:border-primary/20 hover:bg-card/50"
                            )}
                        >
                            {/* Gradient overlay on active */}
                            {isOpen && (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                            )}

                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className="relative w-full text-left p-6 flex items-center gap-4 cursor-pointer"
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                                    faq.iconBg,
                                    isOpen && "scale-110"
                                )}>
                                    <Icon className={cn("w-5 h-5", faq.iconColor)} />
                                </div>

                                {/* Question */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "text-base md:text-lg font-semibold transition-colors duration-200",
                                        isOpen ? "text-foreground" : "text-foreground/90"
                                    )}>
                                        {faq.question}
                                    </h3>
                                </div>

                                {/* Chevron */}
                                <ChevronDown className={cn(
                                    "w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0",
                                    isOpen && "rotate-180 text-primary"
                                )} />
                            </button>

                            {/* Answer - Collapsible */}
                            <div className={cn(
                                "overflow-hidden transition-all duration-300 ease-in-out",
                                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            )}>
                                <div className="px-6 pb-6 pl-[72px]">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
