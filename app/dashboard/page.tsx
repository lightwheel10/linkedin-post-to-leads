import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { getOrCreateUser, getUserStats, getAnalyses, getRemainingCredits } from "@/lib/data-store";
import {
  ArrowRight,
  Search,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

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

export default async function DashboardPage() {
  const userEmail = await getAuthenticatedUser();

  if (!userEmail) {
    redirect("/login");
  }

  const user = await getOrCreateUser(userEmail);
  const stats = await getUserStats(user.id);
  const recentAnalyses = await getAnalyses(user.id);
  const credits = await getRemainingCredits(user.id);

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back
            <span className="text-gradient ml-1.5">
              {userEmail.split("@")[0]}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's what's happening with your lead generation
          </p>
        </div>

        <Link href="/dashboard/analyze">
          <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20">
            <Search className="h-4 w-4" />
            Analyze New Post
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Start Card */}
          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-1.5">Quick Start Guide</h2>
                <p className="text-muted-foreground text-xs mb-3">
                  Turn any viral LinkedIn post into qualified leads in 3 simple steps
                </p>
                <ol className="space-y-2">
                  <li className="flex items-center gap-2 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      1
                    </span>
                    <span>Find a LinkedIn post with high engagement</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      2
                    </span>
                    <span>Paste the post URL in our analyzer</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      3
                    </span>
                    <span>Get qualified leads matching your ICP instantly</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg border border-border/50 bg-card/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Recent Analyses</h2>
              {recentAnalyses.length > 0 && (
                <Link href="/dashboard/history" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              )}
            </div>

            {recentAnalyses.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-xs mb-3">
                  No analyses yet. Start by analyzing your first post!
                </p>
                <Link href="/dashboard/analyze">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalyses.slice(0, 5).map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/dashboard/history/${analysis.id}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {analysis.post_data.author_image ? (
                        <img
                          src={analysis.post_data.author_image}
                          alt={analysis.post_data.author}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {analysis.post_data.author.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {analysis.post_data.author}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {analysis.qualified_leads_count} qualified leads • {new Date(analysis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Credits & Tips */}
        <div className="space-y-4">
          {/* Credits Card */}
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="rounded-md bg-primary/20 p-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Credits</p>
                <p className="text-xl font-bold">{credits}</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden mb-2">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min((credits / 50) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">
              Each post analysis uses 1 credit
            </p>
            <Link href="/#pricing">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                Get More Credits
              </Button>
            </Link>
          </div>

          {/* Pro Tips */}
          <div className="rounded-lg border border-border/50 bg-card/30 p-4">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-primary" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-primary">•</span>
                Target posts with 500+ reactions
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary">•</span>
                Industry content attracts relevant leads
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary">•</span>
                Customize ICP settings for better filtering
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary">•</span>
                Export leads to CSV for CRM import
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
