import { SITE_NAME, SITE_URL, CONTACT_EMAIL } from "./constants";

interface TicketEmailData {
  firstName:   string;
  lastName:    string;
  eventTitle:  string;
  eventDate:   string;
  eventTime:   string;
  venueName:   string | null;
  ticketToken: string;
  ticketUrl:   string;
  liveUrl?:    string | null;
  isFree?:     boolean;
  priceKes?:   number | null;
}

export function ticketEmailHtml(d: TicketEmailData): string {
  const entryLine = d.isFree === false && d.priceKes
    ? `Ticket price: <strong>KES ${d.priceKes.toLocaleString()}</strong>. Please present this email or your ticket at the door.`
    : "Entry is <strong>free</strong>. Please present this email or your ticket at the door.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Ticket — ${d.eventTitle}</title>
<style>
  body { margin: 0; padding: 0; background: #f0ebe0; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a18; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .header { background: #1b3a2a; padding: 40px 40px 32px; border-radius: 16px 16px 0 0; }
  .logo { color: #c9a24a; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
  .header h1 { color: #f7f2e8; font-size: 30px; font-weight: 700; margin: 14px 0 0; line-height: 1.2; }
  .body { background: #ffffff; border-radius: 0 0 16px 16px; padding: 32px 40px 40px; }
  .greeting { font-size: 16px; color: #1a1a18; line-height: 1.6; margin-bottom: 28px; }
  .detail-row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
  .detail-icon { width: 36px; height: 36px; background: #edf4f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
  .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; font-weight: 600; margin-bottom: 3px; }
  .detail-value { font-size: 15px; color: #1a1a18; font-weight: 600; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
  .token-box { background: #f7f2e8; border-radius: 12px; padding: 20px; text-align: center; }
  .token-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 8px; }
  .token { font-family: 'Courier New', monospace; font-size: 22px; letter-spacing: 5px; color: #1b3a2a; font-weight: 700; }
  .cta { display: block; text-align: center; background: #1b3a2a; color: #f7f2e8 !important; text-decoration: none; padding: 16px 32px; border-radius: 100px; font-weight: 700; font-size: 15px; margin: 28px 0 12px; }
  .cta-secondary { display: block; text-align: center; background: transparent; border: 2px solid #1b3a2a; color: #1b3a2a !important; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: 600; font-size: 14px; margin: 0 0 28px; }
  .entry-note { font-size: 14px; color: #374151; text-align: center; line-height: 1.6; padding: 16px 20px; background: #f9fafb; border-radius: 10px; margin-bottom: 8px; }
  .doors-note { font-size: 13px; color: #6b7280; text-align: center; margin-bottom: 0; }
  .live-note { font-size: 12px; color: #6b7280; text-align: center; margin: -8px 0 24px; line-height: 1.5; }
  .footer { text-align: center; padding: 24px 40px; font-size: 13px; color: #6b7280; line-height: 1.8; }
  .footer a { color: #c9a24a; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">${SITE_NAME}</div>
    <h1>See you there,<br />${d.firstName}.</h1>
  </div>
  <div class="body">
    <p class="greeting">Your registration is confirmed. Here are the details for the evening — your PDF ticket is attached.</p>

    <div class="detail-row">
      <div class="detail-icon">📅</div>
      <div>
        <div class="detail-label">Date</div>
        <div class="detail-value">${d.eventDate}</div>
      </div>
    </div>
    <div class="detail-row">
      <div class="detail-icon">🕖</div>
      <div>
        <div class="detail-label">Time</div>
        <div class="detail-value">${d.eventTime}pm</div>
      </div>
    </div>
    ${d.venueName ? `
    <div class="detail-row">
      <div class="detail-icon">📍</div>
      <div>
        <div class="detail-label">Venue</div>
        <div class="detail-value">${d.venueName}</div>
      </div>
    </div>` : ""}

    <hr class="divider" />

    <div class="token-box">
      <div class="token-label">Your ticket reference</div>
      <div class="token">${d.ticketToken.slice(0, 8).toUpperCase()}</div>
    </div>

    <a href="${d.ticketUrl}" class="cta">View your ticket online</a>

    ${d.liveUrl ? `
    <a href="${d.liveUrl}" class="cta-secondary">📱 Open live program on the night</a>
    <p class="live-note">This link gives you the program, song lyrics, and a way to share your thoughts — bookmark it for the session.</p>
    ` : ""}

    <div class="entry-note">${entryLine}</div>
    <p class="doors-note">Doors open 30 minutes before the session begins.</p>
  </div>
  <div class="footer">
    <p>This email was sent because you registered for <strong>${d.eventTitle}</strong>.</p>
    <p>Questions? <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
    <p><a href="${SITE_URL}">${SITE_URL}</a> &nbsp;·&nbsp; ${SITE_NAME}</p>
  </div>
</div>
</body>
</html>`;
}

export function ticketEmailText(d: TicketEmailData): string {
  const entryLine = d.isFree === false && d.priceKes
    ? `Ticket price: KES ${d.priceKes.toLocaleString()}. Please present this email or your ticket at the door.`
    : "Entry is free. Please present this email or your ticket at the door.";

  return `${SITE_NAME} — You're registered!

Hi ${d.firstName},

Your spot at ${d.eventTitle} is confirmed.

Date:  ${d.eventDate}
Time:  ${d.eventTime}pm${d.venueName ? `\nVenue: ${d.venueName}` : ""}

Ticket reference: ${d.ticketToken.slice(0, 8).toUpperCase()}
View ticket: ${d.ticketUrl}
${d.liveUrl ? `\nLive program (use on the night): ${d.liveUrl}` : ""}

${entryLine}
Doors open 30 minutes before the session begins.

Questions? ${CONTACT_EMAIL}

— The Green House Team
${SITE_URL}
`;
}
