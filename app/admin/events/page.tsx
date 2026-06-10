import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { EventsTable } from "@/components/admin/events-table";
import type { EventStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = createAdminClient();

  const { data: eventsRaw } = await supabase
    .from("events")
    .select("id, slug, title, event_date, status, cover_image")
    .is("deleted_at", null)
    .order("event_date", { ascending: false });

  const eventIds = (eventsRaw ?? []).map((e: { id: string }) => e.id);

  const regCounts: Record<string, number> = {};
  if (eventIds.length > 0) {
    const { data: counts } = await supabase
      .from("registrations")
      .select("event_id")
      .in("event_id", eventIds)
      .is("deleted_at", null);
    for (const r of (counts ?? []) as { event_id: string }[]) {
      regCounts[r.event_id] = (regCounts[r.event_id] ?? 0) + 1;
    }
  }

  const events = ((eventsRaw ?? []) as Array<{
    id: string; slug: string; title: string; event_date: string; status: EventStatus; cover_image: string | null;
  }>).map(e => ({ ...e, registrations: regCounts[e.id] ?? 0 }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Events"
        description={`${events.length} session${events.length !== 1 ? "s" : ""} total`}
        action={
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
          >
            <Plus size={14} /> New event
          </Link>
        }
      />
      <EventsTable events={events} />
    </div>
  );
}

