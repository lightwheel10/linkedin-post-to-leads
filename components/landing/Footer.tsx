import Link from "next/link";

/**
 * 05 Jan 2026 - Mobile Optimization:
 * - Reduced gap on mobile (gap-8 vs gap-12)
 * - Smaller padding on mobile (py-10 vs py-12)
 * - Reduced heading margins on mobile (mb-4 vs mb-6)
 * - Tighter link spacing on mobile (space-y-3 vs space-y-4)
 * - Smaller gap in bottom links on mobile (gap-6 vs gap-8)
 * - Centered text on mobile for brand section
 */
export function Footer() {
    return (
        <footer className="border-t border-primary/20 bg-card/30 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-10 md:py-16">
                {/* 05 Jan 2026: Reduced mobile gap from 12 to 8 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
                    {/* 05 Jan 2026: Center text on mobile for brand section */}
                    <div className="col-span-1 md:col-span-2 text-center md:text-left">
                        <div className="flex items-center gap-2 mb-4 md:mb-6 justify-center md:justify-start">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold">
                                G
                            </div>
                            <span className="text-xl font-bold">Guffles</span>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mx-auto md:mx-0">
                            Intent-based lead discovery platform. Find people actively engaging with content related to what you sell. Turn social signals into sales.
                        </p>
                    </div>

                    {/* 05 Jan 2026: Reduced mobile margins and spacing */}
                    <div className="text-center md:text-left">
                        <h4 className="font-semibold mb-4 md:mb-6 text-foreground">Product</h4>
                        <ul className="space-y-3 md:space-y-4 text-sm text-muted-foreground">
                            <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/calculator" className="hover:text-primary transition-colors">Cost Calculator</Link></li>
                            <li><Link href="/demo" className="hover:text-primary transition-colors">Demo</Link></li>
                        </ul>
                    </div>

                    <div className="text-center md:text-left">
                        <h4 className="font-semibold mb-4 md:mb-6 text-foreground">Company</h4>
                        <ul className="space-y-3 md:space-y-4 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                {/* 05 Jan 2026: Reduced mobile gap in bottom section */}
                <div className="border-t border-border pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Guffles Inc. All rights reserved.</p>
                    <div className="flex gap-6 md:gap-8">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
