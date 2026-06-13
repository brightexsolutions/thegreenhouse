import { SITE_NAME, EMAIL_FROM_NAME, SITE_URL, CONTACT_EMAIL, SOCIAL_INSTAGRAM } from "./constants";

interface TicketEmailData {
  firstName:      string;
  lastName:       string;
  eventTitle:     string;
  eventDate:      string;
  eventTime:      string;
  venueName:      string | null;
  themeTitle?:    string | null;
  themeScripture?: string | null;
  ticketToken:    string;
  ticketUrl:      string;
  liveUrl?:       string | null;
  isFree?:        boolean;
  priceKes?:      number | null;
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
  .theme-block { background: linear-gradient(135deg,#1b3a2a,#0d2218); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
  .theme-title { color: #c9a24a; font-size: 19px; font-weight: 700; font-style: italic; margin: 0 0 4px; }
  .theme-verse { color: rgba(247,242,232,0.6); font-size: 13px; margin: 0; }
  .detail-row { margin-bottom: 16px; }
  .detail-row table { border-collapse: collapse; width: 100%; }
  .detail-icon { width: 40px; height: 40px; background: #edf4f0; border-radius: 10px; text-align: center; vertical-align: top; font-size: 18px; line-height: 40px; padding: 0; }
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
    <div class="logo">${EMAIL_FROM_NAME}</div>
    <h1>See you there,<br />${d.firstName}.</h1>
  </div>
  <div class="body">
    <p class="greeting">Your registration is confirmed. Here are the details for the evening — your PDF ticket is attached.</p>

    ${d.themeTitle ? `
    <div class="theme-block">
      <p class="theme-title">${d.themeTitle}</p>
      ${d.themeScripture ? `<p class="theme-verse">📖 ${d.themeScripture}</p>` : ""}
    </div>` : ""}

    <div class="detail-row">
      <table><tr>
        <td class="detail-icon" width="40">📅</td>
        <td style="padding-left:14px;vertical-align:top">
          <div class="detail-label">Date</div>
          <div class="detail-value">${d.eventDate}</div>
        </td>
      </tr></table>
    </div>
    <div class="detail-row">
      <table><tr>
        <td class="detail-icon" width="40">🕖</td>
        <td style="padding-left:14px;vertical-align:top">
          <div class="detail-label">Time</div>
          <div class="detail-value">${d.eventTime}pm</div>
        </td>
      </tr></table>
    </div>
    ${d.venueName ? `
    <div class="detail-row">
      <table><tr>
        <td class="detail-icon" width="40">📍</td>
        <td style="padding-left:14px;vertical-align:top">
          <div class="detail-label">Venue</div>
          <div class="detail-value">${d.venueName}</div>
        </td>
      </tr></table>
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
    <p><a href="${SITE_URL}">${SITE_URL}</a> &nbsp;·&nbsp; ${EMAIL_FROM_NAME}</p>
  </div>
</div>
</body>
</html>`;
}

// ─── Post-event thank-you email ──────────────────────────────────────────────

export interface PostEventEmailData {
  firstName:       string;
  eventTitle:      string;
  eventDate:       string;
  themeTitle?:     string | null;
  themeScripture?: string | null;
  eventSlug:       string;
}

export function postEventEmailHtml(d: PostEventEmailData): string {
  const feedbackUrl = `${SITE_URL}/events/${d.eventSlug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Thank you for being there — ${d.eventTitle}</title>
<style>
  body { margin: 0; padding: 0; background: #f0ebe0; font-family: 'DM Sans', Arial, sans-serif; color: #1a1a18; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .header { background: #1b3a2a; padding: 40px 40px 32px; border-radius: 16px 16px 0 0; }
  .logo { color: #c9a24a; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
  .header h1 { color: #f7f2e8; font-size: 30px; font-weight: 700; margin: 14px 0 0; line-height: 1.2; }
  .header p { color: rgba(247,242,232,0.6); font-size: 14px; margin: 10px 0 0; }
  .body { background: #ffffff; border-radius: 0 0 16px 16px; padding: 32px 40px 40px; }
  .greeting { font-size: 16px; color: #1a1a18; line-height: 1.7; margin-bottom: 24px; }
  .theme-block { background: linear-gradient(135deg,#1b3a2a,#0d2218); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
  .theme-label { color: rgba(201,162,74,0.7); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin: 0 0 6px; }
  .theme-title { color: #c9a24a; font-size: 22px; font-weight: 700; font-style: italic; margin: 0 0 4px; }
  .theme-verse { color: rgba(247,242,232,0.55); font-size: 13px; margin: 0; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
  .feedback-box { background: #f7f2e8; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; }
  .feedback-title { font-size: 16px; font-weight: 700; color: #1b3a2a; margin: 0 0 8px; }
  .feedback-body { font-size: 14px; color: #5c4a35; line-height: 1.6; margin: 0 0 20px; }
  .cta { display: inline-block; background: #1b3a2a; color: #f7f2e8 !important; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: 700; font-size: 15px; }
  .footer { text-align: center; padding: 24px 40px; font-size: 13px; color: #6b7280; line-height: 1.8; }
  .footer a { color: #c9a24a; text-decoration: none; font-weight: 600; }
  .social { margin-top: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">${EMAIL_FROM_NAME}</div>
    <h1>Thank you,<br />${d.firstName}.</h1>
    <p>We're glad you were part of ${d.eventTitle}.</p>
  </div>
  <div class="body">
    <p class="greeting">
      Something real happens when people gather with open hearts. Thank you for bringing yours last night.
      Whether you sang, prayed, listened, or simply showed up — you were part of what made it meaningful.
    </p>

    ${d.themeTitle ? `
    <div class="theme-block">
      <p class="theme-label">Session theme</p>
      <p class="theme-title">${d.themeTitle}</p>
      ${d.themeScripture ? `<p class="theme-verse">📖 ${d.themeScripture}</p>` : ""}
    </div>` : ""}

    <hr class="divider" />

    <div class="feedback-box">
      <p class="feedback-title">How did it land for you?</p>
      <p class="feedback-body">
        We'd love to hear your reflection — what stayed with you, what moved you, or even what you'd want to see next time.
        It takes less than a minute and shapes what we build next.
      </p>
      <a href="${feedbackUrl}" class="cta">Share your reflection</a>
    </div>

    <p style="font-size:14px;color:#6b7280;line-height:1.7;text-align:center;">
      The next session is on its way. Stay connected with us on
      <a href="${SOCIAL_INSTAGRAM}" style="color:#1b3a2a;font-weight:600;">Instagram</a>
      for updates, behind-the-scenes moments, and when registration opens.
    </p>
  </div>
  <div class="footer">
    <p>You received this because you attended <strong>${d.eventTitle}</strong>.</p>
    <p>Questions? <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
    <p><a href="${SITE_URL}">${SITE_URL}</a> &nbsp;·&nbsp; ${EMAIL_FROM_NAME}</p>
  </div>
</div>
</body>
</html>`;
}

export function postEventEmailText(d: PostEventEmailData): string {
  const feedbackUrl = `${SITE_URL}/events/${d.eventSlug}`;
  return `${SITE_NAME} — Thank you for being there

Hi ${d.firstName},

We're glad you were part of ${d.eventTitle}${d.themeTitle ? ` — "${d.themeTitle}"` : ""}.
${d.themeScripture ? `Scripture: ${d.themeScripture}\n` : ""}
Something real happens when people gather with open hearts. Thank you for showing up.

How did it land for you?
Share your reflection here: ${feedbackUrl}

It takes less than a minute and helps shape what we build next.

Stay connected: ${SOCIAL_INSTAGRAM}

Questions? ${CONTACT_EMAIL}

— ${EMAIL_FROM_NAME}
${SITE_URL}
`;
}

export function ticketEmailText(d: TicketEmailData): string {
  const entryLine = d.isFree === false && d.priceKes
    ? `Ticket price: KES ${d.priceKes.toLocaleString()}. Please present this email or your ticket at the door.`
    : "Entry is free. Please present this email or your ticket at the door.";

  return `${SITE_NAME} — You're registered!

Hi ${d.firstName},

Your spot at ${d.eventTitle} is confirmed.
${d.themeTitle ? `\nSession theme: ${d.themeTitle}${d.themeScripture ? ` — ${d.themeScripture}` : ""}\n` : ""}
Date:  ${d.eventDate}
Time:  ${d.eventTime}pm${d.venueName ? `\nVenue: ${d.venueName}` : ""}

Ticket reference: ${d.ticketToken.slice(0, 8).toUpperCase()}
View ticket: ${d.ticketUrl}
${d.liveUrl ? `\nLive program (use on the night): ${d.liveUrl}` : ""}

${entryLine}
Doors open 30 minutes before the session begins.

Questions? ${CONTACT_EMAIL}

— ${EMAIL_FROM_NAME}
${SITE_URL}
`;
}
