import { createAdminClient } from "@/lib/supabase/server";
import { Calendar, Users, CheckSquare, MessageSquare, Radio, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/admin/ui/stat-card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { EventStatus } from "@/types/database";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createAdminClient();

  const [
    { count: totalEvents },
    { count: activeEvents },
    { count: totalRegistrations },
    { count: checkedIn },
    { count: commsSent },
    { data: liveEvents },
    { data: upcoming },
    { data: recent },
    { data: regByDay },
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("events").select("id", { count: "exact", head: true }).in("status", ["published", "live"]).is("deleted_at", null),
    supabase.from("registrations").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("checked_in", true).is("deleted_at", null),
    supabase.from("communications_log").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("events").select("id, title, slug, status").eq("status", "live").is("deleted_at", null).limit(1),
    supabase.from("events")
      .select("id, title, event_date, status, slug")
      .in("status", ["published", "live"])
      .is("deleted_at", null)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(4),
    supabase.from("registrations")
      .select("id, first_name, last_name, email, phone, role, created_at, events(title)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("registrations")
      .select("created_at")
      .is("deleted_at", null)
      .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true }),
  ]);

  // Build 14-day sparkline
  const dayBuckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayBuckets[d.toISOString().split("T")[0]] = 0;
  }
  for (const r of (regByDay ?? []) as { created_at: string }[]) {
    const day = r.created_at.split("T")[0];
    if (day in dayBuckets) dayBuckets[day]++;
  }
  const sparkData = Object.values(dayBuckets);

  return {
    totalEvents:  totalEvents ?? 0,
    activeEvents: activeEvents ?? 0,
    totalReg:     totalRegistrations ?? 0,
    checkedIn:    checkedIn ?? 0,
    commsSent:    commsSent ?? 0,
    showRate:     totalRegistrations ? Math.round(((checkedIn ?? 0) / totalRegistrations) * 100) : 0,
    liveEvent:    (liveEvents as Array<{ id: string; title: string; slug: string }> | null)?.[0] ?? null,
    upcoming:     (upcoming as Array<{ id: string; title: string; event_date: string; status: EventStatus; slug: string }>) ?? [],
    recent:       (recent as unknown as Array<{
      id: string; first_name: string; last_name: string; email: string | null;
      phone: string | null; role: string; created_at: string; events: { title: string } | null;
    }>) ?? [],
    sparkData,
  };
}

export default async function AdminDashboardPage() {
  const d = await getDashboardData();

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Live event banner */}
      {d.liveEvent && (
        <div className="flex-shrink-0 bg-green-600 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio size={15} className="animate-pulse" />
            <p className="text-sm font-semibold">Session is LIVE</p>
            <span className="text-white/70 text-sm">— {d.liveEvent.title}</span>
          </div>
          <Link
            href={`/live/${d.liveEvent.slug}/control`}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full font-semibold"
          >
            Control panel <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 flex-shrink-0">
        <StatCard
          icon={<Calendar size={17} />}
          label="Total Sessions"
          value={d.totalEvents}
          sub={`${d.activeEvents} active`}
          accent="green"
        />
        <StatCard
          icon={<Users size={17} />}
          label="Registrations"
          value={d.totalReg}
          sub="across all sessions"
          accent="gold"
          sparkData={d.sparkData}
        />
        <StatCard
          icon={<CheckSquare size={17} />}
          label="Attended"
          value={d.checkedIn}
          sub={d.totalReg > 0 ? `${d.showRate}% show-up rate` : "No data yet"}
          accent="blue"
        />
        <StatCard
          icon={<MessageSquare size={17} />}
          label="Comms Sent"
          value={d.commsSent}
          sub="emails + WhatsApp"
          accent="purple"
        />
      </div>

      {/* Lower panels — fill remaining height */}
      <div className="grid lg:grid-cols-5 gap-5 flex-1 min-h-0">

        {/* Upcoming sessions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-mist flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-mist flex-shrink-0">
            <h2 className="text-sm font-semibold text-charcoal">Upcoming Sessions</h2>
            <Link href="/admin/events" className="text-xs text-forest hover:underline flex items-center gap-1">
              All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {d.upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <Calendar size={24} className="text-charcoal/15 mb-2" />
                <p className="text-xs text-charcoal/35">No upcoming sessions</p>
              </div>
            ) : (
              <div className="divide-y divide-mist">
                {d.upcoming.map((e) => (
                  <Link
                    key={e.id}
                    href={`/admin/events/${e.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-off-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0 group-hover:bg-forest/12 transition-colors">
                      <Calendar size={14} className="text-forest" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal group-hover:text-forest transition-colors truncate">{e.title}</p>
                      <p className="text-[10px] text-charcoal/40 mt-0.5">
                        {new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-mist flex-shrink-0">
            <Link
              href="/admin/events/new"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full border border-forest/20 text-forest text-xs font-semibold hover:bg-forest/5 transition-colors"
            >
              + Create new session
            </Link>
          </div>
        </div>

        {/* Recent registrations */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-mist flex flex-col min-h-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-mist flex-shrink-0">
            <h2 className="text-sm font-semibold text-charcoal">Recent Registrations</h2>
            <Link href="/admin/registrants" className="text-xs text-forest hover:underline flex items-center gap-1">
              All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {d.recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <Users size={24} className="text-charcoal/15 mb-2" />
                <p className="text-xs text-charcoal/35">No registrations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-mist">
                {d.recent.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-forest uppercase">
                        {r.first_name[0]}{r.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{r.first_name} {r.last_name}</p>
                      <p className="text-[10px] text-charcoal/40 truncate">{r.email ?? r.phone}</p>
                    </div>
                    {r.events?.title && (
                      <span className="hidden md:block text-[10px] text-charcoal/30 bg-charcoal/5 px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                        {r.events.title.replace("The Green House — ", "")}
                      </span>
                    )}
                    <p className="text-[10px] text-charcoal/30 flex-shrink-0">
                      {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
