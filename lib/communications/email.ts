import { Resend } from "resend";
import { ticketEmailHtml, ticketEmailText } from "@/lib/email-templates";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}
const FROM = () => process.env.RESEND_FROM_EMAIL ?? `${SITE_NAME} <tickets@thegreenhouseke.com>`;

export interface SendTicketParams {
  to:          string;
  firstName:   string;
  lastName:    string;
  eventTitle:  string;
  eventDate:   string;
  eventTime:   string;
  venueName:   string | null;
  ticketToken: string;
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
    const html = ticketEmailHtml({ ...p, ticketUrl });
    const text = ticketEmailText({ ...p, ticketUrl });

    const result = await getResend().emails.send({
      from:    FROM(),
      to:      [p.to],
      subject: `Your ticket — ${p.eventTitle}`,
      html,
      text,
      attachments: [
        {
          filename: "ticket.pdf",
          content:  p.pdfBuffer,
        },
      ],
    });

    if (result.error) {
      logger.error("resend_error", { error: result.error.message, to: p.to });
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
