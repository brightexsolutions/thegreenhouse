import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { sendBroadcastEmail } from "@/lib/communications/email";
import { SITE_NAME } from "@/lib/constants";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// A batch of 100 plus the log write needs headroom well past the default.
export const maxDuration = 60;

/** Escape before interpolating into the email body. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { event_id, channel, subject, message } = await req.json();
  if (!event_id || !channel || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // WhatsApp sending was dropped. Email is the only channel.
  if (channel !== "email") {
    return NextResponse.json({ error: "Email is the only broadcast channel." }, { status: 400 });
  }

  const adminSupa = guard.supabase;

  const { data: recipients } = await adminSupa
    .from("registrations")
    .select("id, email")
    .eq("event_id", event_id)
    .is("deleted_at", null);

  const list = (recipients as Array<{ id: string; email: string | null }>) ?? [];
  const emails = list.map(r => r.email).filter(Boolean) as string[];

  if (emails.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  const results = await sendBroadcastEmail({
    to:      emails,
    subject: subject || `Message from ${SITE_NAME}`,
    html:    `<div style="font-family:Arial;max-width:600px;margin:0 auto"><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p><p style="color:#999;font-size:12px">${SITE_NAME}</p></div>`,
    text:    `${message}\n\n${SITE_NAME}`,
  });

  // Pair each result with its recipient once, rather than re-filtering the
  // list inside the loop for every single row.
  const withEmail = list.filter(x => x.email);
  const now = new Date().toISOString();

  const rows = results.map((r, i) => ({
    event_id,
    registration_id: withEmail[i]?.id ?? null,
    channel:         "email",
    recipient:       emails[i],
    subject:         subject || null,
    message_body:    message,
    status:          r.success ? "sent" : "failed",
    provider_id:     r.providerId,
    error_message:   r.error ?? null,
    sent_at:         r.success ? now : null,
  }));

  const { error: logError } = await adminSupa.from("communications_log").insert(rows);
  if (logError) {
    // The mail already went out, so this is reported rather than raised as a
    // failure the admin might respond to by sending again.
    logger.error("comms_log_insert_failed", { error: logError.message, rows: rows.length });
  }

  const count = results.filter(r => r.success).length;
  const failed = results.length - count;

  return NextResponse.json({ success: true, count, failed });
}
