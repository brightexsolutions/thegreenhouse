"use client";

import { Users, CheckCircle2 } from "lucide-react";

interface CheckinStatsBarProps {
  total:   number;
  present: number;
}

export function CheckinStatsBar({ total, present }: CheckinStatsBarProps) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-mist p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-500" />
          <span className="text-sm font-semibold text-charcoal">
            {present} present
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={13} className="text-charcoal/30" />
          <span className="text-xs text-charcoal/40">{total} registered</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-mist overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-charcoal/30 mt-1.5 text-right">{pct}% attendance</p>
    </div>
  );
}
