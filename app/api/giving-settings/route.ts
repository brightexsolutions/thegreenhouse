import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["giving_paybill", "giving_account", "giving_till", "giving_phone"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[(row as { key: string; value: string }).key] = (row as { key: string; value: string }).value;
  }

  return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
}
