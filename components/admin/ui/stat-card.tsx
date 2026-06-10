import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { MiniChart } from "./mini-chart";

type Accent = "green" | "gold" | "blue" | "red" | "purple";

const ACCENT: Record<Accent, { bg: string; icon: string; border: string; text: string }> = {
  green:  { bg: "bg-forest/8",   icon: "text-forest",      border: "border-l-forest",  text: "text-forest" },
  gold:   { bg: "bg-gold/10",    icon: "text-gold",        border: "border-l-gold",    text: "text-gold" },
  blue:   { bg: "bg-blue-50",    icon: "text-blue-600",    border: "border-l-blue-400",text: "text-blue-600" },
  red:    { bg: "bg-red-50",     icon: "text-red-500",     border: "border-l-red-400", text: "text-red-500" },
  purple: { bg: "bg-purple-50",  icon: "text-purple-500",  border: "border-l-purple-400", text: "text-purple-500" },
};

interface StatCardProps {
  label:      string;
  value:      string | number;
  sub?:       string;
  icon:       ReactNode;
  accent?:    Accent;
  sparkData?: number[];
  trend?:     number;
  className?: string;
}

export function StatCard({
  label, value, sub, icon, accent = "green", sparkData, trend, className,
}: StatCardProps) {
  const a = ACCENT[accent];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-mist border-l-[3px] p-5 flex flex-col gap-4",
        a.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", a.bg)}>
          <span className={a.icon}>{icon}</span>
        </div>
        {sparkData && sparkData.length > 1 && (
          <MiniChart data={sparkData} color={accent} className="mt-1" />
        )}
        {trend !== undefined && !sparkData && (
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          )}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-charcoal tabular-nums leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-charcoal/60 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-charcoal/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
