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
  title: "LinkMind - Turn LinkedIn Posts into High-Quality Leads",
  description: "AI-powered lead generation from LinkedIn. Automatically capture high-intent prospects and automate your outreach pipeline.",
  keywords: ["LinkedIn", "lead generation", "AI", "automation", "sales", "marketing"],
  authors: [{ name: "LinkMind" }],
  openGraph: {
    title: "LinkMind - AI-Powered LinkedIn Lead Generation",
    description: "Stop chasing leads manually. Let our AI analyze engagement and automate your outreach.",
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
