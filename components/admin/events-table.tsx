"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Search, Calendar, Users, Edit2, ExternalLink, Music2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { EventStatus } from "@/types/database";

interface EventRow {
  id:            string;
  slug:          string;
  title:         string;
  event_date:    string;
  status:        EventStatus;
  cover_image:   string | null;
  registrations: number;
}

const STATUS_FILTERS: Array<{ key: EventStatus | "all"; label: string }> = [
  { key: "all",       label: "All" },
  { key: "published", label: "Published" },
  { key: "live",      label: "Live" },
  { key: "past",      label: "Past" },
  { key: "draft",     label: "Draft" },
  { key: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 15;

export function EventsTable({ events: initialEvents }: { events: EventRow[] }) {
  const router     = useRouter();
  const [query,    setQuery]    = useState("");
  const [status,   setStatus]   = useState<EventStatus | "all">("all");
  const [page,     setPage]     = useState(1);
  const [events,   setEvents]   = useState(initialEvents);
  const [spinning, setSpinning] = useState(false);
  const supabaseRef = useRef(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-events-registrations")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "registrations",
      }, (payload) => {
        const newReg = payload.new as { event_id: string };
        setEvents(prev =>
          prev.map(e => e.id === newReg.event_id ? { ...e, registrations: e.registrations + 1 } : e)
        );
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "events",
      }, (payload) => {
        const updated = payload.new as EventRow;
        setEvents(prev => prev.map(e => e.id === updated.id ? { ...e, status: updated.status } : e));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchQ = !query || `${e.title} ${e.slug}`.toLowerCase().includes(query.toLowerCase());
      const matchS = status === "all" || e.status === status;
      return matchQ && matchS;
    });
  }, [events, query, status]);

  const pages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeStatus(s: EventStatus | "all") { setStatus(s); setPage(1); }
  function changeQuery(q: string) { setQuery(q); setPage(1); }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={e => changeQuery(e.target.value)}
            placeholder="Search events…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-mist bg-white text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-mist p-1 flex-shrink-0 flex-wrap">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => changeStatus(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                status === key
                  ? "bg-forest text-cream shadow-sm"
                  : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={refresh}
          title="Refresh"
          className="flex-shrink-0 p-2 rounded-xl border border-mist bg-white text-charcoal/40 hover:text-forest hover:border-forest/30 transition-all"
        >
          <RefreshCw size={14} className={cn("transition-transform", spinning && "animate-spin")} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-charcoal/5 flex items-center justify-center mb-3">
              <Calendar size={20} className="text-charcoal/25" />
            </div>
            <p className="text-sm font-medium text-charcoal/40">No events found</p>
            <p className="text-xs text-charcoal/25 mt-1">
              {query || status !== "all" ? "Try adjusting your filters" : "Create your first event to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-[560px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-mist">
                    <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-5 py-3">Event</th>
                    <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3">Status</th>
                    <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3 hidden md:table-cell">Registrations</th>
                    <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {slice.map((e) => (
                    <tr key={e.id} className="hover:bg-off-white transition-colors group">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-charcoal group-hover:text-forest transition-colors line-clamp-1">{e.title}</p>
                        <p className="text-[10px] text-charcoal/35 mt-0.5">/events/{e.slug}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-xs text-charcoal/70">
                          {new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-[10px] text-charcoal/35 mt-0.5">
                          {new Date(e.event_date).toLocaleDateString("en-KE", { weekday: "long" })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs text-charcoal/60">
                          <Users size={11} className="text-charcoal/35" />
                          {e.registrations}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/events/${e.id}/sessions`}
                            className="p-1.5 rounded-lg text-charcoal/35 hover:text-forest hover:bg-forest/8 transition-all"
                            title="Program & lyrics"
                          >
                            <Music2 size={14} />
                          </Link>
                          <Link
                            href={`/admin/events/${e.id}/registrants`}
                            className="p-1.5 rounded-lg text-charcoal/35 hover:text-forest hover:bg-forest/8 transition-all"
                            title="Registrants"
                          >
                            <Users size={14} />
                          </Link>
                          <Link
                            href={`/events/${e.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-charcoal/35 hover:text-charcoal hover:bg-charcoal/8 transition-all"
                            title="View public page"
                          >
                            <ExternalLink size={13} />
                          </Link>
                          <Link
                            href={`/admin/events/${e.id}`}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-forest bg-forest/8 hover:bg-forest/15 transition-colors px-3 py-1.5 rounded-lg"
                          >
                            <Edit2 size={11} /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-mist flex-shrink-0">
                <p className="text-xs text-charcoal/40">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 disabled:opacity-30 transition-all"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-medium transition-all",
                        n === safePage ? "bg-forest text-cream" : "text-charcoal/50 hover:bg-charcoal/5"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={safePage === pages}
                    className="px-3 py-1.5 rounded-lg text-xs text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 disabled:opacity-30 transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
