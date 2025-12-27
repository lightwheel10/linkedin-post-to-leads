import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service | Guffles",
    description: "Terms of Service for Guffles - Rules and guidelines for using our platform.",
};

export default function TermsOfServicePage() {
    const lastUpdated = "December 27, 2025";
    const effectiveDate = "December 27, 2025";

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
                    <p className="text-muted-foreground mt-2">
                        Last updated: {lastUpdated} | Effective: {effectiveDate}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="prose prose-invert prose-sm max-w-none space-y-8">

                    {/* Introduction */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to Guffles. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Guffles Inc. ("Guffles," "we," "us," or "our") governing your access to and use of the Guffles platform, website, and services (collectively, the "Service").
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            By creating an account, joining our waitlist, or using any part of the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            <strong>If you are using the Service on behalf of an organization</strong>, you represent and warrant that you have authority to bind that organization to these Terms.
                        </p>
                    </section>

                    {/* Description of Service */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Guffles is an intent-based lead discovery platform that helps users identify potential business leads by analyzing public engagement on social media platforms, particularly LinkedIn. The Service includes features such as:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li>Analysis of public LinkedIn post engagements</li>
                            <li>AI-powered lead scoring and matching</li>
                            <li>Contact information discovery</li>
                            <li>CRM integrations and lead management</li>
                            <li>Profile monitoring and alerts</li>
                        </ul>
                    </section>

                    {/* Account Registration */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Registration</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To use certain features of the Service, you must create an account. You agree to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li>Provide accurate, current, and complete information</li>
                            <li>Maintain and update your information to keep it accurate</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Accept responsibility for all activities under your account</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. We reserve the right to suspend or terminate accounts that violate these Terms.
                        </p>
                    </section>

                    {/* Acceptable Use */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">4. Acceptable Use Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li>Violate any applicable laws, regulations, or third-party rights</li>
                            <li>Use the Service to send spam, unsolicited messages, or harass others</li>
                            <li>Scrape, crawl, or use automated means to access the Service beyond permitted API usage</li>
                            <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                            <li>Interfere with or disrupt the Service or servers</li>
                            <li>Reverse engineer, decompile, or attempt to extract source code</li>
                            <li>Use the Service to collect data for training AI models without permission</li>
                            <li>Resell, sublicense, or redistribute access to the Service</li>
                            <li>Violate LinkedIn's or any other platform's terms of service</li>
                            <li>Use data obtained through the Service for illegal discrimination</li>
                        </ul>
                    </section>

                    {/* Payment Terms */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">5. Payments and Billing</h2>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.1 Wallet Credits</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Guffles operates on a credit-based system. You purchase wallet credits which are consumed when using various features. Credit prices and consumption rates are displayed on our pricing page and may change with notice.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.2 Payment Processing</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Payments are processed by Stripe, Inc. By making a purchase, you agree to Stripe's terms of service. All fees are non-refundable except as expressly stated or required by law.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.3 Refund Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Unused wallet credits may be refunded within 14 days of purchase if no credits have been consumed. After credits are used, they are non-refundable. Contact support@guffles.com for refund requests.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.4 Taxes</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Prices do not include taxes. You are responsible for any applicable taxes based on your jurisdiction.
                        </p>
                    </section>

                    {/* Intellectual Property */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">6.1 Our Intellectual Property</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service, including all content, features, and functionality, is owned by Guffles and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express permission.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">6.2 Your Content</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You retain ownership of content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, process, and display that content solely to provide and improve the Service.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">6.3 Feedback</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If you provide feedback, suggestions, or ideas, you grant us the right to use them without restriction or compensation.
                        </p>
                    </section>

                    {/* Third-Party Services */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">7. Third-Party Services and Data</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service integrates with and retrieves data from third-party platforms, including LinkedIn. You acknowledge that:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li>We are not affiliated with LinkedIn or other platforms</li>
                            <li>Third-party terms of service may apply to your use of data</li>
                            <li>Data availability depends on third-party platform policies</li>
                            <li>We do not guarantee the accuracy of third-party data</li>
                            <li>You are responsible for your use of data in compliance with applicable laws</li>
                        </ul>
                    </section>

                    {/* Disclaimer of Warranties */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">8. Disclaimer of Warranties</h2>
                        <div className="p-4 bg-card/50 rounded-lg border border-border/50">
                            <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-3 uppercase text-sm">
                                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICE OR SERVERS ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-3 uppercase text-sm">
                                WE MAKE NO WARRANTIES REGARDING THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY LEAD DATA, CONTACT INFORMATION, OR AI-GENERATED INSIGHTS PROVIDED THROUGH THE SERVICE.
                            </p>
                        </div>
                    </section>

                    {/* Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
                        <div className="p-4 bg-card/50 rounded-lg border border-border/50">
                            <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUFFLES AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-3 uppercase text-sm">
                                IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE GREATER OF (A) THE AMOUNTS PAID BY YOU TO GUFFLES IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).
                            </p>
                            <p className="text-muted-foreground leading-relaxed mt-3 uppercase text-sm">
                                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR LIMITATION OF LIABILITY, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
                            </p>
                        </div>
                    </section>

                    {/* Indemnification */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">10. Indemnification</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree to indemnify, defend, and hold harmless Guffles and its officers, directors, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or relating to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li>Your use of the Service</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                            <li>Your use of data obtained through the Service</li>
                        </ul>
                    </section>

                    {/* Dispute Resolution */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">11. Dispute Resolution</h2>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">11.1 Informal Resolution</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Before filing any formal dispute, you agree to contact us at legal@guffles.com and attempt to resolve the dispute informally for at least 30 days.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">11.2 Binding Arbitration</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If informal resolution fails, any dispute shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. Arbitration will be conducted in English, and the arbitrator's decision shall be binding and enforceable in any court of competent jurisdiction.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">11.3 Class Action Waiver</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree that disputes will be resolved on an individual basis and not as part of any class, consolidated, or representative action.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">11.4 Opt-Out Right</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong>You may opt out of the arbitration and class action waiver provisions</strong> by sending written notice to legal@guffles.com within 30 days of first accepting these Terms. Your notice must include your name, email, and a clear statement that you wish to opt out.
                        </p>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">11.5 Exceptions</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Either party may seek injunctive relief in any court of competent jurisdiction for intellectual property infringement or other urgent matters.
                        </p>
                    </section>

                    {/* Termination */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">12. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You may terminate your account at any time through account settings or by contacting support. We may suspend or terminate your access at any time for any reason, including violation of these Terms, without prior notice.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Upon termination, your right to use the Service ceases immediately. Sections that by their nature should survive termination shall survive, including intellectual property provisions, disclaimers, limitations of liability, indemnification, and dispute resolution.
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">13. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. For significant changes, we will provide additional notice (e.g., email notification or in-app banner).
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Your continued use of the Service after changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Service.
                        </p>
                    </section>

                    {/* Governing Law */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">14. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    {/* General Provisions */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">15. General Provisions</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Guffles.</li>
                            <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                            <li><strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right.</li>
                            <li><strong>Assignment:</strong> You may not assign these Terms. We may assign our rights to any successor.</li>
                            <li><strong>Force Majeure:</strong> We are not liable for delays caused by circumstances beyond our reasonable control.</li>
                        </ul>
                    </section>

                    {/* Contact Us */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">16. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions about these Terms, contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/50">
                            <p className="text-foreground font-medium">Guffles Inc.</p>
                            <p className="text-muted-foreground">Email: legal@guffles.com</p>
                            <p className="text-muted-foreground">Support: support@guffles.com</p>
                        </div>
                    </section>

                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 bg-card/30">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Guffles Inc. All rights reserved.</p>
                    <div className="flex justify-center gap-6 mt-2">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
