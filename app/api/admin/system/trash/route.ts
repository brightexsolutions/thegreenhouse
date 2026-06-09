import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function guardSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminSupa = createAdminClient();
  const { data: profile } = await adminSupa
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" ? adminSupa : null;
}

export async function GET() {
  const supabase = await guardSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: events }, { data: registrations }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, event_date, status, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("registrations")
      .select("id, first_name, last_name, email, phone, deleted_at, events(title)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  return NextResponse.json({ events: events ?? [], registrations: registrations ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await guardSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id } = await req.json() as { table: string; id: string };

  const allowedTables = ["events", "registrations", "event_sessions", "songs"];
  if (!allowedTables.includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const { error } = await supabase
    .from(table as "events")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ restored: true });
}
