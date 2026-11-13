import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/server";
import { TicketPdf } from "@/lib/pdf/ticket-pdf";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { formatEventTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

/**
 * Content-Disposition for a download named after the attendee. Header values
 * must be Latin-1, so a name with characters outside it used to throw and turn
 * the download into a 500. The plain `filename` is reduced to ASCII and the
 * real name travels in `filename*` (RFC 5987), which browsers prefer.
 */
function attachmentHeader(filename: string, fallback: string): string {
  const ascii = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/["\\/;]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-");
  const safe = /[A-Za-z0-9]/.test(ascii.replace(/\.[a-z]+$/, "").replace(/^(ticket|badge)-?/, "")) ? ascii : fallback;
  const encoded = encodeURIComponent(filename)
    .replace(/['()*!]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { token } = await params;

  const supabase = createAdminClient();
  const { data: ticket } = await supabase
    .from("registrations")
    .select("*, events(title, event_date, event_time, venue_name, slug, dress_code, theme_title, theme_scripture)")
    .eq("ticket_token", token)
    .is("deleted_at", null)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const event = (ticket as {
    events: {
      title:       string;
      event_date:  string;
      event_time:  string;
      venue_name:  string | null;
      slug:        string;
      dress_code:  string | null;
      theme_title: string | null;
      theme_scripture: string | null;
    };
  }).events;

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = formatEventTime(event.event_time);

  const liveUrl   = `${SITE_URL}/live/${event.slug}`;
  const qrDataUrl = await QRCode.toDataURL(liveUrl, { width: 200, margin: 1, color: { dark: "#1b3a2a", light: "#f7f2e8" } });

  try {
    const pdfBuffer = await renderToBuffer(
      // @ts-expect-error react-pdf uses a different JSX type
      createElement(TicketPdf, {
        firstName:   (ticket as { first_name: string }).first_name,
        lastName:    (ticket as { last_name: string }).last_name,
        eventTitle:  event.title,
        eventDate:   formattedDate,
        eventTime:   formattedTime,
        venueName:   event.venue_name,
        dressCode:   event.dress_code,
        themeTitle:  event.theme_title,
        themeScripture: event.theme_scripture,
        ticketToken: (ticket as { ticket_token: string }).ticket_token,
        qrDataUrl,
        siteName:    SITE_NAME,
        siteUrl:     SITE_URL,
      })
    );

    return new NextResponse(Buffer.from(pdfBuffer) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": attachmentHeader(
          `ticket-${(ticket as { first_name: string }).first_name.toLowerCase()}-${(ticket as { last_name: string }).last_name.toLowerCase()}.pdf`,
          "ticket.pdf"
        ),
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    logger.error("pdf_generation_failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
