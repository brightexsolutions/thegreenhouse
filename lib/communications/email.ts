import { Resend } from "resend";
import { ticketEmailHtml, ticketEmailText } from "@/lib/email-templates";
import { SITE_URL, REPLY_TO_EMAIL, TICKET_FROM_EMAIL, COMMS_FROM_EMAIL } from "@/lib/constants";
import { logger } from "@/lib/logger";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}

export interface SendTicketParams {
  to:              string;
  firstName:       string;
  lastName:        string;
  eventTitle:      string;
  eventDate:       string;
  eventTime:       string;
  venueName:       string | null;
  themeTitle?:     string | null;
  themeScripture?: string | null;
  ticketToken:     string;
  eventSlug?:      string;
  isFree?:         boolean;
  priceKes?:       number | null;
  pdfBuffer:       Buffer;
}

export interface SendResult {
  success:    boolean;
  providerId: string | null;
  error?:     string;
}

export async function sendTicketEmail(p: SendTicketParams): Promise<SendResult> {
  try {
    const ticketUrl = `${SITE_URL}/ticket/${p.ticketToken}`;
    const liveUrl   = p.eventSlug ? `${SITE_URL}/live/${p.eventSlug}` : null;
    const html = ticketEmailHtml({ ...p, ticketUrl, liveUrl, isFree: p.isFree, priceKes: p.priceKes });
    const text = ticketEmailText({ ...p, ticketUrl, liveUrl, isFree: p.isFree, priceKes: p.priceKes });

    const result = await getResend().emails.send({
      from:     TICKET_FROM_EMAIL(),
      to:       [p.to],
      replyTo: REPLY_TO_EMAIL,
      subject:  `Your ticket, ${p.eventTitle}`,
      html,
      text,
      attachments: [{ filename: "ticket.pdf", content: p.pdfBuffer }],
    });

    if (result.error) {
      const isDomainError = result.error.message?.toLowerCase().includes("domain") ||
        result.error.message?.toLowerCase().includes("not verified") ||
        result.error.message?.toLowerCase().includes("sender");
      logger.error("resend_error", {
        error: result.error.message,
        to:    p.to,
        type:  isDomainError ? "domain_not_verified" : "send_error",
      });
      return { success: false, providerId: null, error: result.error.message };
    }

    return { success: true, providerId: result.data?.id ?? null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    logger.error("send_ticket_email_failed", { error: msg, to: p.to });
    return { success: false, providerId: null, error: msg };
  }
}

export interface BroadcastEmailParams {
  to:      string[];
  subject: string;
  html:    string;
  text:    string;
}

export async function sendBroadcastEmail(p: BroadcastEmailParams): Promise<SendResult[]> {
  // Resend accepts up to 100 recipients per batch call. The previous version
  // awaited one send per recipient in sequence, which at session scale ran past
  // the serverless function limit: the request died part way through, some
  // attendees got the email, and nothing was written to the log. Batching turns
  // a hundred round trips into one.
  const BATCH_SIZE = 100;
  const results: SendResult[] = [];

  for (let i = 0; i < p.to.length; i += BATCH_SIZE) {
    const chunk = p.to.slice(i, i + BATCH_SIZE);

    try {
      const response = await getResend().batch.send(
        chunk.map(recipient => ({
          from:    COMMS_FROM_EMAIL(),
          to:      [recipient],
          replyTo: REPLY_TO_EMAIL,
          subject: p.subject,
          html:    p.html,
          text:    p.text,
        }))
      );

      if (response.error) {
        logger.error("resend_batch_error", { error: response.error.message, size: chunk.length });
        const message = response.error.message;
        chunk.forEach(() => results.push({ success: false, providerId: null, error: message }));
        continue;
      }

      // Results come back in the order they were sent.
      const sent = response.data?.data ?? [];
      chunk.forEach((_, idx) => {
        const id = sent[idx]?.id ?? null;
        results.push(id
          ? { success: true, providerId: id }
          : { success: false, providerId: null, error: "No provider id returned" });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown email error";
      logger.error("resend_batch_failed", { error: msg, size: chunk.length });
      chunk.forEach(() => results.push({ success: false, providerId: null, error: msg }));
    }
  }

  logger.info("broadcast_sent", {
    recipients: p.to.length,
    delivered:  results.filter(r => r.success).length,
  });

  return results;
}

export interface PersonalisedEmail {
  to:             string;
  subject:        string;
  html:           string;
  text:           string;
  registrationId?: string | null;
}

/**
 * Send a different email to each recipient, 100 per Resend batch call.
 * Results come back in the same order as `messages`.
 *
 * The crons used to await one send per recipient. A session-sized list ran
 * past the 60 second function limit before the "sent" flag was written, so the
 * next run emailed everyone again.
 */
export async function sendPersonalisedEmails(messages: PersonalisedEmail[]): Promise<SendResult[]> {
  const BATCH_SIZE = 100;
  const results: SendResult[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    try {
      const response = await getResend().batch.send(
        chunk.map(m => ({
          from:    COMMS_FROM_EMAIL(),
          to:      [m.to],
          replyTo: REPLY_TO_EMAIL,
          subject: m.subject,
          html:    m.html,
          text:    m.text,
        }))
      );

      if (response.error) {
        const message = response.error.message;
        logger.error("resend_batch_error", { error: message, size: chunk.length });
        chunk.forEach(() => results.push({ success: false, providerId: null, error: message }));
        continue;
      }

      const sent = response.data?.data ?? [];
      chunk.forEach((_, idx) => {
        const id = sent[idx]?.id ?? null;
        results.push(id
          ? { success: true, providerId: id }
          : { success: false, providerId: null, error: "No provider id returned" });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown email error";
      logger.error("resend_batch_failed", { error: msg, size: chunk.length });
      chunk.forEach(() => results.push({ success: false, providerId: null, error: msg }));
    }
  }

  return results;
}

/** One communications_log row per message, ready for a single bulk insert. */
export function buildEmailLogRows(eventId: string, messages: PersonalisedEmail[], results: SendResult[]) {
  const now = new Date().toISOString();
  return messages.map((m, i) => {
    const r = results[i];
    const ok = !!r?.success;
    return {
      event_id:        eventId,
      registration_id: m.registrationId ?? null,
      channel:         "email",
      recipient:       m.to,
      subject:         m.subject,
      message_body:    ok ? m.text : null,
      status:          ok ? "sent" : "failed",
      provider_id:     r?.providerId ?? null,
      error_message:   ok ? null : (r?.error ?? "Unknown error"),
      sent_at:         ok ? now : null,
    };
  });
}
