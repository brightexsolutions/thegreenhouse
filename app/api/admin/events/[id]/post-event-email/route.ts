import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { sendPersonalisedEmails, buildEmailLogRows, type PersonalisedEmail } from "@/lib/communications/email";
import { postEventEmailHtml, postEventEmailText, missedYouEmailHtml, missedYouEmailText } from "@/lib/email-templates";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// Sending mail plus writing the log needs more than the default budget.
export const maxDuration = 60;

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const adminSupa = guard.supabase;

  // The panel's "Re-send to all" button sends { resend: true }. Anything else
  // is a first send and has to win the claim below.
  const body = await req.json().catch(() => null) as { resend?: boolean } | null;
  const resend = body?.resend === true;

  const { data: event } = await adminSupa
    .from("events")
    .select("id, title, slug, event_date, status, theme_title, theme_scripture, post_event_email_sent")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status !== "past") return NextResponse.json({ error: "Event is not past yet" }, { status: 400 });

  // Claim before sending. The cron sends the same email, so without this a
  // cron run and a click on "Send now" could both mail the whole list.
  if (!resend) {
    const { data: claimed, error: claimError } = await adminSupa
      .from("events")
      .update({ post_event_email_sent: true })
      .eq("id", id)
      .eq("post_event_email_sent", false)
      .select("id");

    if (claimError) {
      logger.error("admin_post_event_email_claim_failed", { eventId: id, error: claimError.message });
      return NextResponse.json({ error: "Could not start the send. Please try again." }, { status: 500 });
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json(
        { error: "The post-event email has already been sent for this event. Reload the page to re-send." },
        { status: 409 }
      );
    }
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const { data: registrants } = await adminSupa
    .from("registrations")
    .select("id, first_name, email, checked_in")
    .eq("event_id", id)
    .not("email", "is", null)
    .is("deleted_at", null);

  const recipients = (registrants ?? []).filter(r => r.email) as Array<{
    id: string; first_name: string; email: string; checked_in: boolean | null;
  }>;

  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No email registrants" });
  }

  const base = {
    eventTitle:     event.title,
    eventDate:      formattedDate,
    themeTitle:     event.theme_title,
    themeScripture: event.theme_scripture,
    eventSlug:      event.slug,
  };

  // Same split as the cron: people who checked in are thanked, people who
  // registered but did not come get the "we missed you" email.
  const messages: PersonalisedEmail[] = recipients.map(r => r.checked_in === true
    ? {
        to: r.email, registrationId: r.id,
        subject: `Thank you for being there, ${event.title}`,
        html: postEventEmailHtml({ firstName: r.first_name, ...base }),
        text: postEventEmailText({ firstName: r.first_name, ...base }),
      }
    : {
        to: r.email, registrationId: r.id,
        subject: `We missed you at ${event.title}`,
        html: missedYouEmailHtml({ firstName: r.first_name, ...base }),
        text: missedYouEmailText({ firstName: r.first_name, ...base }),
      });

  const results = await sendPersonalisedEmails(messages);
  const sent = results.filter(r => r.success).length;
  const failed = results.length - sent;

  const { error: logError } = await adminSupa
    .from("communications_log")
    .insert(buildEmailLogRows(event.id, messages, results));
  if (logError) logger.error("comms_log_insert_failed", { error: logError.message, rows: messages.length });

  if (failed > 0) logger.error("admin_post_event_email_failures", { eventId: id, sent, failed });
  logger.info("admin_post_event_email_sent", { eventId: id, sent, failed, triggeredBy: guard.userId });

  return NextResponse.json({ sent, failed });
}
