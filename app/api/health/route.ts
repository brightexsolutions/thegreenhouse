import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    await supabase.from("events").select("id", { count: "exact", head: true }).limit(1);

    return NextResponse.json({
      status:    "ok",
      project:   "greenhouse",
      timestamp: new Date().toISOString(),
      db:        "connected",
    });
  } catch (err) {
    return NextResponse.json({
      status:    "error",
      project:   "greenhouse",
      timestamp: new Date().toISOString(),
      error:     err instanceof Error ? err.message : "Unknown error",
    }, { status: 503 });
  }
}
