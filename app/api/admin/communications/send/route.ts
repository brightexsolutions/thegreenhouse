import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendBroadcastEmail } from "@/lib/communications/email";
import { SITE_NAME } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event_id, channel, subject, message } = await req.json();
  if (!event_id || !channel || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (channel === "whatsapp") {
    return NextResponse.json({
      error: "WhatsApp broadcast is not configured. Use email broadcast instead.",
    }, { status: 400 });
  }

  const adminSupa = createAdminClient();

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
    html:    `<div style="font-family:Arial;max-width:600px;margin:0 auto"><p>${message.replace(/\n/g, "<br/>")}</p><p style="color:#999;font-size:12px">— ${SITE_NAME}</p></div>`,
    text:    `${message}\n\n— ${SITE_NAME}`,
  });

  let count = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    await adminSupa.from("communications_log").insert({
      event_id,
      registration_id: list.filter(x => x.email)[i]?.id ?? null,
      channel:         "email",
      recipient:       emails[i],
      subject:         subject || null,
      message_body:    message,
      status:          r.success ? "sent" : "failed",
      provider_id:     r.providerId,
      error_message:   r.error ?? null,
      sent_at:         r.success ? new Date().toISOString() : null,
    });
    if (r.success) count++;
  }

  return NextResponse.json({ success: true, count });
}
