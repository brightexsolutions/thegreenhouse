import { createAdminClient } from "@/lib/supabase/server";
import { Activity, Database, HardDrive, Clock, Users, Zap } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getSystemStats() {
  const supabase = createAdminClient();
  const [
    { count: totalEvents },
    { count: totalRegistrations },
    { count: adminCount },
    { count: commsTotal },
    { count: commsFailed },
    { data: lastCron },
    { data: storageObjects },
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("registrations").select("id", { count: "exact", head: true }),
    supabase.from("admin_profiles").select("id", { count: "exact", head: true }),
    supabase.from("communications_log").select("id", { count: "exact", head: true }),
    supabase.from("communications_log").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("communications_log").select("sent_at").eq("status", "sent").order("sent_at", { ascending: false }).limit(1),
    supabase.storage.from("event-images").list("events", { limit: 1000 }),
  ]);

  const storageCount = storageObjects?.length ?? 0;

  return {
    totalEvents:        totalEvents ?? 0,
    totalRegistrations: totalRegistrations ?? 0,
    adminCount:         adminCount ?? 0,
    commsTotal:         commsTotal ?? 0,
    commsFailed:        commsFailed ?? 0,
    lastActivity:       (lastCron as Array<{ sent_at: string | null }> | null)?.[0]?.sent_at ?? null,
    storageCount,
  };
}

export default async function SystemPage() {
  const stats = await getSystemStats();
  const commsSuccessRate = stats.commsTotal > 0
    ? Math.round(((stats.commsTotal - stats.commsFailed) / stats.commsTotal) * 100)
    : 100;

  const cards = [
    { label: "Total Events",      value: stats.totalEvents,        icon: Zap,      href: "/admin/events" },
    { label: "Total Registrants", value: stats.totalRegistrations, icon: Users,    href: "/admin/registrants" },
    { label: "Admin Accounts",    value: stats.adminCount,         icon: Users,    href: "/admin/system/admins" },
    { label: "Comms Sent",        value: stats.commsTotal,         icon: Activity, href: "/admin/communications" },
    { label: "Delivery Rate",     value: `${commsSuccessRate}%`,   icon: Zap,      href: "/admin/system/logs" },
    { label: "Storage Files",     value: stats.storageCount,       icon: HardDrive, href: "/admin/system/settings" },
  ];

  const links = [
    { href: "/admin/system/logs",     label: "System Logs",     desc: "Comms, cron, auth events" },
    { href: "/admin/system/trash",    label: "Trash",           desc: "Soft-deleted items & restore" },
    { href: "/admin/system/admins",   label: "Admin Accounts",  desc: "Add, remove, change roles" },
    { href: "/admin/system/settings", label: "Site Settings",   desc: "Global config & contact info" },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-forest">System Overview</h1>
        <p className="text-sm text-charcoal/50 mt-1">Super admin only — platform health at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl border border-mist p-5 hover:border-sage/40 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-charcoal/50 font-medium">{label}</p>
                <p className="text-2xl font-semibold text-forest mt-1">{value}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-forest/5 flex items-center justify-center group-hover:bg-forest/10 transition-colors">
                <Icon size={16} className="text-forest/50" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick access */}
      <h2 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider mb-3">Quick access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {links.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border border-mist p-5 hover:border-forest/30 hover:bg-forest/[0.02] transition-all group"
          >
            <p className="font-medium text-forest text-sm group-hover:underline">{label}</p>
            <p className="text-xs text-charcoal/50 mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Health indicator */}
      <div className="bg-white rounded-2xl border border-mist p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-forest">Platform healthy</span>
          </div>
          {stats.lastActivity && (
            <span className="text-xs text-charcoal/40 ml-auto flex items-center gap-1">
              <Clock size={12} />
              Last activity: {new Date(stats.lastActivity).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-charcoal/50">
          <a href="/api/health" target="_blank" rel="noopener" className="hover:text-forest flex items-center gap-1">
            <Database size={11} /> API health endpoint
          </a>
          <Link href="/admin/system/logs" className="hover:text-forest flex items-center gap-1">
            <Activity size={11} /> View system logs
          </Link>
          <Link href="/admin/system/trash" className="hover:text-forest flex items-center gap-1">
            <HardDrive size={11} /> Manage trash
          </Link>
        </div>
      </div>
    </div>
  );
}
