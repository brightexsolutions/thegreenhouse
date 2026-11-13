import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPersonalisedEmails, buildEmailLogRows, type PersonalisedEmail } from "@/lib/communications/email";
import { formatEventTime } from "@/lib/utils";
import { reminderEmailHtml, reminderEmailText } from "@/lib/email-templates";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// Sending mail plus writing the log needs more than the default budget.
export const maxDuration = 60;

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
    // Claim the event before sending. If two runs overlap (cron and the manual
    // button, or a retry after a timeout) only one of them gets a row back, so
    // the same list is never emailed twice.
    const { data: claimed, error: claimError } = await supabase
      .from("events")
      .update({ reminder_email_sent: true })
      .eq("id", event.id)
      .eq("reminder_email_sent", false)
      .select("id");
    if (claimError) {
      logger.error("cron_pre_event_reminder_claim_failed", { eventId: event.id, error: claimError.message });
      continue;
    }
    if (!claimed || claimed.length === 0) continue;

    const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const formattedTime = formatEventTime(event.event_time as string);

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

    const subject = `See you tomorrow, ${event.title}`;
    const messages: PersonalisedEmail[] = registrants.map(r => {
      const data = {
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
      };
      return {
        to: r.email, registrationId: r.id, subject,
        html: reminderEmailHtml(data),
        text: reminderEmailText(data),
      };
    });

    const results = await sendPersonalisedEmails(messages);
    const sent = results.filter(r => r.success).length;
    const failed = results.length - sent;

    if (messages.length > 0) {
      const { error: logError } = await supabase
        .from("communications_log")
        .insert(buildEmailLogRows(event.id, messages, results));
      if (logError) logger.error("comms_log_insert_failed", { error: logError.message, rows: messages.length });
    }
    if (failed > 0) {
      logger.error("cron_pre_event_reminder_failures", { eventId: event.id, sent, failed });
    }

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
