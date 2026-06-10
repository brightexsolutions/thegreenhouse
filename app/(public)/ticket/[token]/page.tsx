import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft, Share2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

async function getTicket(token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("registrations")
    .select("*, events(id, title, subtitle, event_date, event_time, venue_name, slug, dress_code, theme_title)")
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
    title: `Your Ticket — ${(ticket as { events: { title: string } }).events?.title ?? SITE_NAME}`,
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
    role: string | null;
    events: {
      id: string;
      title: string;
      subtitle: string | null;
      event_date: string;
      event_time: string;
      venue_name: string | null;
      slug: string;
      dress_code: string | null;
      theme_title: string | null;
    };
  } | null;

  if (!ticket) notFound();

  const event = ticket.events;
  const ref   = ticket.ticket_token.slice(0, 8).toUpperCase();

  const shortDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = `${event.event_time.slice(0, 5).replace(":", ".")} pm`;
  // Strip "The Green House — " prefix for cleaner display
  const sessionLabel = event.title.replace(/^The Green House\s*[—–-]\s*/i, "");

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(160deg, #0d1a12 0%, #1b3a2a 45%, #0d1a12 100%)" }}
    >
      {/* Back link */}
      <div className="w-full max-w-sm mb-6">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-cream/30 hover:text-cream/70 transition-colors"
        >
          <ArrowLeft size={12} />
          Back to event
        </Link>
      </div>

      {/* ── TICKET CARD ── */}
      <div className="w-full max-w-sm relative" style={{ filter: "drop-shadow(0 32px 80px rgba(0,0,0,0.7))" }}>

        {/* Top stub — dark panel */}
        <div
          className="relative rounded-t-[2rem] overflow-hidden px-8 py-8"
          style={{
            background: "linear-gradient(135deg, #1b3a2a 0%, #0d2218 100%)",
            borderBottom: "none",
          }}
        >
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #f7f2e8 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* Gold radial glow */}
          <div
            className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(201,162,74,0.18), transparent 70%)" }}
          />

          <div className="relative">
            <p className="label-caps text-gold/60 text-[9px] tracking-[0.35em]">{SITE_NAME}</p>
            <h1
              className="font-display font-semibold mt-3 leading-tight"
              style={{ color: "#f7f2e8", fontSize: "clamp(1.5rem,5vw,2rem)" }}
            >
              {sessionLabel}
            </h1>
            {event.theme_title && (
              <p className="text-gold/70 text-sm mt-1.5 font-display italic">{event.theme_title}</p>
            )}
          </div>
        </div>

        {/* Perforated tear line */}
        <div className="relative flex items-center" style={{ height: "1px", background: "#0d1a12" }}>
          <div
            className="absolute z-10 rounded-full"
            style={{ left: "-14px", width: "28px", height: "28px", background: "#0d1a12" }}
          />
          <div
            className="flex-1 mx-5"
            style={{ borderTop: "1.5px dashed rgba(201,162,74,0.25)" }}
          />
          <div
            className="absolute z-10 rounded-full"
            style={{ right: "-14px", width: "28px", height: "28px", background: "#0d1a12" }}
          />
        </div>

        {/* Main body */}
        <div
          className="rounded-b-[2rem] overflow-hidden"
          style={{ background: "#f7f2e8" }}
        >
          <div className="px-8 pt-7 pb-6">
            {/* Attendee name — the hero element */}
            <div className="mb-6">
              <p className="text-[9px] label-caps text-charcoal/35 tracking-[0.3em] mb-1.5">Registered to</p>
              <p
                className="font-display font-semibold leading-tight"
                style={{ fontSize: "clamp(1.6rem,5vw,2rem)", color: "#1b3a2a" }}
              >
                {ticket.first_name} {ticket.last_name}
              </p>
            </div>

            {/* Event details row */}
            <div
              className="rounded-2xl px-5 py-4 mb-5 grid grid-cols-2 gap-4"
              style={{ background: "rgba(27,58,42,0.06)", border: "1px solid rgba(27,58,42,0.1)" }}
            >
              <div>
                <p className="text-[9px] label-caps text-charcoal/35 tracking-[0.25em] mb-1">Date</p>
                <p className="text-sm font-semibold text-charcoal">{shortDate}</p>
              </div>
              <div>
                <p className="text-[9px] label-caps text-charcoal/35 tracking-[0.25em] mb-1">Time</p>
                <p className="text-sm font-semibold text-charcoal">{formattedTime}</p>
              </div>
              {event.venue_name && (
                <div className="col-span-2">
                  <p className="text-[9px] label-caps text-charcoal/35 tracking-[0.25em] mb-1">Venue</p>
                  <p className="text-sm font-semibold text-charcoal">{event.venue_name}</p>
                </div>
              )}
              {event.dress_code && (
                <div className="col-span-2">
                  <p className="text-[9px] label-caps text-charcoal/35 tracking-[0.25em] mb-1">Dress Code</p>
                  <p className="text-sm font-semibold text-charcoal">{event.dress_code}</p>
                </div>
              )}
            </div>

            {/* Ticket reference — premium box */}
            <div
              className="rounded-2xl px-6 py-5 text-center mb-4 relative overflow-hidden"
              style={{ background: "#1b3a2a" }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                  backgroundImage: "radial-gradient(circle, #c9a24a 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />
              <p className="text-[9px] label-caps tracking-[0.35em] mb-2" style={{ color: "rgba(201,162,74,0.6)" }}>
                Ticket Reference
              </p>
              <p
                className="font-mono font-bold tracking-[0.35em]"
                style={{ color: "#f7f2e8", fontSize: "1.5rem" }}
              >
                {ref}
              </p>
            </div>

            <p className="text-[11px] text-charcoal/40 text-center leading-relaxed">
              Entry is free · Present at the door · Doors open 30 min early
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-8 pb-8 space-y-3">
            <a
              href={`/api/ticket/${ticket.ticket_token}/pdf`}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{ background: "#1b3a2a", color: "#f7f2e8" }}
            >
              <Download size={15} />
              Download PDF ticket
            </a>
            <a
              href={`/api/ticket/${ticket.ticket_token}/badge`}
              download
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full border text-sm font-semibold transition-all duration-200"
              style={{ borderColor: "rgba(27,58,42,0.25)", color: "#1b3a2a" }}
            >
              <Share2 size={15} />
              Download sharing badge
            </a>
          </div>
        </div>
      </div>

      {/* ── SOCIAL BADGE PREVIEW ── */}
      <div className="w-full max-w-sm mt-8">
        <p className="text-center text-[11px] text-cream/30 uppercase tracking-[0.25em] mb-4">Social sharing badge</p>
        {/* Badge preview — square card */}
        <div
          className="relative rounded-3xl overflow-hidden aspect-square w-full"
          style={{ background: "linear-gradient(145deg, #1b3a2a 0%, #0d2218 60%, #1b3a2a 100%)" }}
        >
          {/* Gold radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 90% at 50% 0%, rgba(201,162,74,0.22), transparent 65%)" }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #c9a24a 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Decorative ring */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "80%", height: "80%",
              top: "-20%", right: "-20%",
              border: "1px solid rgba(201,162,74,0.08)",
            }}
          />

          {/* Badge content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <p
              className="label-caps tracking-[0.4em] mb-5 text-[10px]"
              style={{ color: "rgba(201,162,74,0.7)" }}
            >
              {SITE_NAME}
            </p>
            <p
              className="font-display font-semibold leading-tight mb-3"
              style={{ color: "#f7f2e8", fontSize: "clamp(1rem,4vw,1.35rem)" }}
            >
              I&apos;m attending
            </p>
            <p
              className="font-display font-bold leading-tight mb-4"
              style={{ color: "#c9a24a", fontSize: "clamp(1.2rem,5vw,1.7rem)" }}
            >
              {sessionLabel}
            </p>
            <div
              className="h-px w-16 mb-4"
              style={{ background: "rgba(201,162,74,0.3)" }}
            />
            <p
              className="font-display text-sm font-medium mb-2"
              style={{ color: "rgba(247,242,232,0.7)" }}
            >
              {ticket.first_name} {ticket.last_name}
            </p>
            <p
              className="text-xs"
              style={{ color: "rgba(247,242,232,0.4)" }}
            >
              {shortDate}
            </p>
          </div>
        </div>

        {/* Badge download CTA */}
        <div className="mt-4 text-center space-y-2">
          <a
            href={`/api/ticket/${ticket.ticket_token}/badge`}
            download
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold w-full"
            style={{ background: "rgba(201,162,74,0.15)", border: "1px solid rgba(201,162,74,0.35)", color: "#c9a24a" }}
          >
            <Download size={14} />
            Download badge (PNG)
          </a>
          <p className="text-[10px]" style={{ color: "rgba(247,242,232,0.2)" }}>
            Share on Instagram, WhatsApp, or X
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-[11px]" style={{ color: "rgba(247,242,232,0.2)" }}>
        <a href={SITE_URL} className="hover:opacity-60 transition-opacity">{SITE_URL.replace(/^https?:\/\//, "")}</a>
      </p>
    </main>
  );
}
