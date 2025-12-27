import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy | Guffles",
    description: "Privacy Policy for Guffles - How we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
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
                    <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
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
                        <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Guffles Inc. ("Guffles," "we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our intent-based lead discovery platform and related services (the "Service").
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            By using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with this policy, please do not use our Service.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">2. Information We Collect</h2>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.1 Information You Provide</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, password, and company information when you register</li>
                            <li><strong>Billing Information:</strong> Payment card details, billing address (processed securely by our payment processor, Stripe)</li>
                            <li><strong>Profile Information:</strong> Job title, industry, and preferences you provide</li>
                            <li><strong>Communications:</strong> Messages you send to us via email or support channels</li>
                            <li><strong>Waitlist Information:</strong> Email address when you join our waitlist</li>
                        </ul>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.2 Information Collected Automatically</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Usage Data:</strong> Features used, pages visited, actions taken within the Service</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                            <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                            <li><strong>Cookies and Similar Technologies:</strong> See Section 7 for details</li>
                        </ul>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.3 Information from Third Parties</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>LinkedIn Data:</strong> Publicly available profile information and engagement data from LinkedIn posts you analyze</li>
                            <li><strong>Authentication Providers:</strong> Information from Google or other OAuth providers if you choose to sign in with them</li>
                        </ul>
                    </section>

                    {/* How We Use Your Information */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                        <p className="text-muted-foreground mb-3">We use the information we collect for the following purposes:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Service Delivery:</strong> To provide, maintain, and improve our lead discovery platform</li>
                            <li><strong>Account Management:</strong> To create and manage your account, process payments</li>
                            <li><strong>Communication:</strong> To send service updates, security alerts, and support messages</li>
                            <li><strong>Analytics:</strong> To understand how users interact with our Service and improve it</li>
                            <li><strong>Security:</strong> To detect, prevent, and address fraud or security issues</li>
                            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                            <li><strong>Marketing:</strong> With your consent, to send promotional communications (you can opt out anytime)</li>
                        </ul>
                    </section>

                    {/* Legal Bases for Processing (GDPR) */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">4. Legal Bases for Processing (GDPR)</h2>
                        <p className="text-muted-foreground mb-3">If you are in the European Economic Area (EEA), UK, or Switzerland, we process your data based on:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Contract Performance:</strong> Processing necessary to provide services you requested</li>
                            <li><strong>Legitimate Interests:</strong> Processing for our business interests (improving services, security) that don't override your rights</li>
                            <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing emails)</li>
                            <li><strong>Legal Obligation:</strong> Processing required to comply with applicable laws</li>
                        </ul>
                    </section>

                    {/* Data Sharing */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">5. How We Share Your Information</h2>
                        <p className="text-muted-foreground mb-3">We do not sell your personal information. We may share data with:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Service Providers:</strong> Third parties that help us operate our Service (hosting, payment processing, analytics)</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
                        </ul>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Our Service Providers Include:</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Supabase:</strong> Database and authentication services</li>
                            <li><strong>Stripe:</strong> Payment processing</li>
                            <li><strong>Vercel:</strong> Website hosting</li>
                            <li><strong>OpenAI/Anthropic:</strong> AI-powered features</li>
                            <li><strong>Analytics providers:</strong> Usage analytics (PostHog, Google Analytics)</li>
                        </ul>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Retention</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We retain your personal data only as long as necessary for the purposes outlined in this policy:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion request</li>
                            <li><strong>Billing Records:</strong> Retained for 7 years as required for tax and legal purposes</li>
                            <li><strong>Usage Logs:</strong> Retained for 90 days</li>
                            <li><strong>Waitlist Data:</strong> Retained until you unsubscribe or we launch (whichever is first)</li>
                            <li><strong>Lead Analysis Data:</strong> Retained for 12 months or until you delete it</li>
                        </ul>
                    </section>

                    {/* Cookies */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">7. Cookies and Tracking Technologies</h2>
                        <p className="text-muted-foreground mb-3">We use cookies and similar technologies to:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how you use our Service</li>
                            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                        </ul>
                        <p className="text-muted-foreground mt-3">
                            You can control cookies through your browser settings. Disabling essential cookies may affect Service functionality.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">8. Your Privacy Rights</h2>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">8.1 Rights for All Users</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Delete your account and data</li>
                            <li>Opt out of marketing communications</li>
                        </ul>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">8.2 Additional Rights (GDPR - EEA/UK/Switzerland)</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Data portability (receive your data in a structured format)</li>
                            <li>Restrict processing</li>
                            <li>Object to processing based on legitimate interests</li>
                            <li>Withdraw consent at any time</li>
                            <li>Lodge a complaint with your local data protection authority</li>
                        </ul>

                        <h3 className="text-lg font-medium text-foreground mt-6 mb-3">8.3 California Privacy Rights (CCPA/CPRA)</h3>
                        <p className="text-muted-foreground mb-2">California residents have the right to:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Know what personal information we collect and how it's used</li>
                            <li>Delete personal information</li>
                            <li>Opt out of the sale of personal information (we do not sell your data)</li>
                            <li>Non-discrimination for exercising privacy rights</li>
                            <li>Correct inaccurate personal information</li>
                            <li>Limit use of sensitive personal information</li>
                        </ul>
                        <p className="text-muted-foreground mt-3">
                            To exercise these rights, contact us at privacy@guffles.com or use the account settings in your dashboard.
                        </p>
                    </section>

                    {/* Data Security */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">9. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement appropriate technical and organizational measures to protect your data, including:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                            <li>Regular security assessments</li>
                            <li>Access controls and authentication</li>
                            <li>Secure data centers (via our hosting providers)</li>
                        </ul>
                        <p className="text-muted-foreground mt-3">
                            While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    {/* International Transfers */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">10. International Data Transfers</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your data may be transferred to and processed in countries other than your own, including the United States. We ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the European Commission.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">11. Children's Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our Service is not intended for children under 16. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
                        </p>
                    </section>

                    {/* Changes to This Policy */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">12. Changes to This Privacy Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. For significant changes, we will provide additional notice (e.g., email notification).
                        </p>
                    </section>

                    {/* Contact Us */}
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-4">13. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions about this Privacy Policy or wish to exercise your privacy rights, contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/50">
                            <p className="text-foreground font-medium">Guffles Inc.</p>
                            <p className="text-muted-foreground">Email: privacy@guffles.com</p>
                            <p className="text-muted-foreground">For data protection inquiries: dpo@guffles.com</p>
                        </div>
                    </section>

                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 bg-card/30">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Guffles Inc. All rights reserved.</p>
                    <div className="flex justify-center gap-6 mt-2">
                        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
