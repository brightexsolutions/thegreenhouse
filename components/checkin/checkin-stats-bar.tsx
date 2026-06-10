"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Users, CheckCircle2 } from "lucide-react";

interface CheckinStatsBarProps {
  eventId:        string;
  initialTotal:   number;
  initialPresent: number;
}

export function CheckinStatsBar({ eventId, initialTotal, initialPresent }: CheckinStatsBarProps) {
  const [total,   setTotal]   = useState(initialTotal);
  const [present, setPresent] = useState(initialPresent);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    function fetchStats() {
      supabase
        .from("registrations")
        .select("checked_in")
        .eq("event_id", eventId)
        .is("deleted_at", null)
        .then(({ data }) => {
          if (!data) return;
          const rows = data as { checked_in: boolean }[];
          setTotal(rows.length);
          setPresent(rows.filter(r => r.checked_in).length);
        });
    }

    const channel = supabase
      .channel(`stats-bar-${eventId}`)
      .on("postgres_changes", {
        event:  "*",
        schema: "public",
        table:  "registrations",
        filter: `event_id=eq.${eventId}`,
      }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

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
