import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { sendTicketEmail } from "@/lib/communications/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { TicketPdf } from "@/lib/pdf/ticket-pdf";
import { logger } from "@/lib/logger";
import QRCode from "qrcode";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { formatEventTime } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(_req: NextRequest, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const supabase = guard.supabase;

  const { data: reg } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, email, ticket_token, event_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!reg) {
    return NextResponse.json({ error: "Registrant not found" }, { status: 404 });
  }

  const r = reg as {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    ticket_token: string;
    event_id: string;
  };

  if (!r.email) {
    return NextResponse.json({ error: "No email address on file for this registrant" }, { status: 422 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("title, event_date, event_time, venue_name, slug, type, price_kes, dress_code, theme_title, theme_scripture")
    .eq("id", r.event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const ev = event as { title: string; event_date: string; event_time: string; venue_name: string | null; slug: string; type: string; price_kes: number | null; dress_code: string | null; theme_title: string | null; theme_scripture: string | null };

  const formattedDate = new Date(ev.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = formatEventTime(ev.event_time);

  let pdfBuffer: Buffer | null = null;
  try {
    // Same ticket the attendee got at registration: QR, theme and dress code
    // included. The resend used to produce a stripped-down PDF.
    const liveUrl   = `${SITE_URL}/live/${ev.slug}`;
    const qrDataUrl = await QRCode.toDataURL(liveUrl, { width: 200, margin: 1, color: { dark: "#1b3a2a", light: "#f7f2e8" } });
    pdfBuffer = await renderToBuffer(
      // @ts-expect-error react-pdf JSX type
      createElement(TicketPdf, {
        firstName:   r.first_name,
        lastName:    r.last_name,
        eventTitle:  ev.title,
        eventDate:   formattedDate,
        eventTime:   formattedTime,
        venueName:   ev.venue_name,
        dressCode:   ev.dress_code,
        themeTitle:     ev.theme_title,
        themeScripture: ev.theme_scripture,
        ticketToken: r.ticket_token,
        qrDataUrl,
        siteName:    SITE_NAME,
        siteUrl:     SITE_URL,
      })
    );
  } catch (err) {
    logger.warn("pdf_generation_failed_resend", { error: err instanceof Error ? err.message : String(err) });
  }

  if (!pdfBuffer) {
    return NextResponse.json({ error: "Failed to generate ticket PDF" }, { status: 500 });
  }

  const emailResult = await sendTicketEmail({
    to:          r.email,
    firstName:   r.first_name,
    lastName:    r.last_name,
    eventTitle:  ev.title,
    eventDate:   formattedDate,
    eventTime:   formattedTime,
    venueName:   ev.venue_name,
    themeTitle:     ev.theme_title,
    themeScripture: ev.theme_scripture,
    ticketToken: r.ticket_token,
    eventSlug:   ev.slug,
    isFree:      ev.type === "free",
    priceKes:    ev.price_kes,
    pdfBuffer,
  });

  await supabase.from("communications_log").insert({
    event_id:        r.event_id,
    registration_id: r.id,
    channel:         "email",
    recipient:       r.email,
    subject:         `Your ticket, ${ev.title} (resent)`,
    status:          emailResult.success ? "sent" : "failed",
    provider_id:     emailResult.providerId,
    error_message:   emailResult.error ?? null,
    sent_at:         emailResult.success ? new Date().toISOString() : null,
  });

  if (!emailResult.success) {
    return NextResponse.json({ error: emailResult.error ?? "Failed to send email" }, { status: 502 });
  }

  await supabase.from("registrations").update({ ticket_sent: true }).eq("id", r.id);
  logger.info("ticket_resent", { registration_id: r.id, email: r.email });

  return NextResponse.json({ success: true });
}
