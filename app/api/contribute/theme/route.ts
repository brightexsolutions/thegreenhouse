import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/contribute/theme?token=xxx — event + current theme info
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, slug, theme_title, theme_scripture, theme_description")
    .eq("theme_contribution_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  return NextResponse.json({ event });
}

// POST /api/contribute/theme?token=xxx — update theme data
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("theme_contribution_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const body = await req.json() as {
    theme_title?:       string;
    theme_scripture?:   string;
    theme_description?: string;
  };

  const patch: Record<string, string | null> = {};
  if (body.theme_title       !== undefined) patch.theme_title       = body.theme_title       || null;
  if (body.theme_scripture   !== undefined) patch.theme_scripture   = body.theme_scripture   || null;
  if (body.theme_description !== undefined) patch.theme_description = body.theme_description || null;

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase
    .from("events")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", event.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
