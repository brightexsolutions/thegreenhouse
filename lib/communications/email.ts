import { Resend } from "resend";
import { ticketEmailHtml, ticketEmailText } from "@/lib/email-templates";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}
const FROM = () => process.env.RESEND_FROM_EMAIL ?? `${SITE_NAME} <tickets@thegreenhousekws.co.ke>`;

export interface SendTicketParams {
  to:          string;
  firstName:   string;
  lastName:    string;
  eventTitle:  string;
  eventDate:   string;
  eventTime:   string;
  venueName:   string | null;
  ticketToken: string;
  eventSlug?:  string;
  isFree?:     boolean;
  priceKes?:   number | null;
  pdfBuffer:   Buffer;
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
      from:    FROM(),
      to:      [p.to],
      subject: `Your ticket — ${p.eventTitle}`,
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
  const results: SendResult[] = [];
  for (const recipient of p.to) {
    try {
      const result = await getResend().emails.send({
        from:    FROM(),
        to:      [recipient],
        subject: p.subject,
        html:    p.html,
        text:    p.text,
      });
      if (result.error) {
        results.push({ success: false, providerId: null, error: result.error.message });
      } else {
        results.push({ success: true, providerId: result.data?.id ?? null });
      }
    } catch (err) {
      results.push({ success: false, providerId: null, error: err instanceof Error ? err.message : "Unknown" });
    }
  }
  return results;
}
