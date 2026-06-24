import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendBroadcastEmail } from "@/lib/communications/email";
import { reminderEmailHtml, reminderEmailText } from "@/lib/email-templates";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-vercel-cron-secret") ?? req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // "Tomorrow" in UTC. The cron runs at 05:00 UTC (08:00 EAT) so adding one
  // day gives the correct calendar date for the reminder target.
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Find published events happening tomorrow that haven't had a reminder sent yet.
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, slug, event_date, event_time, venue_name, venue_map_url, dress_code, theme_title, theme_scripture")
    .eq("status", "published")
    .eq("event_date", tomorrowDate)
    .eq("reminder_email_sent", false)
    .is("deleted_at", null);

  if (eventsError) {
    logger.error("cron_pre_event_reminder_fetch_failed", { error: eventsError.message });
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ processed: 0, message: "No upcoming events need a reminder" });
  }

  const summary: Array<{ eventId: string; title: string; sent: number; failed: number }> = [];

  for (const event of events) {
    const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    // event_time is stored as "HH:MM:SS" — format as "7:00" for the template
    const [hours, minutes] = (event.event_time as string).split(":");
    const formattedTime = minutes === "00" ? hours.replace(/^0/, "") : `${hours.replace(/^0/, "")}:${minutes}`;

    // Fetch all registrants for this event who have an email address.
    const { data: registrantRows } = await supabase
      .from("registrations")
      .select("id, first_name, email, ticket_token")
      .eq("event_id", event.id)
      .not("email", "is", null)
      .is("deleted_at", null);

    const registrants = (registrantRows ?? []).filter(r => r.email) as Array<{
      id: string;
      first_name: string;
      email: string;
      ticket_token: string;
    }>;

    let sent = 0;
    let failed = 0;

    for (const r of registrants) {
      const subject = `See you tomorrow — ${event.title}`;
      const html = reminderEmailHtml({
        firstName:       r.first_name,
        eventTitle:      event.title,
        eventDate:       formattedDate,
        eventTime:       formattedTime,
        venueName:       event.venue_name,
        venueMapUrl:     event.venue_map_url,
        dressCode:       event.dress_code,
        themeTitle:      event.theme_title,
        themeScripture:  event.theme_scripture,
        ticketToken:     r.ticket_token,
        eventSlug:       event.slug,
      });
      const text = reminderEmailText({
        firstName:       r.first_name,
        eventTitle:      event.title,
        eventDate:       formattedDate,
        eventTime:       formattedTime,
        venueName:       event.venue_name,
        venueMapUrl:     event.venue_map_url,
        dressCode:       event.dress_code,
        themeTitle:      event.theme_title,
        themeScripture:  event.theme_scripture,
        ticketToken:     r.ticket_token,
        eventSlug:       event.slug,
      });

      const results = await sendBroadcastEmail({ to: [r.email], subject, html, text });
      const result = results[0];

      if (result?.success) {
        sent++;
        await supabase.from("communications_log").insert({
          event_id:        event.id,
          registration_id: r.id,
          channel:         "email",
          recipient:       r.email,
          subject,
          message_body:    text,
          status:          "sent",
          provider_id:     result.providerId,
          sent_at:         new Date().toISOString(),
        });
      } else {
        failed++;
        await supabase.from("communications_log").insert({
          event_id:        event.id,
          registration_id: r.id,
          channel:         "email",
          recipient:       r.email,
          subject,
          status:          "failed",
          error_message:   result?.error ?? "Unknown error",
        });
      }
    }

    // Prevent re-sending if the cron fires again on the same day.
    await supabase.from("events").update({ reminder_email_sent: true }).eq("id", event.id);

    logger.info("cron_pre_event_reminder_sent", {
      eventId:     event.id,
      title:       event.title,
      eventDate:   tomorrowDate,
      registrants: registrants.length,
      sent,
      failed,
    });

    summary.push({ eventId: event.id, title: event.title, sent, failed });
  }

  return NextResponse.json({ processed: summary.length, summary });
}
