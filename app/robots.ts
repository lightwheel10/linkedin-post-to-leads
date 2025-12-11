import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/login",
        "/signup",
        "/onboarding",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: "https://guffles.com/sitemap.xml",
  };
}
