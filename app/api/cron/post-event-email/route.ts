import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPersonalisedEmails, buildEmailLogRows, type PersonalisedEmail } from "@/lib/communications/email";
import { postEventEmailHtml, postEventEmailText, missedYouEmailHtml, missedYouEmailText } from "@/lib/email-templates";
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
    // Claim the event before sending. If two runs overlap (cron and the manual
    // button, or a retry after a timeout) only one of them gets a row back, so
    // the same list is never emailed twice.
    const { data: claimed, error: claimError } = await supabase
      .from("events")
      .update({ post_event_email_sent: true })
      .eq("id", event.id)
      .eq("post_event_email_sent", false)
      .select("id");
    if (claimError) {
      logger.error("cron_post_event_email_claim_failed", { eventId: event.id, error: claimError.message });
      continue;
    }
    if (!claimed || claimed.length === 0) continue;

    const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    // ── Attendees (checked_in = true) → thank-you email ──────────────────
    const { data: attendeeRows } = await supabase
      .from("registrations")
      .select("id, first_name, email")
      .eq("event_id", event.id)
      .eq("checked_in", true)
      .not("email", "is", null)
      .is("deleted_at", null);

    const attendees = (attendeeRows ?? []).filter(r => r.email) as Array<{ id: string; first_name: string; email: string }>;

    // ── Non-attendees (checked_in = false OR null, has email) → missed-you ──
    const { data: absentRows } = await supabase
      .from("registrations")
      .select("id, first_name, email")
      .eq("event_id", event.id)
      .neq("checked_in", true)
      .not("email", "is", null)
      .is("deleted_at", null);

    const absentees = (absentRows ?? []).filter(r => r.email) as Array<{ id: string; first_name: string; email: string }>;

    const base = {
      eventTitle:     event.title,
      eventDate:      formattedDate,
      themeTitle:     event.theme_title,
      themeScripture: event.theme_scripture,
      eventSlug:      event.slug,
    };

    const messages: PersonalisedEmail[] = [
      ...attendees.map(r => ({
        to: r.email, registrationId: r.id,
        subject: `Thank you for being there, ${event.title}`,
        html: postEventEmailHtml({ firstName: r.first_name, ...base }),
        text: postEventEmailText({ firstName: r.first_name, ...base }),
      })),
      ...absentees.map(r => ({
        to: r.email, registrationId: r.id,
        subject: `We missed you at ${event.title}`,
        html: missedYouEmailHtml({ firstName: r.first_name, ...base }),
        text: missedYouEmailText({ firstName: r.first_name, ...base }),
      })),
    ];

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
      logger.error("cron_post_event_email_failures", { eventId: event.id, sent, failed });
    }

    logger.info("cron_post_event_email_sent", {
      eventId: event.id, title: event.title,
      attendees: attendees.length, absentees: absentees.length, sent, failed,
    });
    summary.push({ eventId: event.id, title: event.title, sent, failed });
  }

  return NextResponse.json({ processed: summary.length, summary });
}
