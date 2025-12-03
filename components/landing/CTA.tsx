import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function CTA() {
    return (
        <section className="container mx-auto px-4 py-24">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-emerald-500/10 to-card/50 border border-primary/30 p-8 md:p-20 text-center shiny-border">
                {/* Noise Texture */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />

                {/* Decorative Blurs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/30 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                        Ready to supercharge your <br />
                        <span className="text-gradient">LinkedIn growth?</span>
                    </h2>

                    <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join thousands of professionals converting their audience into revenue today. Start your 14-day free trial.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 w-full sm:w-auto transition-all hover:scale-105">
                            <Link href="/signup">Get Started for Free</Link>
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/80 px-4 py-2 rounded-full border border-primary/20 shiny-border">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>No credit card required</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
