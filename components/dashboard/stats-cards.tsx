"use client";

import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  Target,
  Calendar,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalAnalyses: number;
    totalLeads: number;
    qualifiedLeads: number;
    thisMonth: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Analyses",
      value: stats.totalAnalyses,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    },
    {
      label: "Qualified Leads",
      value: stats.qualifiedLeads,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      highlight: true
    },
    {
      label: "This Month",
      value: stats.thisMonth,
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className={cn(
              "relative group rounded-lg border p-4 transition-all duration-300 hover:shadow-md",
              card.borderColor,
              card.highlight
                ? "bg-gradient-to-br from-primary/5 to-primary/10"
                : "bg-card/50 hover:bg-card/80"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {card.highlight && (
              <div className="absolute -top-1.5 right-3 flex items-center gap-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[8px] font-semibold text-primary">
                <Sparkles className="h-2 w-2" />
                Key
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className={cn(
                "rounded-md p-2 transition-transform group-hover:scale-110",
                card.bgColor
              )}>
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>

              <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {card.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
