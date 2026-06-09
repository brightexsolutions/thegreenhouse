import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { registrationSchema } from "@/lib/validations/registration";
import { createAdminClient } from "@/lib/supabase/server";
import { registerLimiter } from "@/lib/rate-limit";
import { sendTicketEmail } from "@/lib/communications/email";
import { waTicketShareUrl } from "@/lib/communications/whatsapp";
import { SITE_URL } from "@/lib/constants";
import { TicketPdf } from "@/lib/pdf/ticket-pdf";
import { logger } from "@/lib/logger";

function ip(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

export async function POST(req: NextRequest) {
  // Rate limit
  const clientIp = ip(req);
  try {
    await registerLimiter.consume(clientIp);
  } catch {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  // Parse + validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Fetch event
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, title, event_date, event_time, venue_name, status, capacity")
    .eq("id", data.event_id)
    .is("deleted_at", null)
    .single();

  if (eventErr || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!["published", "live"].includes(event.status)) {
    return NextResponse.json({ error: "Registration is closed for this event" }, { status: 409 });
  }

  // Capacity check
  if (event.capacity) {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", data.event_id)
      .is("deleted_at", null);

    if (count !== null && count >= event.capacity) {
      return NextResponse.json({ error: "This session is full" }, { status: 409 });
    }
  }

  // Duplicate check
  if (data.email) {
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", data.event_id)
      .eq("email", data.email)
      .is("deleted_at", null)
      .single();
    if (existing) {
      return NextResponse.json({ error: "You have already registered with this email" }, { status: 409 });
    }
  }

  if (data.phone) {
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", data.event_id)
      .eq("phone", data.phone)
      .is("deleted_at", null)
      .single();
    if (existing) {
      return NextResponse.json({ error: "You have already registered with this number" }, { status: 409 });
    }
  }

  // Insert registration
  const { data: reg, error: regErr } = await supabase
    .from("registrations")
    .insert({
      event_id:        data.event_id,
      first_name:      data.first_name,
      last_name:       data.last_name,
      email:           data.email ?? null,
      phone:           data.phone ?? null,
      role:            data.role,
      source:          data.source ?? null,
      notes:           data.notes ?? null,
      whatsapp_opt_in: data.whatsapp_opt_in,
    })
    .select("id, ticket_token")
    .single();

  if (regErr || !reg) {
    logger.error("registration_insert_failed", { error: regErr?.message });
    return NextResponse.json({ error: "Failed to register. Please try again." }, { status: 500 });
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = event.event_time.slice(0, 5).replace(":", ".");

  // Generate PDF
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await renderToBuffer(
      // @ts-expect-error react-pdf uses a different JSX type
      createElement(TicketPdf, {
        firstName:   data.first_name,
        lastName:    data.last_name,
        eventTitle:  event.title,
        eventDate:   formattedDate,
        eventTime:   formattedTime,
        venueName:   event.venue_name,
        ticketToken: reg.ticket_token,
      })
    );
  } catch (err) {
    logger.warn("pdf_generation_failed", { error: err instanceof Error ? err.message : String(err) });
  }

  // Send email if email provided
  if (data.email && pdfBuffer) {
    const emailResult = await sendTicketEmail({
      to:          data.email,
      firstName:   data.first_name,
      lastName:    data.last_name,
      eventTitle:  event.title,
      eventDate:   formattedDate,
      eventTime:   formattedTime,
      venueName:   event.venue_name,
      ticketToken: reg.ticket_token,
      pdfBuffer,
    });

    await supabase.from("communications_log").insert({
      event_id:        data.event_id,
      registration_id: reg.id,
      channel:         "email",
      recipient:       data.email,
      subject:         `Your ticket — ${event.title}`,
      status:          emailResult.success ? "sent" : "failed",
      provider_id:     emailResult.providerId,
      error_message:   emailResult.error ?? null,
      sent_at:         emailResult.success ? new Date().toISOString() : null,
    });

    if (emailResult.success) {
      await supabase.from("registrations").update({ ticket_sent: true }).eq("id", reg.id);
    }
  }

  const ticketUrl  = `${SITE_URL}/ticket/${reg.ticket_token}`;

  // Generate wa.me share link for phone-only attendees (no API call — free)
  const waShareUrl = data.phone
    ? waTicketShareUrl({
        firstName:   data.first_name,
        eventTitle:  event.title,
        eventDate:   formattedDate,
        venueName:   event.venue_name,
        ticketToken: reg.ticket_token,
      })
    : null;

  logger.info("registration_created", {
    event_id:        data.event_id,
    registration_id: reg.id,
    channel:         data.email ? (data.phone ? "both" : "email") : "phone",
  });

  return NextResponse.json({
    success:     true,
    ticketToken: reg.ticket_token,
    ticketUrl,
    waShareUrl,
  }, { status: 201 });
}
