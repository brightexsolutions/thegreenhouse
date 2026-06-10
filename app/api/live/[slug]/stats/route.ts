import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase  = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: rows } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, checked_in")
    .eq("event_id", (event as { id: string }).id)
    .is("deleted_at", null);

  const all     = rows ?? [];
  const present = all.filter(r => r.checked_in);

  return NextResponse.json({
    total:     all.length,
    present:   present.length,
    attendees: all.map(r => ({ id: r.id, first_name: r.first_name, last_name: r.last_name })),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
