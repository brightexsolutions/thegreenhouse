import { SITE_URL, SITE_NAME } from "@/lib/constants";

export interface WATicketParams {
  firstName:   string;
  eventTitle:  string;
  eventDate:   string;
  venueName:   string | null;
  ticketToken: string;
}

export interface WAResult {
  success:    boolean;
  providerId: string | null;
  error?:     string;
  shareUrl?:  string;
}

/**
 * Generates a wa.me share URL the attendee can tap to forward their ticket to themselves.
 * No API call — completely free.
 */
export function waTicketShareUrl(p: WATicketParams): string {
  const ticketUrl = `${SITE_URL}/ticket/${p.ticketToken}`;
  const text = [
    `*${SITE_NAME}*`,
    `Hi ${p.firstName}, you're registered!`,
    ``,
    `Date: ${p.eventDate}`,
    p.venueName ? `Venue: ${p.venueName}` : null,
    ``,
    `Your ticket: ${ticketUrl}`,
  ].filter(Boolean).join("\n");
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

