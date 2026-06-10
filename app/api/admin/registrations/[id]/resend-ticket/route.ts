import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTicketEmail } from "@/lib/communications/email";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { TicketPdf } from "@/lib/pdf/ticket-pdf";
import { logger } from "@/lib/logger";

type Props = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

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
    .select("title, event_date, event_time, venue_name, slug, type, price_kes")
    .eq("id", r.event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const ev = event as { title: string; event_date: string; event_time: string; venue_name: string | null; slug: string; type: string; price_kes: number | null };

  const formattedDate = new Date(ev.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = ev.event_time.slice(0, 5).replace(":", ".");

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await renderToBuffer(
      // @ts-expect-error react-pdf JSX type
      createElement(TicketPdf, {
        firstName:   r.first_name,
        lastName:    r.last_name,
        eventTitle:  ev.title,
        eventDate:   formattedDate,
        eventTime:   formattedTime,
        venueName:   ev.venue_name,
        ticketToken: r.ticket_token,
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
    subject:         `Your ticket — ${ev.title} (resent)`,
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
