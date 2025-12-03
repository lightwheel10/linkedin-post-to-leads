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
                        Have questions about LinkMind? We're here to help. Reach out to us through any of the channels below.
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
                                href="mailto:support@linkmind.com"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                support@linkmind.com
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
            question: "How does LinkMind capture leads from my LinkedIn posts?",
            answer: "LinkMind automatically monitors your LinkedIn posts for engagement activity. When someone comments, likes, or reposts your content, our system captures their profile information in real-time. You simply connect your LinkedIn account once, and we handle the rest - no manual copy-pasting required."
        },
        {
            icon: Database,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-500/10",
            question: "What's included in the email enrichment feature?",
            answer: "Our enrichment service finds verified professional email addresses, phone numbers (when available), company information, and social profiles for your leads. All data is sourced from reputable databases and validated before being delivered to you, ensuring high accuracy rates."
        },
        {
            icon: Link2,
            iconColor: "text-indigo-500",
            iconBg: "bg-indigo-500/10",
            question: "Can I integrate LinkMind with my existing CRM?",
            answer: "Yes! LinkMind offers one-click integrations with popular CRMs including HubSpot, Salesforce, and more. Pro and Business plans also include API access for custom integrations. You can also export your leads to CSV/Excel format at any time."
        },
        {
            icon: CreditCard,
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-500/10",
            question: "How does the free trial work?",
            answer: "Our 14-day free trial gives you full access to Pro features with no credit card required. You'll get 50 lead credits to test our enrichment capabilities, and you can upgrade or downgrade at any time. After the trial, you can continue with our free Starter plan or choose a paid tier."
        },
        {
            icon: Shield,
            iconColor: "text-green-500",
            iconBg: "bg-green-500/10",
            question: "Is my LinkedIn account safe when using LinkMind?",
            answer: "Absolutely. We use secure, LinkedIn-compliant methods to access your data and never store your password. Our connection uses encrypted cookies and sessions, similar to how you'd stay logged in on your browser. We also follow LinkedIn's rate limits to ensure your account remains in good standing."
        },
        {
            icon: Target,
            iconColor: "text-orange-500",
            iconBg: "bg-orange-500/10",
            question: "What is the accuracy rate for email enrichment?",
            answer: "We maintain a 95%+ accuracy rate for email enrichment. All emails are verified before delivery, and we continuously update our databases. If an email bounces, you can report it and we'll investigate - most plans include replacement credits for invalid emails."
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
                <p className="text-muted-foreground">Everything you need to know about LinkMind</p>
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
