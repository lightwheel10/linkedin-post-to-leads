import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Centralized MDX component map so Markdown renders with our design system.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, ...props }) => (
      <h1
        className="text-4xl font-semibold tracking-tight leading-tight mb-6 text-foreground"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-3xl font-semibold tracking-tight leading-snug mt-10 mb-4 text-foreground"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-2xl font-semibold leading-snug mt-8 mb-3 text-foreground"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p
        className="text-base leading-relaxed text-muted-foreground mb-5"
        {...props}
      >
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc pl-6 space-y-2 text-muted-foreground mb-5"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal pl-6 space-y-2 text-muted-foreground mb-5"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),
    a: ({ className, ...props }) => (
      <Link
        className={cn(
          "text-primary font-medium underline underline-offset-4 hover:text-primary/80",
          className
        )}
        {...props}
      />
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-primary/60 bg-primary/5 text-foreground/90 px-4 py-3 rounded-r-lg mb-6"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }) => (
      <code
        className="font-mono text-sm bg-muted/70 px-1.5 py-0.5 rounded"
        {...props}
      >
        {children}
      </code>
    ),
    img: ({ alt, src, width, height, className, ...props }) => (
      <Image
        src={src || ""}
        alt={alt || ""}
        width={Number(width) || 1600}
        height={Number(height) || 900}
        className={cn(
          "rounded-xl border border-white/10 shadow-xl shadow-black/10 my-6",
          className
        )}
        {...props}
      />
    ),
    ...components,
  };
}

