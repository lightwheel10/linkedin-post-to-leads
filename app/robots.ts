/**
 * 05 Jan 2026 - Created robots.txt configuration
 * Allows all crawlers, points to sitemap
 */

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/onboarding/",
          "/checkout/",
        ],
      },
    ],
    sitemap: "https://guffles.com/sitemap.xml",
  };
}
