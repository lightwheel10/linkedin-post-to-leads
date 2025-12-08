import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#34d399",
};

export const metadata: Metadata = {
  title: "Guffles - Turn Social Engagement Into Warm Leads",
  description: "Intent-based lead discovery platform. Find people actively engaging with content related to what you sell. Turn social signals into warm leads with 10x better response rates.",
  keywords: ["intent-based leads", "LinkedIn lead generation", "buying signals", "social selling", "warm leads", "engagement leads", "B2B sales"],
  authors: [{ name: "Guffles" }],
  openGraph: {
    title: "Guffles - Intent-Based Lead Discovery",
    description: "Find buyers hiding in plain sight. Discover people engaging with content about problems you solve, then reach out while intent is fresh.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
