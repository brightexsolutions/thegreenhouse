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

  const rows = Object.entries(settings)
    .filter(([, v]) => v !== undefined)
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
