import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";

// Only the fields the event form sends. Tokens (checkin_token, control_token,
// the contribution tokens), slug, id and deleted_at are never taken from the
// request body.
const EVENT_FIELDS = [
  "title", "subtitle", "event_date", "event_time",
  "venue_name", "venue_address", "venue_map_url",
  "type", "price_kes", "early_bird_deadline", "capacity", "status",
  "description", "theme_title", "theme_scripture", "theme_description",
  "dress_code", "playlist_url", "feedback_url",
  "cover_image", "banner_image", "highlight_video",
] as const;

const URL_FIELDS = ["feedback_url", "venue_map_url", "playlist_url"] as const;

function pickEventFields(body: unknown): { fields: Record<string, unknown> } | { error: string } {
  const src = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  for (const key of EVENT_FIELDS) {
    if (src[key] !== undefined) fields[key] = src[key];
  }
  for (const key of URL_FIELDS) {
    const v = fields[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string" || !/^https?:\/\//i.test(v)) {
      return { error: `${key} must start with http:// or https://` };
    }
  }
  return { fields };
}

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  const { id } = await params;
  const picked = pickEventFields(await req.json());
  if ("error" in picked) return NextResponse.json({ error: picked.error }, { status: 400 });
  const body = picked.fields;
  const adminSupa = createAdminClient();

  const { data: event, error } = await adminSupa
    .from("events")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  const { id } = await params;
  const adminSupa = createAdminClient();

  await adminSupa
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
