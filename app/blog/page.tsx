"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Search, ArrowRight, Clock, Calendar, TrendingUp, Sparkles, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy Data
const CATEGORIES = ["All", "Strategy", "Growth", "Product", "Engineering"];

const FEATURED_POST = {
  slug: "sample",
  title: "Why the Best B2B Teams Are Ditching Cold Outbound for 'Intent Mining'",
  excerpt: "Cold email response rates have plummeted to 1%. Learn how top SaaS teams are pivoting to 'intent mining' on LinkedIn to generate warm leads with 10-15% reply rates.",
  category: "Strategy",
  author: "Sarah Jenkins",
  date: "Oct 24, 2025",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2400&q=80"
};

const POSTS = [
  {
    id: 1,
    slug: "sample",
    title: "How to Scrape LinkedIn Comments Legally (and Ethically)",
    excerpt: "The line between growth hacking and spam is thin. Here's how to stay on the right side of it while scaling your lead gen.",
    category: "Engineering",
    author: "Sarah Jenkins",
    date: "Oct 20, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    slug: "sample",
    title: "3 Tools to Automate Social Selling Without Getting Banned",
    excerpt: "We tested the top 10 LinkedIn automation tools. Here are the 3 that actually mimic human behavior.",
    category: "Tools",
    author: "Sarah Jenkins",
    date: "Oct 15, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    slug: "sample",
    title: "The 'Comment-First' Content Strategy",
    excerpt: "Why posting 5 times a week is failing you, and why engaging with big creators is the new SEO.",
    category: "Growth",
    author: "Sarah Jenkins",
    date: "Oct 12, 2025",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    slug: "sample",
    title: "Building a Lead Engine with $0 Budget",
    excerpt: "Bootstrapped? No problem. Here is the exact tech stack we used to get our first 100 demo requests for free.",
    category: "Growth",
    author: "Sarah Jenkins",
    date: "Oct 08, 2025",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5,
    slug: "sample",
    title: "From 0 to 10k LinkedIn Followers: The Playbook",
    excerpt: "A transparent look at the content calendar and engagement templates that drove our organic growth.",
    category: "Strategy",
    author: "Sarah Jenkins",
    date: "Oct 05, 2025",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6,
    slug: "sample",
    title: "Why We Built Guffles: The Manifesto",
    excerpt: "B2B sales is broken. We're on a mission to fix it by bringing human intent back to the forefront.",
    category: "Product",
    author: "Sarah Jenkins",
    date: "Oct 01, 2025",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
  }
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = POSTS.filter(post => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        
        {/* Header / Hero */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-16 md:mb-24">
           {/* Background Decoration */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

           <div className="text-center space-y-6 max-w-3xl mx-auto pt-8 md:pt-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary animate-fade-in-up">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  The Growth Hub
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  Insights for the modern <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-green-400">Revenue Team</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  Actionable playbooks, data-driven strategies, and engineering deep dives to help you scale your outbound engine.
              </p>

              {/* Newsletter Inline */}
              <div className="max-w-md mx-auto mt-8 flex gap-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search articles..." 
                        className="pl-9 bg-background/50 border-white/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
              </div>
           </div>
        </section>

        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
            
            {/* Featured Post (Only show if no search/filter active) */}
            {activeCategory === "All" && !searchQuery && (
                <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="group relative grid lg:grid-cols-2 gap-8 items-center bg-card rounded-3xl p-6 md:p-10 border border-border shadow-2xl overflow-hidden hover:border-primary/20 transition-all duration-300">
                        {/* Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="relative aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                             <Image 
                                src={FEATURED_POST.image} 
                                alt={FEATURED_POST.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                             />
                             <div className="absolute top-4 left-4">
                                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 border-none px-3 py-1 text-xs uppercase tracking-wider font-bold">
                                    Featured
                                </Badge>
                             </div>
                        </div>

                        <div className="space-y-6 relative">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="text-primary font-semibold">{FEATURED_POST.category}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{FEATURED_POST.date}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {FEATURED_POST.readTime}</span>
                            </div>
                            
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                <Link href={`/blog/${FEATURED_POST.slug}`}>
                                    {FEATURED_POST.title}
                                </Link>
                            </h2>
                            
                            <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3">
                                {FEATURED_POST.excerpt}
                            </p>

                            <div className="flex items-center gap-4 pt-4">
                                <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                                        <Image src="/images/ceo.jpeg" width={32} height={32} alt={FEATURED_POST.author} className="w-full h-full object-cover" />
                                     </div>
                                     <span className="text-sm font-medium">{FEATURED_POST.author}</span>
                                </div>
                                <Button variant="link" className="ml-auto p-0 h-auto text-primary font-semibold group-hover:translate-x-1 transition-transform">
                                    Read Article <ArrowRight className="ml-1 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Content Feed */}
            <section className="space-y-8">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
                         {CATEGORIES.map(cat => (
                             <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                    activeCategory === cat 
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                             >
                                {cat}
                             </button>
                         ))}
                    </div>
                    <div className="text-sm text-muted-foreground hidden sm:block">
                        Showing {filteredPosts.length} posts
                    </div>
                </div>

                {/* Grid */}
                {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col h-full">
                                <Card className="flex-1 bg-card border-border hover:border-primary/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-primary/5 group-hover:-translate-y-1">
                                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                        <Image 
                                            src={post.image} 
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-md text-xs font-bold text-foreground border border-white/10 shadow-sm">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <CardHeader className="space-y-2 p-6">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>{post.date}</span>
                                            <span className="text-border">•</span>
                                            <Clock className="w-3 h-3" />
                                            <span>{post.readTime}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 pt-0">
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="px-6 pb-6 pt-0 mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                                                <Image src="/images/ceo.jpeg" width={24} height={24} alt={post.author} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">{post.author}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-primary flex items-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            Read <ChevronRight className="w-3 h-3 ml-0.5" />
                                        </span>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Filter className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No posts found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
                        <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => {setActiveCategory("All"); setSearchQuery("");}}
                        >
                            Clear filters
                        </Button>
                    </div>
                )}
            </section>
        </div>

        {/* Newsletter Section */}
        <section className="mt-24 border-t border-border bg-card/50">
            <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-16 md:py-24">
                <div className="relative rounded-3xl bg-primary overflow-hidden px-6 py-12 md:px-16 md:py-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                     <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
                     
                     <div className="relative z-10 max-w-xl space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                            Join 10,000+ Growth Leaders
                        </h2>
                        <p className="text-primary-foreground/80 text-lg">
                            Get the latest playbooks, Intent Mining strategies, and engineering deep dives delivered to your inbox weekly.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-primary-foreground/70 font-medium">
                            <Sparkles className="w-4 h-4" /> No spam. Unsubscribe anytime.
                        </div>
                     </div>

                     <div className="relative z-10 w-full max-w-md bg-background/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Enter your work email" 
                                className="bg-background border-none h-12 rounded-xl" 
                            />
                            <Button size="lg" variant="secondary" className="h-12 px-6 rounded-xl font-bold shadow-lg">
                                Subscribe
                            </Button>
                        </div>
                     </div>
                </div>
            </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

