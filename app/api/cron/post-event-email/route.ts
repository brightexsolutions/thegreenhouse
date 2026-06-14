import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendBroadcastEmail } from "@/lib/communications/email";
import { postEventEmailHtml, postEventEmailText } from "@/lib/email-templates";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-vercel-cron-secret") ?? req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find past events that haven't had the post-event email sent yet
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, slug, event_date, theme_title, theme_scripture")
    .eq("status", "past")
    .eq("post_event_email_sent", false)
    .is("deleted_at", null);

  if (eventsError) {
    logger.error("cron_post_event_email_fetch_failed", { error: eventsError.message });
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ processed: 0, message: "No pending post-event emails" });
  }

  const summary: Array<{ eventId: string; title: string; sent: number; failed: number }> = [];

  for (const event of events) {
    const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    // Get all registrants with emails for this event
    const { data: registrants } = await supabase
      .from("registrations")
      .select("id, first_name, email")
      .eq("event_id", event.id)
      .not("email", "is", null)
      .is("deleted_at", null);

    const recipients = (registrants ?? []).filter(r => r.email) as Array<{ id: string; first_name: string; email: string }>;

    if (recipients.length === 0) {
      await supabase.from("events").update({ post_event_email_sent: true }).eq("id", event.id);
      summary.push({ eventId: event.id, title: event.title, sent: 0, failed: 0 });
      continue;
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
        await supabase.from("communications_log").insert({
          event_id:       event.id,
          registration_id: r.id,
          channel:        "email",
          recipient:      r.email,
          subject:        `Thank you for being there — ${event.title}`,
          message_body:   text,
          status:         "sent",
          provider_id:    result.providerId,
          sent_at:        new Date().toISOString(),
        });
      } else {
        failed++;
        await supabase.from("communications_log").insert({
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

    // Mark as sent regardless — avoid re-sending to those who already got it
    await supabase.from("events").update({ post_event_email_sent: true }).eq("id", event.id);
    logger.info("cron_post_event_email_sent", { eventId: event.id, title: event.title, sent, failed });
    summary.push({ eventId: event.id, title: event.title, sent, failed });
  }

  return NextResponse.json({ processed: summary.length, summary });
}
