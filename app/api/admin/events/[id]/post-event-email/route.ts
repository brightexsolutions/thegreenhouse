import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendBroadcastEmail } from "@/lib/communications/email";
import { postEventEmailHtml, postEventEmailText } from "@/lib/email-templates";
import { logger } from "@/lib/logger";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupa = createAdminClient();

  const { data: event } = await adminSupa
    .from("events")
    .select("id, title, slug, event_date, status, theme_title, theme_scripture, post_event_email_sent")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status !== "past") return NextResponse.json({ error: "Event is not past yet" }, { status: 400 });

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const { data: registrants } = await adminSupa
    .from("registrations")
    .select("id, first_name, email")
    .eq("event_id", id)
    .not("email", "is", null)
    .is("deleted_at", null);

  const recipients = (registrants ?? []).filter(r => r.email) as Array<{ id: string; first_name: string; email: string }>;

  if (recipients.length === 0) {
    await adminSupa.from("events").update({ post_event_email_sent: true }).eq("id", id);
    return NextResponse.json({ sent: 0, failed: 0, message: "No email registrants" });
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    const html = postEventEmailHtml({
      firstName:      r.first_name,
      eventTitle:     event.title,
      eventDate:      formattedDate,
      themeTitle:     event.theme_title,
      themeScripture: event.theme_scripture,
      eventSlug:      event.slug,
    });
    const text = postEventEmailText({
      firstName:      r.first_name,
      eventTitle:     event.title,
      eventDate:      formattedDate,
      themeTitle:     event.theme_title,
      themeScripture: event.theme_scripture,
      eventSlug:      event.slug,
    });

    const results = await sendBroadcastEmail({
      to:      [r.email],
      subject: `Thank you for being there — ${event.title}`,
      html,
      text,
    });

    const result = results[0];
    if (result?.success) {
      sent++;
      await adminSupa.from("communications_log").insert({
        event_id:        event.id,
        registration_id: r.id,
        channel:         "email",
        recipient:       r.email,
        subject:         `Thank you for being there — ${event.title}`,
        message_body:    text,
        status:          "sent",
        provider_id:     result.providerId,
        sent_at:         new Date().toISOString(),
      });
    } else {
      failed++;
      await adminSupa.from("communications_log").insert({
        event_id:        event.id,
        registration_id: r.id,
        channel:         "email",
        recipient:       r.email,
        subject:         `Thank you for being there — ${event.title}`,
        status:          "failed",
        error_message:   result?.error ?? "Unknown error",
      });
    }
  }

  await adminSupa.from("events").update({ post_event_email_sent: true }).eq("id", id);
  logger.info("admin_post_event_email_sent", { eventId: id, sent, failed, triggeredBy: user.id });

  return NextResponse.json({ sent, failed });
}
