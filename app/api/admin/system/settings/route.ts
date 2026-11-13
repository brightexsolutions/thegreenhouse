import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The keys app/admin/system/settings/page.tsx has fields for. Nothing else
// can be written through this route.
const SETTING_KEYS = new Set([
  "site_name", "site_tagline",
  "contact_email", "whatsapp_number",
  "instagram_handle", "twitter_handle", "facebook_url",
  "registration_open", "default_capacity",
  "giving_paybill", "giving_account", "giving_till", "giving_phone",
]);

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
  return profile?.role === "super_admin" ? { supabase: adminSupa, userId: user.id } : null;
}

export async function GET() {
  const guard = await guardSuperAdmin();
  if (!guard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await guard.supabase
    .from("site_settings")
    .select("key, value");

  const settings = Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const guard = await guardSuperAdmin();
  if (!guard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { settings } = await req.json() as { settings: Record<string, string> };

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings required" }, { status: 400 });
  }

  // The settings page posts back every row it loaded, so unknown keys are
  // dropped rather than rejected: a stray row must not block a save.
  const rows = Object.entries(settings)
    .filter(([k, v]) => SETTING_KEYS.has(k) && typeof v === "string")
    .map(([key, value]) => ({
      key,
      value,
      updated_by: guard.userId,
      updated_at: new Date().toISOString(),
    }));

  const { error } = await guard.supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ saved: true });
}
