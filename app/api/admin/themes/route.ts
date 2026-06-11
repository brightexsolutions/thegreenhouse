import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function guardAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: p } = await admin.from("admin_profiles").select("role").eq("id", user.id).single();
  return p ? admin : null;
}

// GET /api/admin/themes — list all themes + which events use them
export async function GET() {
  const supabase = await guardAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: themes }, { data: events }] = await Promise.all([
    supabase
      .from("themes")
      .select("id, title, scripture, description, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, event_date, theme_id")
      .is("deleted_at", null)
      .order("event_date", { ascending: false }),
  ]);

  return NextResponse.json({ themes: themes ?? [], events: events ?? [] });
}

// POST /api/admin/themes — create theme
export async function POST(req: NextRequest) {
  const supabase = await guardAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, scripture, description } = await req.json() as {
    title: string; scripture?: string; description?: string;
  };
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const { data, error } = await supabase
    .from("themes")
    .insert({ title: title.trim(), scripture: scripture?.trim() || null, description: description?.trim() || null })
    .select("id, title, scripture, description, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ theme: data }, { status: 201 });
}

// PATCH /api/admin/themes — update theme OR assign/unassign to event
export async function PATCH(req: NextRequest) {
  const supabase = await guardAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    id?: string;
    title?: string; scripture?: string; description?: string;
    // assign/unassign
    action?: "assign" | "unassign";
    theme_id?: string;
    event_id?: string;
  };

  if (body.action === "assign" && body.event_id && body.theme_id) {
    // Assign theme to event: copy theme fields into event + set theme_id
    const { data: theme } = await supabase
      .from("themes")
      .select("title, scripture, description")
      .eq("id", body.theme_id)
      .single();

    if (!theme) return NextResponse.json({ error: "Theme not found" }, { status: 404 });

    const { error } = await supabase
      .from("events")
      .update({
        theme_id:          body.theme_id,
        theme_title:       (theme as { title: string }).title,
        theme_scripture:   (theme as { scripture: string | null }).scripture ?? null,
        theme_description: (theme as { description: string | null }).description ?? null,
        updated_at:        new Date().toISOString(),
      })
      .eq("id", body.event_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assigned: true });
  }

  if (body.action === "unassign" && body.event_id) {
    const { error } = await supabase
      .from("events")
      .update({
        theme_id:          null,
        theme_title:       null,
        theme_scripture:   null,
        theme_description: null,
        updated_at:        new Date().toISOString(),
      })
      .eq("id", body.event_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ unassigned: true });
  }

  // Edit theme details
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase
    .from("themes")
    .update({
      title:       body.title?.trim(),
      scripture:   body.scripture?.trim() || null,
      description: body.description?.trim() || null,
    })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}

// DELETE /api/admin/themes?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await guardAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Soft delete
  const { error } = await supabase
    .from("themes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
