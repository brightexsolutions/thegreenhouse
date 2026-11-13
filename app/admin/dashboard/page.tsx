import { createAdminClient } from "@/lib/supabase/server";
import { Calendar, Users, Radio, ArrowRight, MapPin, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { MiniChart } from "@/components/admin/ui/mini-chart";
import { sessionName, formatEventTime, todayInNairobi } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string; title: string; slug: string; status: string;
  event_date: string; event_time: string | null; venue_name: string | null; capacity: number | null;
};
type SessionStat = EventRow & { registered: number; attended: number };
type RecentRow = {
  id: string; first_name: string; last_name: string; email: string | null;
  phone: string | null; created_at: string; events: { title: string } | null;
};

async function getDashboardData() {
  const supabase = createAdminClient();
  const today = todayInNairobi();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalRegistrations },
    { count: checkedIn },
    { count: commsSent },
    { data: eventRows },
    { data: recent },
    { data: regByDay },
  ] = await Promise.all([
    supabase.from("registrations").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("checked_in", true).is("deleted_at", null),
    supabase.from("communications_log").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("events")
      .select("id, title, slug, status, event_date, event_time, venue_name, capacity")
      .is("deleted_at", null)
      .order("event_date", { ascending: false })
      .limit(12),
    supabase.from("registrations")
      .select("id, first_name, last_name, email, phone, created_at, events(title)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("registrations")
      .select("created_at")
      .is("deleted_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
  ]);

  const events = ((eventRows as EventRow[] | null) ?? []).filter(e => e.status !== "draft" && e.status !== "cancelled");
  const drafts = ((eventRows as EventRow[] | null) ?? []).filter(e => e.status === "draft").length;

  // Registered and attended per session: two head counts each, in parallel.
  const shown = events.slice(0, 6);
  const sessions: SessionStat[] = await Promise.all(shown.map(async (e) => {
    const [{ count: registered }, { count: attended }] = await Promise.all([
      supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id).is("deleted_at", null),
      supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id).eq("checked_in", true).is("deleted_at", null),
    ]);
    return { ...e, registered: registered ?? 0, attended: attended ?? 0 };
  }));

  // The session that needs attention: live first, otherwise the nearest one
  // that has not happened yet.
  const upcoming = sessions
    .filter(e => e.status === "live" || (e.status === "published" && e.event_date >= today))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const next = upcoming.find(e => e.status === "live") ?? upcoming[0] ?? null;

  const dayBuckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    dayBuckets[new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]] = 0;
  }
  for (const r of (regByDay ?? []) as { created_at: string }[]) {
    const day = r.created_at.split("T")[0];
    if (day in dayBuckets) dayBuckets[day]++;
  }
  const sparkData = Object.values(dayBuckets);

  const totalReg = totalRegistrations ?? 0;
  return {
    today,
    next,
    drafts,
    sessions,
    sessionsHeld: events.filter(e => e.status === "past" || e.event_date < today).length,
    totalReg,
    checkedIn: checkedIn ?? 0,
    commsSent: commsSent ?? 0,
    showRate:  totalReg ? Math.round(((checkedIn ?? 0) / totalReg) * 100) : null,
    last14:    sparkData.reduce((a, b) => a + b, 0),
    sparkData,
    recent:    (recent as unknown as RecentRow[]) ?? [],
  };
}

function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

function fmtDate(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-KE", { ...opts, timeZone: "UTC" });
}

/** One figure with its label. Numbers wear ink, never an accent colour. */
function Tile({ label, value, sub, children }: { label: string; value: string | number; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-mist p-4 flex flex-col justify-between gap-3 min-h-[112px]">
      <div className="flex items-start justify-between gap-2">
        <p className="label-caps text-charcoal/65">{label}</p>
        {children}
      </div>
      <div>
        <p className="text-3xl font-semibold text-charcoal tabular-nums leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-charcoal/65 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const d = await getDashboardData();
  const next = d.next;
  const away = next ? daysUntil(next.event_date, d.today) : null;
  const when =
    next?.status === "live" ? "Live now"
    : away === 0 ? "Today"
    : away === 1 ? "Tomorrow"
    : away !== null ? `In ${away} days`
    : null;
  const fill = next?.capacity ? Math.min(100, Math.round((next.registered / next.capacity) * 100)) : null;
  const spotsLeft = next?.capacity ? Math.max(0, next.capacity - next.registered) : null;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest leading-none">Dashboard</h1>
          <p className="text-sm text-charcoal/65 mt-1.5">
            {fmtDate(d.today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {d.drafts > 0 && <> · {d.drafts} draft{d.drafts === 1 ? "" : "s"} unpublished</>}
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
        >
          <Plus size={15} /> New session
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Next session: the one thing an organiser opens this page to check */}
        <section className="lg:col-span-3 bg-forest text-cream rounded-xl p-6 flex flex-col">
          {next ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="label-caps text-gold">{next.status === "live" ? "Session in progress" : "Next session"}</p>
                {when && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-cream/10 text-cream">
                    {next.status === "live" && <Radio size={12} className="text-green-300" />}
                    {when}
                  </span>
                )}
              </div>

              <h2 className="font-display text-3xl font-semibold leading-tight mt-3">
                <Link href={`/admin/events/${next.id}`} className="hover:text-gold-light transition-colors">
                  {sessionName(next.title, next.title)}
                </Link>
              </h2>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-cream/80">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} /> {fmtDate(next.event_date, { weekday: "short", day: "numeric", month: "long" })}
                </span>
                {next.event_time && (
                  <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {formatEventTime(next.event_time)}</span>
                )}
                {next.venue_name && (
                  <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {next.venue_name}</span>
                )}
              </div>

              <dl className="grid grid-cols-3 gap-4 mt-6">
                <div>
                  <dt className="text-xs text-cream/75">Registered</dt>
                  <dd className="text-3xl font-semibold tabular-nums leading-none mt-1.5">{next.registered}</dd>
                </div>
                <div>
                  <dt className="text-xs text-cream/75">Checked in</dt>
                  <dd className="text-3xl font-semibold tabular-nums leading-none mt-1.5">{next.attended}</dd>
                </div>
                <div>
                  <dt className="text-xs text-cream/75">{spotsLeft === null ? "Capacity" : "Spots left"}</dt>
                  <dd className="text-3xl font-semibold tabular-nums leading-none mt-1.5">{spotsLeft === null ? "Open" : spotsLeft}</dd>
                </div>
              </dl>

              {fill !== null && (
                <div className="mt-5">
                  <div
                    className="h-2 rounded-full bg-cream/15 overflow-hidden"
                    role="meter" aria-valuemin={0} aria-valuemax={next.capacity ?? 0} aria-valuenow={next.registered}
                    aria-label="Registrations against capacity"
                  >
                    <div className="h-full rounded-full bg-gold" style={{ width: `${fill}%` }} />
                  </div>
                  <p className="text-xs text-cream/75 mt-2">{next.registered} of {next.capacity} places taken ({fill}%)</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-cream/15">
                {next.status === "live" && (
                  <Link href={`/live/${next.slug}/control`} className="px-3.5 py-2 rounded bg-gold text-forest-dark text-sm font-semibold hover:bg-gold-light transition-colors">
                    Control panel
                  </Link>
                )}
                {[
                  { href: `/admin/events/${next.id}/registrants`, label: "Registrants" },
                  { href: `/admin/events/${next.id}/tools`,       label: "Check-in and links" },
                  { href: `/admin/events/${next.id}/sessions`,    label: "Programme" },
                  { href: `/events/${next.slug}`,                 label: "Public page" },
                ].map(l => (
                  <Link key={l.href} href={l.href} className="px-3.5 py-2 rounded border border-cream/25 text-sm font-medium text-cream hover:bg-cream/10 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start justify-center flex-1 py-6">
              <p className="label-caps text-gold">Next session</p>
              <h2 className="font-display text-3xl font-semibold mt-3">Nothing scheduled yet</h2>
              <p className="text-sm text-cream/80 mt-2 max-w-md">
                Create the next quarterly session and publish it to open registration.
              </p>
              <Link href="/admin/events/new" className="mt-5 px-4 py-2.5 rounded bg-gold text-forest-dark text-sm font-semibold hover:bg-gold-light transition-colors">
                Create a session
              </Link>
            </div>
          )}
        </section>

        {/* All-time figures */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Tile label="Registrations" value={d.totalReg} sub={`${d.last14} in the last 14 days`}>
            {d.sparkData.some(n => n > 0) && <MiniChart data={d.sparkData} color="green" />}
          </Tile>
          <Tile label="Show-up rate" value={d.showRate === null ? "–" : `${d.showRate}%`} sub={`${d.checkedIn.toLocaleString()} checked in, all sessions`} />
          <Tile label="Sessions held" value={d.sessionsHeld} sub="quarterly" />
          <Tile label="Emails sent" value={d.commsSent} sub="tickets, reminders, broadcasts" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Recent registrations */}
        <section className="lg:col-span-3 bg-white rounded-xl border border-mist">
          <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
            <h2 className="text-sm font-semibold text-charcoal">Recent registrations</h2>
            <Link href="/admin/registrants" className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1">
              All registrants <ArrowRight size={11} />
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users size={22} className="text-charcoal/50 mb-2" />
              <p className="text-sm text-charcoal/65">No registrations yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-mist">
              {d.recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-semibold text-forest uppercase">
                      {r.first_name?.[0]}{r.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-charcoal/65 truncate">{r.email ?? r.phone ?? "No contact given"}</p>
                  </div>
                  {r.events?.title && (
                    <span className="hidden md:block text-xs text-charcoal/70 bg-charcoal/5 px-2 py-0.5 rounded truncate max-w-[140px]">
                      {sessionName(r.events.title)}
                    </span>
                  )}
                  <time dateTime={r.created_at} className="text-xs text-charcoal/65 flex-shrink-0 text-right w-[92px]">
                    {new Date(r.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Nairobi" })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Attendance by session */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-mist">
          <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
            <h2 className="text-sm font-semibold text-charcoal">Attendance by session</h2>
            <Link href="/admin/events" className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1">
              All sessions <ArrowRight size={11} />
            </Link>
          </div>
          {d.sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar size={22} className="text-charcoal/50 mb-2" />
              <p className="text-sm text-charcoal/65">No sessions yet</p>
            </div>
          ) : (
            <ul className="px-5 py-2">
              {d.sessions.map((e) => {
                const pct = e.registered ? Math.round((e.attended / e.registered) * 100) : 0;
                return (
                  <li key={e.id} className="py-3 border-b border-mist last:border-b-0">
                    <Link href={`/admin/events/${e.id}`} className="group block">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-charcoal group-hover:text-forest transition-colors truncate">
                          {sessionName(e.title, e.title)}
                        </p>
                        <p className="text-xs text-charcoal/65 flex-shrink-0">{fmtDate(e.event_date, { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div
                        className="h-2 rounded-full bg-mist overflow-hidden mt-2"
                        role="meter" aria-valuemin={0} aria-valuemax={e.registered} aria-valuenow={e.attended}
                        aria-label={`${sessionName(e.title, e.title)} attendance`}
                      >
                        <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-charcoal/65 mt-1.5 tabular-nums">
                        {e.registered === 0
                          ? "No registrations"
                          : <><span className="font-semibold text-charcoal">{e.attended}</span> of {e.registered} registered attended ({pct}%)</>}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
