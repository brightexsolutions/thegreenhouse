import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/server";
import { TicketPdf } from "@/lib/pdf/ticket-pdf";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { token } = await params;

  const supabase = createAdminClient();
  const { data: ticket } = await supabase
    .from("registrations")
    .select("*, events(title, event_date, event_time, venue_name, slug, dress_code, theme_title)")
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
    };
  }).events;

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = event.event_time.slice(0, 5).replace(":", ".");

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
        "Content-Disposition": `attachment; filename="ticket-${(ticket as { first_name: string }).first_name.toLowerCase()}-${(ticket as { last_name: string }).last_name.toLowerCase()}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
