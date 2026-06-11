"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, CheckCircle2, Circle, Mail, Phone, UserPlus, X, Loader2, Camera, CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Registrant {
  id:           string;
  first_name:   string;
  last_name:    string;
  email:        string | null;
  phone:        string | null;
  role:         string;
  ticket_token:  string | null;
  checked_in:    boolean;
  is_walkin?:    boolean;
  photo_consent: boolean;
}

interface CheckinListProps {
  registrants:  Registrant[];
  eventSlug:    string;
  checkinToken: string;
}

export function CheckinList({ registrants, eventSlug, checkinToken }: CheckinListProps) {
  const [items,        setItems]        = useState(registrants);
  const [query,        setQuery]        = useState("");
  const [filter,       setFilter]       = useState<"all" | "present" | "absent">("all");
  const [updating,     setUpdating]     = useState<Set<string>>(new Set());
  const [showWalkIn,   setShowWalkIn]   = useState(false);
  const [walkInFirst,  setWalkInFirst]  = useState("");
  const [walkInLast,   setWalkInLast]   = useState("");
  const [walkInPhone,  setWalkInPhone]  = useState("");
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [walkInError,  setWalkInError]  = useState<string | null>(null);

  // Poll full registrant list every 5s — replaces local state so all devices stay in sync
  // and walk-ins added on another device appear automatically.
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const res = await fetch(`/api/checkin/${eventSlug}/statuses?t=${encodeURIComponent(checkinToken)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as { registrants: Registrant[] };
        if (data.registrants) setItems(data.registrants);
      } catch { /* ignore */ }
    }
    const id = setInterval(sync, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [eventSlug, checkinToken]);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((r) => {
    const matchName = `${r.first_name} ${r.last_name}`.toLowerCase().includes(q);
    const matchRef  = r.ticket_token
      ? r.ticket_token.slice(0, 8).toUpperCase().includes(q.toUpperCase())
      : false;
    const matchFilter =
      filter === "all" ||
      (filter === "present" && r.checked_in) ||
      (filter === "absent"  && !r.checked_in);
    return (matchName || matchRef) && matchFilter;
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

  async function addWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkInFirst.trim() || !walkInLast.trim()) return;
    setWalkInSaving(true);
    setWalkInError(null);

    const res = await fetch(`/api/checkin/${eventSlug}/walkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: walkInFirst.trim(),
        last_name:  walkInLast.trim(),
        phone:      walkInPhone.trim() || undefined,
        token:      checkinToken,
      }),
    });

    if (res.ok) {
      const newRegistrant = await res.json() as Registrant;
      setItems((prev) => [...prev, newRegistrant]);
      setWalkInFirst("");
      setWalkInLast("");
      setWalkInPhone("");
      setShowWalkIn(false);
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setWalkInError(data.error ?? "Failed to add walk-in");
    }
    setWalkInSaving(false);
  }

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or ticket ref…"
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

      {/* Walk-in form */}
      {showWalkIn ? (
        <form onSubmit={addWalkIn} className="bg-white rounded-2xl border border-forest/20 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-charcoal">Add walk-in attendee</p>
            <button type="button" onClick={() => { setShowWalkIn(false); setWalkInError(null); }}
              className="p-1 rounded-lg hover:bg-charcoal/6 transition-colors">
              <X size={13} className="text-charcoal/40" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={walkInFirst}
              onChange={e => setWalkInFirst(e.target.value)}
              placeholder="First name *"
              required
              className="px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
            />
            <input
              value={walkInLast}
              onChange={e => setWalkInLast(e.target.value)}
              placeholder="Last name *"
              required
              className="px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
            />
          </div>
          <input
            value={walkInPhone}
            onChange={e => setWalkInPhone(e.target.value)}
            placeholder="Phone (optional)"
            type="tel"
            className="w-full px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
          />
          {walkInError && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{walkInError}</p>
          )}
          <button
            type="submit"
            disabled={walkInSaving || !walkInFirst.trim() || !walkInLast.trim()}
            className="w-full py-2.5 rounded-xl bg-forest text-cream text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {walkInSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            {walkInSaving ? "Adding…" : "Mark as present"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowWalkIn(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-forest/30 text-xs font-medium text-forest/60 hover:border-forest/50 hover:text-forest hover:bg-forest/4 transition-all"
        >
          <UserPlus size={13} />
          Add walk-in attendee
        </button>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-charcoal/30">No results</p>
        ) : (
          <div className="divide-y divide-mist">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                  r.is_walkin ? "bg-gold/10" : "bg-forest/8"
                )}>
                  <span className={cn(
                    "text-[10px] font-bold",
                    r.is_walkin ? "text-gold" : "text-forest"
                  )}>
                    {r.first_name[0]}{r.last_name[0]}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {r.first_name} {r.last_name}
                    </p>
                    {r.is_walkin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/12 text-gold/80 font-medium flex-shrink-0">Walk-in</span>
                    )}
                    <span
                      title={r.photo_consent ? "Consented to photography" : "No photo consent"}
                      className={cn(
                        "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                        r.photo_consent
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-charcoal/6 text-charcoal/35"
                      )}
                    >
                      {r.photo_consent
                        ? <Camera size={9} />
                        : <CameraOff size={9} />}
                    </span>
                  </div>
                  {/* Contact on its own truncated line */}
                  {(r.email || r.phone) && (
                    <p className="flex items-center gap-1 text-[11px] text-charcoal/40 mt-0.5 min-w-0">
                      {r.email
                        ? <><Mail size={9} className="flex-shrink-0" /><span className="truncate">{r.email}</span></>
                        : <><Phone size={9} className="flex-shrink-0" /><span className="truncate">{r.phone}</span></>}
                    </p>
                  )}
                  {/* Ticket token on its own line so it never hides behind the button */}
                  {r.ticket_token && (
                    <p className="text-[10px] font-mono text-charcoal/35 mt-0.5">
                      #{r.ticket_token.slice(0, 8).toUpperCase()}
                    </p>
                  )}
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
        {filtered.length} of {items.length} shown · {items.filter(r => r.checked_in).length} present
      </p>
    </div>
  );
}
