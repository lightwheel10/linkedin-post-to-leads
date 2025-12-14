import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const BASE_URL = "https://guffles.com";

// Static pages with their change frequency and priority
const STATIC_PAGES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1.0 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/calculator", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/demo", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/signup", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/login", changeFrequency: "monthly" as const, priority: 0.8 },
];

// Dynamically get blog post slugs by reading the app/blog directory
function getBlogSlugs(): string[] {
  const blogDir = path.join(process.cwd(), "app", "blog");

  try {
    const entries = fs.readdirSync(blogDir, { withFileTypes: true });

    return entries
      .filter((entry) => {
        // Must be a directory
        if (!entry.isDirectory()) return false;
        // Skip special Next.js folders
        if (entry.name.startsWith("_") || entry.name.startsWith(".")) return false;
        // Check if it has a page.mdx file
        const pagePath = path.join(blogDir, entry.name, "page.mdx");
        return fs.existsSync(pagePath);
      })
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticUrls = STATIC_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Blog posts (dynamic)
  const blogSlugs = getBlogSlugs();
  const blogUrls = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...blogUrls];
}
