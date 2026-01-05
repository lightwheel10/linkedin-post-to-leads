/**
 * 05 Jan 2026 - Dynamic Open Graph Image Generator
 * 
 * This file automatically generates the OG image shown when sharing links on:
 * - LinkedIn, Twitter/X, Facebook
 * - Slack, Discord, WhatsApp, iMessage
 * - Search engines
 * 
 * The image is generated at build time and cached.
 * Size: 1200x630px (standard OG image dimensions)
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

import { ImageResponse } from "next/og";

// Image metadata - standard OG image dimensions
export const alt = "Guffles - Intent-Based Lead Discovery Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          // Dark background matching the site theme
          background: "linear-gradient(135deg, #0a0a0a 0%, #0f172a 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo and brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
              color: "white",
              boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
            }}
          >
            G
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 600,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Guffles
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Turn Social Engagement
          </span>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #10b981, #34d399, #10b981)",
              backgroundClip: "text",
              color: "transparent",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Into Warm Leads
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "24px",
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
            marginTop: "24px",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          Find people actively engaging with content about problems you solve.
          Reach out while intent is fresh.
        </p>

        {/* CTA badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "40px",
            padding: "12px 24px",
            borderRadius: "9999px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#34d399",
            }}
          >
            🚀 Start Free Trial at guffles.com
          </span>
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

