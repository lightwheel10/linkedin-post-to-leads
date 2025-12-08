import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-primary/20 bg-card/30 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold">
                                G
                            </div>
                            <span className="text-xl font-bold">Guffles</span>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                            Intent-based lead discovery platform. Find people actively engaging with content related to what you sell. Turn social signals into sales.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-6 text-foreground">Product</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/calculator" className="hover:text-primary transition-colors">Cost Calculator</Link></li>
                            <li><Link href="/demo" className="hover:text-primary transition-colors">Demo</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-6 text-foreground">Company</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Guffles Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
