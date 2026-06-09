import { SITE_NAME, SITE_URL } from "./constants";

interface TicketEmailData {
  firstName:   string;
  lastName:    string;
  eventTitle:  string;
  eventDate:   string;
  eventTime:   string;
  venueName:   string | null;
  ticketToken: string;
  ticketUrl:   string;
}

export function ticketEmailHtml(d: TicketEmailData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Ticket — ${d.eventTitle}</title>
<style>
  body { margin: 0; padding: 0; background: #f7f2e8; font-family: 'DM Sans', Arial, sans-serif; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .header { background: #1b3a2a; padding: 40px 40px 32px; border-radius: 16px 16px 0 0; }
  .logo { color: #c9a24a; font-size: 12px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
  .header h1 { color: #f7f2e8; font-size: 28px; font-weight: 700; margin: 16px 0 0; line-height: 1.2; }
  .ticket { background: #fff; border-radius: 0 0 16px 16px; padding: 32px 40px 40px; }
  .greeting { font-size: 15px; color: #1a1a18; margin-bottom: 24px; }
  .detail-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .detail-icon { width: 32px; height: 32px; background: #1b3a2a14; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
  .detail-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1860; font-weight: 600; }
  .detail-value { font-size: 14px; color: #1a1a18; font-weight: 600; margin-top: 2px; }
  .divider { border: none; border-top: 1px solid #e8e3d8; margin: 24px 0; }
  .token-box { background: #f7f2e8; border-radius: 12px; padding: 16px 20px; text-align: center; }
  .token-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #1a1a1860; }
  .token { font-family: monospace; font-size: 18px; letter-spacing: 4px; color: #1b3a2a; font-weight: 700; margin-top: 6px; }
  .cta { display: block; text-align: center; background: #1b3a2a; color: #f7f2e8 !important; text-decoration: none; padding: 16px 32px; border-radius: 100px; font-weight: 700; font-size: 14px; margin: 28px 0; }
  .footer { text-align: center; padding: 24px 40px; font-size: 11px; color: #1a1a1860; }
  .footer a { color: #c9a24a; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">${SITE_NAME}</div>
    <h1>See you there,<br />${d.firstName}.</h1>
  </div>
  <div class="ticket">
    <p class="greeting">Your registration is confirmed. Here are the details — your PDF ticket is attached.</p>

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

    <p style="font-size:12px; color:#1a1a1880; text-align:center;">
      Entry is free. Please present this email or your ticket at the door.<br />
      Doors open 30 minutes before the session begins.
    </p>
  </div>
  <div class="footer">
    <p>This email was sent because you registered for ${d.eventTitle}.</p>
    <p><a href="${SITE_URL}">${SITE_URL}</a></p>
  </div>
</div>
</body>
</html>`;
}

export function ticketEmailText(d: TicketEmailData): string {
  return `${SITE_NAME} — You're registered!

Hi ${d.firstName},

Your spot at ${d.eventTitle} is confirmed.

Date:  ${d.eventDate}
Time:  ${d.eventTime}pm${d.venueName ? `\nVenue: ${d.venueName}` : ""}

Ticket reference: ${d.ticketToken.slice(0, 8).toUpperCase()}
View ticket: ${d.ticketUrl}

Entry is free. Please present this email or your ticket at the door.

— The Green House Team
${SITE_URL}
`;
}
