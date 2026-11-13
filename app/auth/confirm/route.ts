import { safeInternalPath } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: EmailOtpType[] = ["recovery", "invite", "magiclink", "email"];

/**
 * Landing point for the "set my password" link in the admin invite email.
 *
 * The link carries a hashed one-time token. Verifying it here, on the server,
 * writes the session cookies, so the next page (/admin/set-password) passes
 * the admin middleware and can call updateUser(). /auth/callback only handles
 * the PKCE `code` exchange, which an admin-generated link never produces.
 */
export async function GET(req: NextRequest) {
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const type      = req.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const nextParam = req.nextUrl.searchParams.get("next") ?? "/admin/set-password";

  // Same-site paths only: never redirect to a host taken from the query string.
  const next = safeInternalPath(nextParam, "/admin/set-password");

  const failed = new URL("/admin/login", req.url);
  failed.searchParams.set("error", "link_expired");

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(failed);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    logger.warn("auth_confirm_failed", { error: error.message, type });
    return NextResponse.redirect(failed);
  }

  return NextResponse.redirect(new URL(next, req.url));
}
