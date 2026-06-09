import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Plus, Edit2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-gold/10 text-gold-dark border-gold/20",
  live:      "bg-green-100 text-green-700 border-green-200",
  past:      "bg-charcoal/8 text-charcoal/50 border-charcoal/10",
  draft:     "bg-charcoal/6 text-charcoal/40 border-charcoal/8",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

export default async function AdminEventsPage() {
  const supabase = createAdminClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, event_date, status")
    .is("deleted_at", null)
    .order("event_date", { ascending: false });

  const list = (events as Array<{ id: string; slug: string; title: string; event_date: string; status: string }>) ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-charcoal">Events</h1>
          <p className="text-sm text-charcoal/40 mt-0.5">{list.length} total sessions</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
        >
          <Plus size={14} />
          New event
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={28} className="text-charcoal/20 mx-auto mb-3" />
            <p className="text-sm text-charcoal/40">No events yet</p>
            <Link href="/admin/events/new" className="mt-4 inline-block text-xs text-forest hover:underline">Create your first event →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-mist">
                <th className="text-left text-[10px] label-caps text-charcoal/40 px-6 py-3">Event</th>
                <th className="text-left text-[10px] label-caps text-charcoal/40 px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left text-[10px] label-caps text-charcoal/40 px-4 py-3">Status</th>
                <th className="text-right text-[10px] label-caps text-charcoal/40 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {list.map((e) => (
                <tr key={e.id} className="hover:bg-off-white transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-charcoal">{e.title}</p>
                    <p className="text-[10px] text-charcoal/40 mt-0.5">/events/{e.slug}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <p className="text-xs text-charcoal/70">
                      {new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("text-[10px] px-2.5 py-1 rounded-full border font-semibold capitalize", STATUS_STYLES[e.status] ?? STATUS_STYLES.draft)}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${e.id}/registrants`}
                        className="flex items-center gap-1 text-[10px] text-charcoal/50 hover:text-forest transition-colors px-2 py-1 rounded-lg hover:bg-forest/5"
                      >
                        <Users size={11} />
                        Registrants
                      </Link>
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="flex items-center gap-1 text-[10px] text-charcoal/50 hover:text-forest transition-colors px-2 py-1 rounded-lg hover:bg-forest/5"
                      >
                        <Edit2 size={11} />
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
