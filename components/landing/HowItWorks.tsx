"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
    Linkedin, 
    CheckCircle2, 
    Check,
    Loader2,
    MousePointer2,
    Zap,
    Download
} from "lucide-react";

// --- Improved Animation Components ---

// Separate beams to avoid cutting through cards
const ConnectingBeamLeft = () => (
    <div className="absolute top-1/2 left-[32%] w-[4%] h-0.5 bg-gradient-to-r from-primary/20 to-primary/20 -translate-y-1/2 hidden md:block -z-10">
        <div className="absolute inset-0 bg-primary/50 w-full h-full animate-pulse" />
    </div>
);

const ConnectingBeamRight = () => (
    <div className="absolute top-1/2 right-[32%] w-[4%] h-0.5 bg-gradient-to-r from-primary/20 to-primary/20 -translate-y-1/2 hidden md:block -z-10">
        <div className="absolute inset-0 bg-primary/50 w-full h-full animate-pulse" />
    </div>
);

export function HowItWorks() {
    // --- State Management ---
    const [activeStep, setActiveStep] = useState(0);
    const [step1Progress, setStep1Progress] = useState(0);
    const [step2Filter, setStep2Filter] = useState<'all' | 'founders'>('all');
    const [step3Leads, setStep3Leads] = useState<number[]>([]);

    // Auto-play sequence logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Step 2: Filter Simulation
    useEffect(() => {
        if (activeStep === 1) {
            // Start with 'all'
            setStep2Filter('all');
            
            // Switch to 'founders' after delay
            const timer1 = setTimeout(() => {
                setStep2Filter('founders');
            }, 800);

            // Revert to 'all' before leaving step
            const timer2 = setTimeout(() => {
                setStep2Filter('all');
            }, 4500);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        } else {
            // Reset when not active
            setStep2Filter('all');
        }
    }, [activeStep]);

    // Step 3: Lead Generation Simulation
    useEffect(() => {
        if (activeStep === 2) {
            setStep3Leads([]);
            const interval = setInterval(() => {
                setStep3Leads(prev => [...prev, prev.length + 1].slice(-4)); // Keep last 4
            }, 800);
            return () => clearInterval(interval);
        }
    }, [activeStep]);


    return (
        <section id="how-it-works" className="py-32 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 blur-[100px] rounded-full opacity-20 animate-pulse-scale" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full opacity-20 animate-float" />
            </div>

            <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6 animate-fade-in-up">
                        <Zap className="w-3 h-3" />
                        <span>Simple 3-Step Process</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
                        Turn engagement into <br className="hidden md:block" />
                        <span className="text-gradient">revenue on autopilot</span>
                    </h2>
                    <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                        Stop manually copy-pasting. Our system handles the heavy lifting while you focus on closing deals.
                    </p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Connecting Beams */}
                    <div className="absolute top-[45%] left-[31%] w-[5%] h-[2px] bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 hidden md:block opacity-50">
                        <div className="absolute inset-0 bg-primary/30 animate-pulse" />
                    </div>
                    <div className="absolute top-[45%] right-[31%] w-[5%] h-[2px] bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 hidden md:block opacity-50">
                         <div className="absolute inset-0 bg-primary/30 animate-pulse delay-75" />
                    </div>

                    {/* --- STEP 1: CONNECT --- */}
                    <div 
                        className={cn(
                            "group relative flex flex-col transition-all duration-500 ease-out",
                            activeStep === 0 ? "scale-105 z-20" : "scale-100 opacity-60 hover:opacity-100 hover:scale-[1.02]"
                        )}
                        onMouseEnter={() => setActiveStep(0)}
                    >
                        <div className="relative h-[340px] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex-1 flex items-center justify-center pt-0 pb-20"> 
                                <div className="relative w-64 h-48 transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                                    {/* Browser Window - Increased height to match neighbors */}
                                    <div className="absolute inset-0 bg-[#0f172a] rounded-[20px] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                                        {/* Browser Header */}
                                        <div className="h-6 bg-white/5 border-b border-white/5 flex items-center px-3 gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                        </div>
                                        
                                        {/* Browser Content */}
                                        <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
                                            <div className="relative mb-5">
                                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                                                <Linkedin className="w-14 h-14 text-[#0077b5] fill-current relative z-10" />
                                                
                                                <div className={cn(
                                                    "absolute -bottom-2 -right-2 z-20 transition-all duration-500 ease-spring",
                                                    step1Progress === 100 ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-45"
                                                )}>
                                                    <div className="bg-green-500 rounded-full p-1 border-[3px] border-[#0f172a] shadow-lg flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white stroke-[4]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
                                                <div 
                                                    className="h-full bg-blue-500 transition-all duration-100 ease-out"
                                                    style={{ width: `${step1Progress}%` }}
                                                />
                                            </div>
                                            <div className="mt-3 text-[10px] text-muted-foreground/80 font-mono tracking-tight">
                                                {step1Progress < 100 ? "Syncing cookies..." : "Session active"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
                                <h3 className="text-lg font-semibold mb-2 text-foreground">One-Click Sync</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Connect your LinkedIn account securely. We handle the cookies and sessions automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- STEP 2: FILTER --- */}
                    <div 
                        className={cn(
                            "group relative flex flex-col transition-all duration-500 ease-out",
                            activeStep === 1 ? "scale-105 z-20" : "scale-100 opacity-60 hover:opacity-100 hover:scale-[1.02]"
                        )}
                        onMouseEnter={() => setActiveStep(1)}
                    >
                        <div className="relative h-[340px] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex-1 flex items-center justify-center pt-0 pb-20">
                                <div className="relative w-64 bg-white/[0.03] border border-white/5 rounded-[20px] p-4 backdrop-blur-sm transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                                    <div className="flex p-1 bg-black/40 rounded-xl mb-4 border border-white/5">
                                        <button 
                                            onClick={() => setStep2Filter('all')}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all",
                                                step2Filter === 'all' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white/70"
                                            )}
                                        >
                                            All Leads
                                        </button>
                                        <button 
                                            onClick={() => setStep2Filter('founders')}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all",
                                                step2Filter === 'founders' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white/70"
                                            )}
                                        >
                                            Founders
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 relative">
                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const isFounder = [0, 2, 5, 7, 10].includes(i);
                                            const isVisible = step2Filter === 'all' || isFounder;
                                            
                                            return (
                                                <div 
                                                    key={i}
                                                    className={cn(
                                                        "w-9 h-9 rounded-full transition-all duration-500 flex items-center justify-center relative",
                                                        isVisible 
                                                            ? "opacity-100 scale-100 bg-white/5" 
                                                            : "opacity-20 scale-75 grayscale"
                                                    )}
                                                >
                                                     <img 
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 50}`} 
                                                        alt="Avatar" 
                                                        className="w-full h-full object-cover opacity-90"
                                                    />
                                                    
                                                    {isFounder && step2Filter === 'founders' && (
                                                        <>
                                                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20" />
                                                            <div className="absolute inset-0 rounded-full border border-emerald-500" />
                                                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2px] border-[#0A0A0A] flex items-center justify-center z-10 animate-in zoom-in duration-300">
                                                                <Check className="w-2 h-2 text-white stroke-[3]" />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        
                                        <div className={cn(
                                            "absolute transition-all duration-700 ease-in-out pointer-events-none z-30",
                                            step2Filter === 'founders' ? "top-2 right-8" : "top-2 left-8"
                                        )}>
                                            <MousePointer2 className="w-5 h-5 fill-primary text-white drop-shadow-xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
                                <h3 className="text-lg font-semibold mb-2 text-foreground">Smart Filtering</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Define your ICP. We automatically filter out noise and only capture high-intent leads.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- STEP 3: ENRICH --- */}
                    <div 
                         className={cn(
                            "group relative flex flex-col transition-all duration-500 ease-out",
                            activeStep === 2 ? "scale-105 z-20" : "scale-100 opacity-60 hover:opacity-100 hover:scale-[1.02]"
                        )}
                        onMouseEnter={() => setActiveStep(2)}
                    >
                        <div className="relative h-[340px] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex-1 flex flex-col justify-center items-center pt-0 pb-20">
                                <div className="relative w-64 bg-white/[0.03] border border-white/5 rounded-[20px] p-4 backdrop-blur-sm transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2 mb-1 font-mono tracking-wider">
                                            <span>LEAD</span>
                                            <span>STATUS</span>
                                        </div>

                                        {[1, 2, 3].map((id, index) => {
                                            const isActive = step3Leads.includes(id) || step3Leads.length > index;
                                            
                                            return (
                                                <div 
                                                    key={id}
                                                    className={cn(
                                                        "flex items-center justify-between p-2.5 rounded-xl border transition-all duration-500",
                                                        isActive 
                                                            ? "bg-white/[0.03] border-white/10 translate-x-0 opacity-100" 
                                                            : "bg-transparent border-transparent -translate-x-4 opacity-0"
                                                    )}
                                                    style={{ transitionDelay: `${index * 100}ms` }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                                                            {['JD', 'AS', 'MR'][index]}
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="h-1.5 w-16 bg-white/10 rounded-full" />
                                                            <div className="h-1 w-12 bg-white/5 rounded-full" />
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "px-2 py-1 rounded-full text-[9px] font-medium border flex items-center gap-1.5 transition-all duration-300 delay-300",
                                                        isActive 
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                                            : "bg-white/5 text-muted-foreground border-white/5"
                                                    )}>
                                                        {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                                        {isActive ? "Verified" : "Enriching"}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
                                <h3 className="text-lg font-semibold mb-2 text-foreground">Auto-Enrichment</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Get verified emails, company data, and social profiles instantly. Ready for your CRM.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
