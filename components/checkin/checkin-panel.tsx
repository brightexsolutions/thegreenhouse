"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, CheckCircle2, Circle, Mail, Phone, UserPlus, X, Loader2, Users, Camera, CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Registrant {
  id:            string;
  first_name:    string;
  last_name:     string;
  email:         string | null;
  phone:         string | null;
  role:          string;
  ticket_token:  string | null;
  checked_in:    boolean;
  is_walkin?:    boolean;
  photo_consent: boolean;
  created_at:    string;
}

interface Props {
  registrants:  Registrant[];
  eventSlug:    string;
  checkinToken: string;
}

export function CheckinPanel({ registrants: initial, eventSlug, checkinToken }: Props) {
  const [items,        setItems]        = useState(initial);
  const [query,        setQuery]        = useState("");
  const [filter,       setFilter]       = useState<"all" | "present" | "absent">("all");
  const [updating,     setUpdating]     = useState<Set<string>>(new Set());
  const [showWalkIn,   setShowWalkIn]   = useState(false);
  const [walkInFirst,   setWalkInFirst]   = useState("");
  const [walkInLast,    setWalkInLast]    = useState("");
  const [walkInPhone,   setWalkInPhone]   = useState("");
  const [walkInConsent, setWalkInConsent] = useState(true);
  const [walkInSaving,  setWalkInSaving]  = useState(false);
  const [walkInError,   setWalkInError]   = useState<string | null>(null);

  // Track IDs we know about so we can detect new arrivals from other devices
  const knownIds = useRef(new Set(initial.map(r => r.id)));

  // Unified poll — syncs both list and stats every 5s
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const res = await fetch(`/api/checkin/${eventSlug}/statuses?t=${encodeURIComponent(checkinToken)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as { registrants: Registrant[] };
        setItems(prev => {
          const serverMap = new Map(data.registrants.map(r => [r.id, r]));
          // Update existing + add new
          const merged = prev.map(r => {
            const s = serverMap.get(r.id);
            return s ? { ...r, checked_in: s.checked_in } : r;
          });
          for (const r of data.registrants) {
            if (!knownIds.current.has(r.id)) {
              knownIds.current.add(r.id);
              merged.push(r);
            }
          }
          return merged;
        });
      } catch { /* ignore network blip */ }
    }

    const id = setInterval(sync, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [eventSlug, checkinToken]);

  const toggle = useCallback(async (id: string, current: boolean) => {
    setUpdating(s => new Set(s).add(id));
    // Optimistic update
    setItems(prev => prev.map(r => r.id === id ? { ...r, checked_in: !current } : r));
    try {
      const res = await fetch(`/api/checkin/${eventSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: id, checked_in: !current, token: checkinToken }),
      });
      if (!res.ok) {
        // Revert on failure
        setItems(prev => prev.map(r => r.id === id ? { ...r, checked_in: current } : r));
      }
    } finally {
      setUpdating(s => { const next = new Set(s); next.delete(id); return next; });
    }
  }, [eventSlug, checkinToken]);

  async function addWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkInFirst.trim() || !walkInLast.trim()) return;
    setWalkInSaving(true);
    setWalkInError(null);

    const res = await fetch(`/api/checkin/${eventSlug}/walkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name:    walkInFirst.trim(),
        last_name:     walkInLast.trim(),
        phone:         walkInPhone.trim() || undefined,
        photo_consent: walkInConsent,
        token:         checkinToken,
      }),
    });

    if (res.ok) {
      const newR = await res.json() as Registrant;
      knownIds.current.add(newR.id);
      setItems(prev => [...prev, newR]);
      setWalkInFirst(""); setWalkInLast(""); setWalkInPhone(""); setWalkInConsent(false);
      setShowWalkIn(false);
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setWalkInError(data.error ?? "Failed to add walk-in");
    }
    setWalkInSaving(false);
  }

  // Derived stats (always in sync with items)
  const total   = items.length;
  const present = items.filter(r => r.checked_in).length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  const q = query.trim().toLowerCase();
  const filtered = items
    .filter(r => {
      const matchName = `${r.first_name} ${r.last_name}`.toLowerCase().includes(q);
      const matchRef  = r.ticket_token ? r.ticket_token.slice(0, 8).toUpperCase().includes(q.toUpperCase()) : false;
      const matchFilter =
        filter === "all" ||
        (filter === "present" && r.checked_in) ||
        (filter === "absent"  && !r.checked_in);
      return (matchName || matchRef) && matchFilter;
    })
    .sort((a, b) => {
      // Walk-ins always float to top, newest first among themselves
      if (a.is_walkin && !b.is_walkin) return -1;
      if (!a.is_walkin && b.is_walkin) return 1;
      // Everyone else: most recently registered first
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <div className="space-y-4">
      {/* ── Stats bar ── */}
      <div className="bg-white rounded-2xl border border-mist p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-500" />
            <span className="text-sm font-semibold text-charcoal">{present} present</span>
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

      {/* ── Search + filter ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or ticket ref…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-mist bg-white text-sm placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-white rounded-xl border border-mist p-1 flex-shrink-0">
          {(["all", "present", "absent"] as const).map(f => (
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

      {/* ── Walk-in form ── */}
      {showWalkIn ? (
        <form onSubmit={addWalkIn} className="bg-white rounded-2xl border border-forest/20 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-charcoal">Add attendee (no ticket)</p>
            <button type="button" onClick={() => { setShowWalkIn(false); setWalkInError(null); }}
              className="p-1 rounded-lg hover:bg-charcoal/6 transition-colors">
              <X size={13} className="text-charcoal/40" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={walkInFirst} onChange={e => setWalkInFirst(e.target.value)}
              placeholder="First name *" required
              className="px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40" />
            <input value={walkInLast} onChange={e => setWalkInLast(e.target.value)}
              placeholder="Last name *" required
              className="px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40" />
          </div>
          <input value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)}
            placeholder="Phone (optional)" type="tel"
            className="w-full px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40" />
          {/* Photo consent toggle */}
          <button
            type="button"
            onClick={() => setWalkInConsent(c => !c)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left",
              walkInConsent
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-mist bg-off-white text-charcoal/50"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors",
              walkInConsent ? "bg-green-500 border-green-500" : "border-charcoal/25"
            )}>
              {walkInConsent && (
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Camera size={12} className={walkInConsent ? "text-green-600" : "text-charcoal/30"} />
              <span>Consents to photography &amp; filming</span>
            </div>
          </button>

          {walkInError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{walkInError}</p>}
          <button type="submit" disabled={walkInSaving || !walkInFirst.trim() || !walkInLast.trim()}
            className="w-full py-2.5 rounded-xl bg-forest text-cream text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {walkInSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            {walkInSaving ? "Adding…" : "Mark as present"}
          </button>
        </form>
      ) : (
        <button onClick={() => setShowWalkIn(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-forest/30 text-xs font-medium text-forest/60 hover:border-forest/50 hover:text-forest hover:bg-forest/4 transition-all">
          <UserPlus size={13} />
          Someone arrived without a ticket? Add them here
        </button>
      )}

      {/* ── Registrant list ── */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-charcoal/30">No results</p>
        ) : (
          <div className="divide-y divide-mist">
            {filtered.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                  r.is_walkin ? "bg-gold/10" : "bg-forest/8"
                )}>
                  <span className={cn("text-[10px] font-bold", r.is_walkin ? "text-gold" : "text-forest")}>
                    {r.first_name[0]}{r.last_name[0]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Row 1: name + badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-charcoal">{r.first_name} {r.last_name}</p>
                    {r.is_walkin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/12 text-gold/80 font-medium flex-shrink-0">Walk-in</span>
                    )}
                    {/* Photo consent indicator */}
                    {r.photo_consent ? (
                      <span title="Consented to photography" className="flex-shrink-0">
                        <Camera size={11} className="text-green-500" />
                      </span>
                    ) : (
                      <span title="No photo consent" className="flex-shrink-0">
                        <CameraOff size={11} className="text-charcoal/25" />
                      </span>
                    )}
                  </div>
                  {/* Row 2: contact (truncated) + ticket ref */}
                  <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                    <div className="flex items-center gap-1 text-[11px] text-charcoal/40 min-w-0 flex-1">
                      {r.email ? (
                        <><Mail size={9} className="flex-shrink-0" /><span className="truncate">{r.email}</span></>
                      ) : r.phone ? (
                        <><Phone size={9} className="flex-shrink-0" /><span className="truncate">{r.phone}</span></>
                      ) : null}
                    </div>
                    {r.ticket_token && (
                      <span className="text-[11px] font-mono text-charcoal/30 flex-shrink-0">
                        #{r.ticket_token.slice(0, 8).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

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
                  {r.checked_in ? <><CheckCircle2 size={13} /> Present</> : <><Circle size={13} /> Mark present</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-charcoal/30">
        {filtered.length} of {total} shown · {present} present
      </p>
    </div>
  );
}
