import twilio from "twilio";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { logger } from "@/lib/logger";

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio credentials not configured");
    _client = twilio(sid, token);
  }
  return _client;
}

const FROM = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

export interface WATicketParams {
  to:          string;
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
}

export async function sendTicketWhatsApp(p: WATicketParams): Promise<WAResult> {
  try {
    const ticketUrl = `${SITE_URL}/ticket/${p.ticketToken}`;
    const body = [
      `*${SITE_NAME}* 🌿`,
      `Hi ${p.firstName}, you're registered!`,
      ``,
      `📅 ${p.eventDate}`,
      p.venueName ? `📍 ${p.venueName}` : null,
      ``,
      `View your ticket here:\n${ticketUrl}`,
      ``,
      `Entry is free. See you there.`,
    ].filter(Boolean).join("\n");

    const message = await getClient().messages.create({
      from: FROM,
      to:   `whatsapp:${p.to}`,
      body,
    });

    return { success: true, providerId: message.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown WhatsApp error";
    logger.error("send_whatsapp_failed", { error: msg, to: p.to });
    return { success: false, providerId: null, error: msg };
  }
}

export async function sendBroadcastWhatsApp(
  recipients: string[],
  body: string
): Promise<WAResult[]> {
  const results: WAResult[] = [];
  for (const to of recipients) {
    try {
      const message = await getClient().messages.create({
        from: FROM,
        to:   `whatsapp:${to}`,
        body,
      });
      results.push({ success: true, providerId: message.sid });
    } catch (err) {
      results.push({ success: false, providerId: null, error: err instanceof Error ? err.message : "Unknown" });
    }
  }
  return results;
}
