import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/**
 * 05 Jan 2026 - Security Headers Configuration
 * 
 * These headers protect against common web vulnerabilities:
 * - X-Content-Type-Options: Prevents MIME type sniffing attacks
 * - X-Frame-Options: Protects against clickjacking by preventing iframe embedding
 * - X-XSS-Protection: Legacy XSS filter (still useful for older browsers)
 * - Referrer-Policy: Controls how much referrer info is sent with requests
 * - Permissions-Policy: Restricts browser features (camera, microphone, etc.)
 * 
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security
 */
const securityHeaders = [
  {
    // Prevent MIME type sniffing - browser won't try to guess content types
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Prevent clickjacking - page cannot be embedded in iframes
    // Use SAMEORIGIN if you need to embed your own pages in iframes
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Legacy XSS protection for older browsers
    // Modern browsers use CSP instead, but this doesn't hurt
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Control referrer information sent with requests
    // strict-origin-when-cross-origin: Send full URL for same-origin, only origin for cross-origin
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict browser features - disable camera, microphone, geolocation, etc.
    // Add features as needed (e.g., camera=self if you need webcam access)
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Allow MDX pages alongside TS/JS
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },

  // Enable compression
  compress: true,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@/components/ui"],
  },

  /**
   * 05 Jan 2026 - Security Headers
   * Apply security headers to all routes
   * @see Next.js docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withMDX(nextConfig);
