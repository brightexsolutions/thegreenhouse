import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Fail closed. These run on cron-job.org, so the URLs are reachable from the
  // open internet: a missing secret must block the request, never skip the check.
  // post-event-email in particular broadcasts to every registrant.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error("cron_secret_missing", { route: req.nextUrl.pathname });
    return NextResponse.json({ error: "Cron is not configured" }, { status: 500 });
  }
  const cronSecret = req.headers.get("x-vercel-cron-secret") ?? req.headers.get("x-cron-secret");
  if (cronSecret !== expected) {
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
