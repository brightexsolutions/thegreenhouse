"use client";

import { useState, useCallback } from "react";
import { Search, CheckCircle2, Circle, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Registrant {
  id:         string;
  first_name: string;
  last_name:  string;
  email:      string | null;
  phone:      string | null;
  role:       string;
  checked_in: boolean;
}

interface CheckinListProps {
  registrants:  Registrant[];
  eventSlug:    string;
  checkinToken: string;
}

export function CheckinList({ registrants, eventSlug, checkinToken }: CheckinListProps) {
  const [items,     setItems]     = useState(registrants);
  const [query,     setQuery]     = useState("");
  const [filter,    setFilter]    = useState<"all" | "present" | "absent">("all");
  const [updating,  setUpdating]  = useState<Set<string>>(new Set());

  const filtered = items.filter((r) => {
    const matchName = `${r.first_name} ${r.last_name}`.toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "present" && r.checked_in) ||
      (filter === "absent" && !r.checked_in);
    return matchName && matchFilter;
  });

  const toggle = useCallback(async (id: string, current: boolean) => {
    setUpdating((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/checkin/${eventSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: id, checked_in: !current, token: checkinToken }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((r) => r.id === id ? { ...r, checked_in: !current } : r));
      }
    } finally {
      setUpdating((s) => { const next = new Set(s); next.delete(id); return next; });
    }
  }, [eventSlug, checkinToken]);

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-mist bg-white text-sm placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-white rounded-xl border border-mist p-1 flex-shrink-0">
          {(["all", "present", "absent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all capitalize",
                filter === f ? "bg-forest text-cream" : "text-charcoal/50 hover:text-charcoal"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-charcoal/30">No results</p>
        ) : (
          <div className="divide-y divide-mist">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-forest">
                    {r.first_name[0]}{r.last_name[0]}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal">
                    {r.first_name} {r.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.email && (
                      <span className="flex items-center gap-1 text-[9px] text-charcoal/30">
                        <Mail size={8} /> {r.email}
                      </span>
                    )}
                    {!r.email && r.phone && (
                      <span className="flex items-center gap-1 text-[9px] text-charcoal/30">
                        <Phone size={8} /> {r.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mark button */}
                <button
                  onClick={() => toggle(r.id, r.checked_in)}
                  disabled={updating.has(r.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0",
                    r.checked_in
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-charcoal/6 text-charcoal/50 hover:bg-forest/10 hover:text-forest",
                    updating.has(r.id) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {r.checked_in ? (
                    <><CheckCircle2 size={13} /> Present</>
                  ) : (
                    <><Circle size={13} /> Mark present</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-charcoal/30">
        {filtered.length} of {items.length} shown
      </p>
    </div>
  );
}
