import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-brightex-token");
  const start = Date.now();

  // Public ping — no auth needed
  if (!token || token !== process.env.BRIGHTEX_HEALTH_TOKEN) {
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  }

  // Authenticated detail check — for Brightex dashboard monitoring
  const checks: Record<string, string> = {};
  try {
    const supabase = createAdminClient();
    await supabase.from("events").select("id", { count: "exact", head: true }).limit(1);
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  const status = Object.values(checks).includes("error") ? "degraded" : "ok";

  return NextResponse.json({
    status,
    project:          "greenhouse",
    environment:      process.env.NODE_ENV,
    timestamp:        new Date().toISOString(),
    checks,
    response_time_ms: Date.now() - start,
  }, { status: status === "ok" ? 200 : 503 });
}
