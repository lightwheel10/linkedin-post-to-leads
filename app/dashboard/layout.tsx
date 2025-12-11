/**
 * Dashboard Layout
 * 
 * MIGRATION NOTE: This file was UPDATED as part of the Supabase Auth migration.
 * 
 * CHANGES MADE:
 * - Removed duplicated getAuthenticatedUser() function that was defined locally
 * - Now imports getAuthenticatedUser from @/lib/auth (shared auth utility)
 * - Removed jose import (no longer needed)
 * - Removed direct cookie access (handled by lib/auth.ts now)
 * 
 * The layout still:
 * - Verifies authentication
 * - Redirects to login if not authenticated
 * - Redirects to onboarding if not completed
 * - Passes user data to Sidebar
 * 
 * @see SUPABASE_AUTH_MIGRATION.md for full migration documentation
 */

import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Providers } from "@/components/providers";
// MIGRATION: Now using shared auth utility instead of local implementation
import { getAuthenticatedUser } from "@/lib/auth";
import { getOrCreateUser, getCRMLeads, getUserBillingInfo } from "@/lib/data-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // MIGRATION: Using shared getAuthenticatedUser() which now uses Supabase Auth
  // Previously, this layout had its own JWT verification logic using jose
  const userEmail = await getAuthenticatedUser();

  if (!userEmail) {
    redirect("/login");
  }

  // Get or create user in our data store
  const user = await getOrCreateUser(userEmail);

  // Redirect to onboarding if not completed
  if (!user.onboarding_completed) {
    redirect("/onboarding");
  }

  const crmLeads = await getCRMLeads(user.id);
  const billingInfo = await getUserBillingInfo(user.id);

  // Prepare initial usage for sidebar
  const initialUsage = billingInfo ? {
    analysesUsed: billingInfo.analysesUsed,
    analysesLimit: billingInfo.analysesLimit,
    enrichmentsUsed: billingInfo.enrichmentsUsed,
    enrichmentsLimit: billingInfo.enrichmentsLimit,
    plan: billingInfo.plan,
    planName: billingInfo.planName,
    isTrialing: billingInfo.isTrialing,
    trialDaysRemaining: billingInfo.trialDaysRemaining,
  } : undefined;

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        </div>

        <Sidebar userEmail={userEmail} crmLeadsCount={crmLeads.length} initialUsage={initialUsage} />

        <div className="pl-44">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
