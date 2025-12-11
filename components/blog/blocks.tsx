"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState, useEffect } from "react";
import { BadgeCheck, BarChart3, Sparkles, Share2, Clock, List, Zap, ArrowRight, FileText, LinkedinIcon, TwitterIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatProps = {
  label: string;
  value: string;
  sub: string;
};

export const Stat = ({ label, value, sub }: StatProps) => (
  <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card/50 px-5 py-4 shadow-sm hover:border-primary/20 transition-colors">
    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
      {label}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{sub}</div>
  </div>
);

type PillProps = { children: ReactNode };
export const Pill = ({ children }: PillProps) => (
  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
    {children}
  </span>
);

type CalloutProps = { title: string; children: ReactNode; icon?: ReactNode };
export const Callout = ({ title, children, icon }: CalloutProps) => (
  <div className="rounded-xl border-l-4 border-primary bg-primary/5 pl-6 pr-6 py-5 my-8">
    <div className="flex items-center gap-2 text-base font-bold text-foreground mb-2">
      {icon || <Sparkles className="w-5 h-5 text-primary" />}
      {title}
    </div>
    <div className="text-base text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

export const TLDR = ({ children }: { children: ReactNode }) => (
    <div className="rounded-2xl bg-secondary/30 border border-border p-6 mb-10">
        <div className="flex items-center gap-2 font-bold text-foreground mb-3">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>TL;DR</span>
        </div>
        <div className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {children}
        </div>
    </div>
);

type SectionTitleProps = { eyebrow?: string; title: string; children?: ReactNode };
export const SectionTitle = ({ eyebrow, title, children }: SectionTitleProps) => (
  <div className="space-y-3 mb-6 mt-12 scroll-mt-24">
    {eyebrow ? (
      <span className="text-xs uppercase tracking-widest text-primary font-bold">
        {eyebrow}
      </span>
    ) : null}
    <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
    {children ? (
      <p className="text-lg text-muted-foreground leading-relaxed">{children}</p>
    ) : null}
  </div>
);

export const Meta = () => (
  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
      Playbook
    </span>
    <span className="flex items-center gap-1.5">
      <Clock className="w-4 h-4" />
      8 min read
    </span>
    <span className="flex items-center gap-1.5">
      <BadgeCheck className="w-4 h-4 text-emerald-500" />
      Updated Jan 2025
    </span>
  </div>
);

export const ShareBar = () => (
  <div className="flex items-center gap-4 py-6 border-t border-border mt-8">
    <span className="text-sm font-semibold text-foreground">Share this article:</span>
    <div className="flex gap-2">
      {["LinkedIn", "X", "Email"].map((label) => (
        <Button
          key={label}
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-full bg-background hover:bg-secondary transition-colors"
        >
          {label}
        </Button>
      ))}
    </div>
  </div>
);

export const SidebarQuickWins = () => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
      <BarChart3 className="w-4 h-4 text-primary" />
      Quick Wins
    </div>
    <ul className="space-y-4">
      {[
          "Extract 100+ warm leads from a single viral post",
          "Get verified emails for 80%+ of engaged prospects",
          "Export to your CRM with one click"
      ].map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              {item}
          </li>
      ))}
    </ul>
  </div>
);

type TOCItem = {
  id: string;
  label: string;
};

type StickyTableOfContentsProps = {
  items: TOCItem[];
};

export const StickyTableOfContents = ({ items }: StickyTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -66% 0px",
        threshold: 0
      }
    );

    // Observe all sections
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = 96; // Account for fixed navbar
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth"
      });
      setActiveId(id);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 pl-3">
          On this page
        </div>
        <nav className="flex flex-col space-y-1 relative border-l border-border/50">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                "pl-3 py-1.5 text-sm transition-all block -ml-px border-l-2",
                activeId === item.id
                  ? "text-primary border-primary font-medium"
                  : "text-muted-foreground border-transparent hover:text-primary hover:border-primary/50"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Share Section */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-3">Share</div>
        <div className="flex flex-col gap-2 pl-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-500/10 hover:text-blue-500">
            <LinkedinIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-sky-500/10 hover:text-sky-500">
            <TwitterIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
            <LinkIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};


export const SidebarResource = () => (
  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-6">
    <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
      Free Calculator
    </div>
    <h3 className="text-lg font-bold text-foreground mb-2">
      See Your Cost Per Lead
    </h3>
    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
      Plug in how many posts you want to analyze and we'll show projected leads, wallet credits, and the best plan.
    </p>
    <Button asChild className="w-full font-semibold shadow-lg shadow-primary/20">
        <Link href="/calculator">Open Calculator</Link>
    </Button>
  </div>
);

export const SidebarMore = () => (
  <div className="space-y-4 pt-6 border-t border-border">
    <div className="text-sm font-bold text-foreground">More Resources</div>
    <div className="flex flex-col gap-3">
      {[
          { title: "Try the Free Calculator", href: "/calculator" },
          { title: "Join the Waitlist", href: "/waitlist" },
          { title: "Browse All Articles", href: "/blog" }
      ].map((item, i) => (
          <Link key={i} href={item.href} className="group flex gap-3 items-start">
             <div className="mt-1 w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-colors" />
             <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors leading-snug">
                 {item.title}
             </span>
          </Link>
      ))}
    </div>
  </div>
);

type BlogCTAProps = {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  subText?: string;
};

export const BlogCTA = ({
  title = "Stop Buying Cold Lists. Start Mining Intent.",
  description = "Try Guffles today and see who's actually looking for what you sell right now.",
  buttonText = "Get Started Free",
  buttonHref = "/waitlist",
  subText = "No credit card required • Cancel anytime"
}: BlogCTAProps) => (
  <div className="not-prose mt-16">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-emerald-500/10 to-card/50 border border-primary/30 p-8 md:p-12 text-center shiny-border">
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

      <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-lg">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 w-full sm:w-auto transition-all hover:scale-105">
            <Link href={buttonHref}>{buttonText} <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">{subText}</p>
      </div>
    </div>
  </div>
);

// ArticleImage - For in-article images with consistent styling
type ArticleImageProps = {
  src: string;
  alt: string;
  caption?: string;
};

export const ArticleImage = ({ src, alt, caption }: ArticleImageProps) => (
  <figure className="not-prose my-10">
    <div className="relative rounded-2xl overflow-hidden shadow-xl bg-muted aspect-[16/9]">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
    {caption && (
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">
        {caption}
      </figcaption>
    )}
  </figure>
);
