"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, CheckCircle2, Circle, Mail, Phone, UserPlus, X, Loader2, Users, Camera, CameraOff, AlertTriangle, WifiOff } from "lucide-react";
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

const POLL_MS      = 5000;
const REQUEST_MS   = 12000;

/** fetch that gives up, so a hung request on venue Wi-Fi cannot leave a row
 *  stuck on its spinner for the rest of the night. */
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_MS);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
  const [notice,        setNotice]        = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [linkInvalid,   setLinkInvalid]   = useState(false);
  const [offline,       setOffline]       = useState(false);

  // When this device last wrote each registrant. Infinity while the request is
  // still in flight, then the time it finished.
  //
  // A poll only gets to overwrite a row if the poll STARTED after that row's
  // last write finished. Anything that started earlier may be carrying the
  // value from before the tap, and applying it is what made a row flip back to
  // "Mark present" a few seconds after being marked. The previous fix guarded
  // each row for a fixed 7 seconds, which still lost the race whenever the
  // save itself took longer than that on a slow connection.
  const lastWrite = useRef(new Map<string, number>());
  const pollFailures = useRef(0);
  const noticeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((kind: "error" | "info", text: string) => {
    setNotice({ kind, text });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 6000);
  }, []);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  // Keep every check-in device in step with the others.
  useEffect(() => {
    let cancelled = false;
    let inFlight  = false;

    async function sync() {
      if (inFlight || cancelled || document.hidden) return;
      inFlight = true;
      const startedAt = Date.now();
      try {
        const res = await fetchWithTimeout(
          `/api/checkin/${eventSlug}/statuses?t=${encodeURIComponent(checkinToken)}`
        );
        if (cancelled) return;
        if (res.status === 403) { setLinkInvalid(true); return; }
        if (!res.ok) throw new Error(String(res.status));

        const data = await res.json() as { registrants?: Registrant[] };
        if (cancelled || !Array.isArray(data.registrants)) return;
        const server = data.registrants;

        pollFailures.current = 0;
        setOffline(false);
        setLinkInvalid(false);

        setItems(prev => {
          const local = new Map(prev.map(r => [r.id, r]));
          // Is this poll too old to be trusted for this row?
          const stale = (id: string) => {
            const wrote = lastWrite.current.get(id);
            return wrote !== undefined && startedAt <= wrote;
          };

          const merged = server.map(s => {
            const mine = local.get(s.id);
            return mine && stale(s.id) ? { ...s, checked_in: mine.checked_in } : s;
          });

          // A walk-in added here a moment ago may not be in a poll that started
          // before the insert finished. Keep it until a fresh poll confirms it.
          const seen = new Set(server.map(s => s.id));
          for (const r of prev) {
            if (!seen.has(r.id) && stale(r.id)) merged.push(r);
          }
          return merged;
        });
      } catch {
        if (cancelled) return;
        pollFailures.current += 1;
        if (pollFailures.current >= 2) setOffline(true);
      } finally {
        inFlight = false;
      }
    }

    const id = setInterval(sync, POLL_MS);
    const wake = () => { if (!document.hidden) sync(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);
    sync();

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
    };
  }, [eventSlug, checkinToken]);

  const toggle = useCallback(async (r: Registrant) => {
    const { id } = r;
    const next = !r.checked_in;
    const name = `${r.first_name} ${r.last_name}`.trim();

    setUpdating(s => new Set(s).add(id));
    lastWrite.current.set(id, Infinity);
    setItems(prev => prev.map(x => x.id === id ? { ...x, checked_in: next } : x));

    const revert = (message: string) => {
      lastWrite.current.delete(id);
      setItems(prev => prev.map(x => x.id === id ? { ...x, checked_in: !next } : x));
      flash("error", message);
    };

    try {
      const res = await fetchWithTimeout(`/api/checkin/${eventSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: id, checked_in: next, token: checkinToken }),
      });

      if (res.ok) {
        const saved = await res.json().catch(() => null) as { checked_in?: boolean } | null;
        lastWrite.current.set(id, Date.now());
        // Trust what the database says it stored over what we assumed.
        if (saved && typeof saved.checked_in === "boolean" && saved.checked_in !== next) {
          setItems(prev => prev.map(x => x.id === id ? { ...x, checked_in: saved.checked_in! } : x));
        }
      } else if (res.status === 403) {
        setLinkInvalid(true);
        revert("This check-in link is no longer valid.");
      } else if (res.status === 404) {
        lastWrite.current.delete(id);
        setItems(prev => prev.filter(x => x.id !== id));
        flash("error", `${name} is no longer on the list.`);
      } else if (res.status === 429) {
        revert(`Too many requests. Wait a few seconds, then mark ${name} again.`);
      } else {
        revert(`${name} was not saved. Tap again.`);
      }
    } catch {
      revert(`${name} was not saved. Check your connection and tap again.`);
    } finally {
      setUpdating(s => { const n = new Set(s); n.delete(id); return n; });
    }
  }, [eventSlug, checkinToken, flash]);

  async function addWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (walkInSaving || !walkInFirst.trim() || !walkInLast.trim()) return;
    setWalkInSaving(true);
    setWalkInError(null);

    try {
      const res = await fetchWithTimeout(`/api/checkin/${eventSlug}/walkin`, {
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
        const saved = await res.json() as Registrant & { already_registered?: boolean };
        lastWrite.current.set(saved.id, Date.now());
        setItems(prev => prev.some(x => x.id === saved.id)
          ? prev.map(x => x.id === saved.id ? { ...x, ...saved } : x)
          : [...prev, saved]);
        if (saved.already_registered) {
          flash("info", `${saved.first_name} ${saved.last_name} was already registered with that number and is now marked present.`);
        }
        setWalkInFirst(""); setWalkInLast(""); setWalkInPhone(""); setWalkInConsent(true);
        setShowWalkIn(false);
      } else if (res.status === 403) {
        setLinkInvalid(true);
        setWalkInError("This check-in link is no longer valid.");
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setWalkInError(data.error ?? "Could not add this person. Try again.");
      }
    } catch {
      setWalkInError("Could not add this person. Check your connection and try again.");
    } finally {
      setWalkInSaving(false);
    }
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
      const matchContact = q.length >= 3 && (
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      );
      const matchFilter =
        filter === "all" ||
        (filter === "present" && r.checked_in) ||
        (filter === "absent"  && !r.checked_in);
      return (matchName || matchRef || matchContact) && matchFilter;
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
      {linkInvalid && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <p><span className="font-semibold">This check-in link has been replaced.</span> Nothing you tap will save. Ask the event admin for the new link.</p>
        </div>
      )}
      {offline && !linkInvalid && (
        <div role="status" className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <WifiOff size={16} className="flex-shrink-0" />
          <p>Connection lost. The list will catch up when you are back online.</p>
        </div>
      )}
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={cn(
            "sticky top-2 z-20 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-card",
            notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-forest/20 bg-white text-forest"
          )}
        >
          {notice.kind === "error"
            ? <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            : <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />}
          <p className="flex-1">{notice.text}</p>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="p-0.5 -m-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="bg-white rounded-2xl border border-mist p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-500" />
            <span className="text-sm font-semibold text-charcoal">{present} present</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={13} className="text-charcoal/50" />
            <span className="text-xs text-charcoal/65">{total} registered</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-mist overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-charcoal/60 mt-1.5 text-right">{pct}% attendance</p>
      </div>

      {/* ── Search + filter ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, phone or ticket ref"
            aria-label="Search attendees"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-mist bg-white text-sm placeholder:text-charcoal/50 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-white rounded-xl border border-mist p-1 flex-shrink-0">
          {(["all", "present", "absent"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all capitalize",
                filter === f ? "bg-forest text-cream" : "text-charcoal/70 hover:text-charcoal"
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
              className="p-1 rounded-lg hover:bg-charcoal/5 transition-colors">
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
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-forest/30 text-xs font-medium text-forest hover:border-forest/50 hover:text-forest hover:bg-forest/5 transition-all">
          <UserPlus size={13} />
          Someone arrived without a ticket? Add them here
        </button>
      )}

      {/* ── Registrant list ── */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-charcoal/60">{items.length === 0 ? "No one has registered yet." : "No one matches that search."}</p>
        ) : (
          <div className="divide-y divide-mist">
            {filtered.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                  r.is_walkin ? "bg-gold/10" : "bg-forest/10"
                )}>
                  <span className={cn("text-[10px] font-bold", r.is_walkin ? "text-gold" : "text-forest")}>
                    {(r.first_name[0] ?? "").toUpperCase()}{(r.last_name[0] ?? "").toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Row 1: name + badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-charcoal">{r.first_name} {r.last_name}</p>
                    {r.is_walkin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/15 text-bark font-medium flex-shrink-0">Walk-in</span>
                    )}
                    {/* Photo consent indicator */}
                    {r.photo_consent ? (
                      <span title="Consented to photography" className="flex-shrink-0">
                        <Camera size={11} className="text-green-500" />
                      </span>
                    ) : (
                      <span title="No photo consent" className="flex-shrink-0">
                        <CameraOff size={11} className="text-charcoal/45" />
                      </span>
                    )}
                  </div>
                  {/* Row 2: contact (truncated) + ticket ref */}
                  <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                    <div className="flex items-center gap-1 text-[11px] text-charcoal/65 min-w-0 flex-1">
                      {r.email ? (
                        <><Mail size={9} className="flex-shrink-0" /><span className="truncate">{r.email}</span></>
                      ) : r.phone ? (
                        <><Phone size={9} className="flex-shrink-0" /><span className="truncate">{r.phone}</span></>
                      ) : null}
                    </div>
                    {r.ticket_token && (
                      <span className="text-[11px] font-mono text-charcoal/55 flex-shrink-0">
                        #{r.ticket_token.slice(0, 8).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggle(r)}
                  disabled={updating.has(r.id) || linkInvalid}
                  aria-pressed={r.checked_in}
                  aria-label={r.checked_in ? `${r.first_name} ${r.last_name} is present. Tap to undo.` : `Mark ${r.first_name} ${r.last_name} present`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0",
                    "min-h-[40px] border",
                    r.checked_in
                      ? "bg-green-600 border-green-600 text-white hover:bg-green-700"
                      : "bg-white border-forest/40 text-forest hover:bg-forest hover:text-cream",
                    updating.has(r.id) && "opacity-60 cursor-wait"
                  )}
                >
                  {updating.has(r.id)
                    ? <Loader2 size={13} className="animate-spin" />
                    : r.checked_in ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                  {r.checked_in ? "Present" : "Mark present"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-charcoal/60">
        {filtered.length} of {total} shown · {present} present
      </p>
    </div>
  );
}
