import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-vercel-cron-secret");
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("events").select("id").limit(1);

    logger.info("cron_keep_alive", { timestamp: new Date().toISOString() });

    return NextResponse.json({
      alive:     true,
      project:   "greenhouse",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("cron_keep_alive_failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ alive: false, error: "DB query failed" }, { status: 500 });
  }
}
