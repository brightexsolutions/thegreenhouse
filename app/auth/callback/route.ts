import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  // Only same-site paths. "//host" and "/\\host" are read by browsers as
  // another origin, so a crafted link could bounce a signed-in admin away.
  const requested = req.nextUrl.searchParams.get("next");
  const next = requested && /^\/(?![\/\\])/.test(requested) ? requested : "/admin/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
