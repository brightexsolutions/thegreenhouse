import { createAdminClient } from "@/lib/supabase/server";
import { Calendar, Users, CheckSquare, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createAdminClient();
  const [
    { count: totalEvents },
    { count: upcomingEvents },
    { count: totalRegistrations },
    { count: checkedIn },
    { count: commsSent },
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("events").select("id", { count: "exact", head: true }).in("status", ["published", "live"]).is("deleted_at", null),
    supabase.from("registrations").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("checked_in", true).is("deleted_at", null),
    supabase.from("communications_log").select("id", { count: "exact", head: true }).eq("status", "sent"),
  ]);

  return {
    totalEvents:        totalEvents ?? 0,
    upcomingEvents:     upcomingEvents ?? 0,
    totalRegistrations: totalRegistrations ?? 0,
    checkedIn:          checkedIn ?? 0,
    commsSent:          commsSent ?? 0,
  };
}

async function getRecentRegistrations() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, email, phone, created_at, events(title)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    events: { title: string } | null;
  }>) ?? [];
}

async function getUpcomingEvents() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, event_date, status, slug")
    .in("status", ["published", "live"])
    .is("deleted_at", null)
    .order("event_date", { ascending: true })
    .limit(3);
  return (data as Array<{ id: string; title: string; event_date: string; status: string; slug: string }>) ?? [];
}

export default async function AdminDashboardPage() {
  const [stats, recent, upcoming] = await Promise.all([
    getStats(),
    getRecentRegistrations(),
    getUpcomingEvents(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-sm text-charcoal/40 mt-0.5">Overview of The Green House platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar size={18} className="text-forest" />}
          label="Total Events"
          value={stats.totalEvents}
          sub={`${stats.upcomingEvents} upcoming`}
        />
        <StatCard
          icon={<Users size={18} className="text-forest" />}
          label="Registrations"
          value={stats.totalRegistrations}
          sub="across all sessions"
        />
        <StatCard
          icon={<CheckSquare size={18} className="text-forest" />}
          label="Attended"
          value={stats.checkedIn}
          sub={stats.totalRegistrations > 0 ? `${Math.round(stats.checkedIn / stats.totalRegistrations * 100)}% show-up rate` : "—"}
        />
        <StatCard
          icon={<MessageSquare size={18} className="text-forest" />}
          label="Comms Sent"
          value={stats.commsSent}
          sub="emails + WhatsApp"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-mist p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-charcoal">Upcoming Sessions</h2>
            <Link href="/admin/events" className="text-xs text-forest hover:underline">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-charcoal/40">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((e) => (
                <Link
                  key={e.id}
                  href={`/admin/events/${e.id}`}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-forest/15 transition-colors">
                    <Calendar size={13} className="text-forest" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-charcoal group-hover:text-forest transition-colors line-clamp-1">{e.title}</p>
                    <p className="text-[10px] text-charcoal/40 mt-0.5">
                      {new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0 ${e.status === "live" ? "bg-green-100 text-green-700" : "bg-gold/10 text-gold-dark"}`}>
                    {e.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/admin/events/new"
            className="mt-5 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full border border-forest/20 text-forest text-xs font-semibold hover:bg-forest/5 transition-colors"
          >
            + New event
          </Link>
        </div>

        {/* Recent registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-mist p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-charcoal">Recent Registrations</h2>
            <Link href="/admin/registrants" className="text-xs text-forest hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-charcoal/40">No registrations yet</p>
          ) : (
            <div className="divide-y divide-mist">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-forest">
                      {r.first_name[0]}{r.last_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-charcoal truncate">{r.first_name} {r.last_name}</p>
                    <p className="text-[10px] text-charcoal/40 truncate">{r.email ?? r.phone}</p>
                  </div>
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
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center">
          {icon}
        </div>
        <TrendingUp size={12} className="text-charcoal/20" />
      </div>
      <p className="text-2xl font-bold text-charcoal">{value.toLocaleString()}</p>
      <p className="text-[10px] font-semibold text-charcoal/60 mt-0.5">{label}</p>
      <p className="text-[10px] text-charcoal/30 mt-0.5">{sub}</p>
    </div>
  );
}
