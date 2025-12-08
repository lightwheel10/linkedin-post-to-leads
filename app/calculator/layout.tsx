import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Lead Generation Cost Calculator | Guffles",
    description: "Free calculator to estimate your LinkedIn lead generation costs. See how many leads you can discover, what it will cost, and find the perfect plan for your needs.",
    keywords: [
        "lead generation calculator",
        "LinkedIn leads cost",
        "lead generation pricing",
        "cost per lead calculator",
        "LinkedIn marketing ROI",
        "B2B lead generation cost",
        "sales prospecting calculator",
        "lead discovery tool pricing"
    ],
    openGraph: {
        title: "Lead Generation Cost Calculator | Guffles",
        description: "Estimate how many LinkedIn leads you can discover and calculate your cost per lead. Our wallet-based pricing gives you complete flexibility.",
        type: "website",
        url: "https://guffles.com/calculator",
    },
    twitter: {
        card: "summary_large_image",
        title: "Lead Generation Cost Calculator | Guffles",
        description: "Estimate how many LinkedIn leads you can discover and calculate your cost per lead.",
    },
    alternates: {
        canonical: "https://guffles.com/calculator",
    },
};

export default function CalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

