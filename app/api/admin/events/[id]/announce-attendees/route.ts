import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { COMMS_FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/constants";
import { announceAttendeeEmailHtml, announceAttendeeEmailText } from "@/lib/email-templates";
import { logger } from "@/lib/logger";
import { Resend } from "resend";

type Props = { params: Promise<{ id: string }> };

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}

export async function POST(req: NextRequest, { params }: Props) {
  // Auth guard — admin session required
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch the new event being announced
  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, event_date, event_time, venue_name, theme_title, theme_scripture, type, price_kes, early_bird_deadline, status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status === "cancelled") return NextResponse.json({ error: "Cannot announce a cancelled event" }, { status: 400 });

  // Get all past events (excluding this one)
  const { data: pastEvents } = await supabase
    .from("events")
    .select("id")
    .eq("status", "past")
    .neq("id", id)
    .is("deleted_at", null);

  if (!pastEvents || pastEvents.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, skipped: 0, message: "No past events found — no one to notify yet." });
  }

  const pastEventIds = pastEvents.map(e => e.id);

  // Fetch all registrants with emails from those past events
  const { data: pastRegistrants } = await supabase
    .from("registrations")
    .select("email, first_name")
    .in("event_id", pastEventIds)
    .not("email", "is", null)
    .is("deleted_at", null);

  if (!pastRegistrants || pastRegistrants.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, skipped: 0, message: "No past registrants with email addresses found." });
  }

  // Deduplicate by email (keep first occurrence per email)
  const seen = new Set<string>();
  const uniqueRegistrants: { email: string; first_name: string }[] = [];
  for (const r of pastRegistrants) {
    if (r.email && !seen.has(r.email.toLowerCase())) {
      seen.add(r.email.toLowerCase());
      uniqueRegistrants.push({ email: r.email, first_name: r.first_name });
    }
  }

  // Exclude emails already registered for this event
  const { data: alreadyRegistered } = await supabase
    .from("registrations")
    .select("email")
    .eq("event_id", id)
    .not("email", "is", null)
    .is("deleted_at", null);

  const alreadyRegisteredEmails = new Set(
    (alreadyRegistered ?? []).map(r => r.email?.toLowerCase()).filter(Boolean)
  );

  const toNotify = uniqueRegistrants.filter(r => !alreadyRegisteredEmails.has(r.email.toLowerCase()));

  if (toNotify.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, skipped: uniqueRegistrants.length, message: "All past attendees are already registered for this event." });
  }

  // Format event date + time for display
  const eventDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const eventTime = event.event_time.slice(0, 5).replace(":", ".") + "pm";

  // Format early bird deadline for display
  let earlyBirdDisplay: string | null = null;
  if (event.early_bird_deadline) {
    const dl = new Date(event.early_bird_deadline);
    if (dl > new Date()) {
      earlyBirdDisplay = dl.toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
  }

  const isPaid = (event as { type: string }).type === "paid";
  const subject = earlyBirdDisplay && isPaid
    ? `You're invited — ${event.title} · Early bird closes ${earlyBirdDisplay}`
    : `You're invited — ${event.title}`;

  let sent = 0;
  let failed = 0;

  for (const registrant of toNotify) {
    const html = announceAttendeeEmailHtml({
      firstName:         registrant.first_name,
      newEventTitle:     event.title,
      newEventDate:      eventDate,
      newEventTime:      eventTime,
      newEventSlug:      event.slug,
      venueName:         event.venue_name,
      themeTitle:        (event as { theme_title: string | null }).theme_title,
      themeScripture:    (event as { theme_scripture: string | null }).theme_scripture,
      isPaid,
      priceKes:          isPaid ? (event as { price_kes: number }).price_kes : null,
      earlyBirdDeadline: earlyBirdDisplay,
    });
    const text = announceAttendeeEmailText({
      firstName:         registrant.first_name,
      newEventTitle:     event.title,
      newEventDate:      eventDate,
      newEventTime:      eventTime,
      newEventSlug:      event.slug,
      venueName:         event.venue_name,
      themeTitle:        (event as { theme_title: string | null }).theme_title,
      themeScripture:    (event as { theme_scripture: string | null }).theme_scripture,
      isPaid,
      priceKes:          isPaid ? (event as { price_kes: number }).price_kes : null,
      earlyBirdDeadline: earlyBirdDisplay,
    });

    let providerId: string | null = null;
    let status: "sent" | "failed" = "failed";
    let errorMessage: string | null = null;

    try {
      const result = await getResend().emails.send({
        from:    COMMS_FROM_EMAIL(),
        to:      [registrant.email],
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
        text,
      });
      if (result.error) {
        errorMessage = result.error.message;
        failed++;
        logger.warn("announce_email_failed", { email: registrant.email, error: result.error.message });
      } else {
        providerId = result.data?.id ?? null;
        status = "sent";
        sent++;
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unknown error";
      failed++;
      logger.error("announce_email_error", { email: registrant.email, error: errorMessage });
    }

    // Log each send attempt
    await supabase.from("communications_log").insert({
      event_id:      id,
      channel:       "email",
      recipient:     registrant.email,
      subject,
      status,
      provider_id:   providerId,
      error_message: errorMessage,
      sent_at:       status === "sent" ? new Date().toISOString() : null,
    });
  }

  logger.info("announce_attendees_complete", { event_id: id, event_title: event.title, sent, failed, skipped: uniqueRegistrants.length - toNotify.length });

  return NextResponse.json({
    sent,
    failed,
    skipped:  alreadyRegisteredEmails.size,
    total:    toNotify.length,
  });
}
