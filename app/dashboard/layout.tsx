import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Providers } from "@/components/providers";
import { getOrCreateUser, getRemainingCredits, getCRMLeads } from "@/lib/data-store";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET || "dev-secret-do-not-use-in-prod"
    );
    const { payload } = await jwtVerify(token, secret);
    return payload.email as string;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify authentication
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

  const credits = await getRemainingCredits(user.id);
  const crmLeads = await getCRMLeads(user.id);

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        {/* Background gradient */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-background pointer-events-none">
          <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        </div>

        <Sidebar userEmail={userEmail} credits={credits} crmLeadsCount={crmLeads.length} />

        <div className="pl-44">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
