import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, MapPin, Download, ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

async function getTicket(token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("registrations")
    .select("*, events(id, title, event_date, event_time, venue_name, slug)")
    .eq("ticket_token", token)
    .is("deleted_at", null)
    .single();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const ticket = await getTicket(token);
  if (!ticket) return { title: "Ticket not found" };
  return {
    title: `Ticket — ${(ticket as { events: { title: string } }).events?.title ?? SITE_NAME}`,
    robots: { index: false },
  };
}

export default async function TicketPage({ params }: Props) {
  const { token } = await params;
  const ticket = await getTicket(token) as {
    id: string;
    first_name: string;
    last_name: string;
    ticket_token: string;
    events: {
      id: string;
      title: string;
      event_date: string;
      event_time: string;
      venue_name: string | null;
      slug: string;
    };
  } | null;

  if (!ticket) notFound();

  const event = ticket.events;
  const ref   = ticket.ticket_token.slice(0, 8).toUpperCase();

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = event.event_time.slice(0, 5).replace(":", ".");

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Back link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal/40 hover:text-forest transition-colors"
        >
          <ArrowLeft size={12} />
          Back to event
        </Link>
      </div>

      {/* Ticket card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-forest px-8 py-8">
          <p className="label-caps text-gold/80 text-[9px]">{SITE_NAME}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream mt-2 leading-tight">
            {event.title}
          </h1>
        </div>

        {/* Tear line */}
        <div className="relative h-0 flex items-center">
          <div className="absolute -left-4 w-8 h-8 rounded-full bg-cream" />
          <div className="flex-1 mx-4 border-t-2 border-dashed border-mist" />
          <div className="absolute -right-4 w-8 h-8 rounded-full bg-cream" />
        </div>

        {/* Body */}
        <div className="px-8 pt-8 pb-6 space-y-4">
          <div>
            <p className="text-[9px] label-caps text-charcoal/40">Registered to</p>
            <p className="font-semibold text-charcoal text-lg mt-1">
              {ticket.first_name} {ticket.last_name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] label-caps text-charcoal/40 mb-1">Date</p>
              <div className="flex items-center gap-1.5 text-sm text-charcoal font-medium">
                <Calendar size={12} className="text-charcoal/40" />
                <span>{formattedDate}</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] label-caps text-charcoal/40 mb-1">Time</p>
              <div className="flex items-center gap-1.5 text-sm text-charcoal font-medium">
                <Clock size={12} className="text-charcoal/40" />
                <span>{formattedTime}pm</span>
              </div>
            </div>
          </div>

          {event.venue_name && (
            <div>
              <p className="text-[9px] label-caps text-charcoal/40 mb-1">Venue</p>
              <div className="flex items-center gap-1.5 text-sm text-charcoal font-medium">
                <MapPin size={12} className="text-charcoal/40" />
                <span>{event.venue_name}</span>
              </div>
            </div>
          )}

          {/* Reference */}
          <div className="bg-cream rounded-2xl px-5 py-4 text-center">
            <p className="text-[9px] label-caps text-charcoal/40 mb-1.5">Ticket reference</p>
            <p className="font-mono text-2xl font-bold text-forest tracking-[0.2em]">{ref}</p>
          </div>

          <p className="text-[11px] text-charcoal/40 text-center leading-relaxed">
            Entry is free. Present this at the door.
          </p>
        </div>

        {/* Download */}
        <div className="px-8 pb-8">
          <a
            href={`/api/ticket/${ticket.ticket_token}/pdf`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all duration-200"
          >
            <Download size={14} />
            Download PDF ticket
          </a>
        </div>
      </div>

      <p className="mt-6 text-xs text-charcoal/30">
        <a href={SITE_URL} className="hover:text-charcoal transition-colors">{SITE_URL}</a>
      </p>
    </main>
  );
}
