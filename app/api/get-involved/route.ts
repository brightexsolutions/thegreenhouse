import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { normalisePhone } from "@/lib/phone";
import { logger } from "@/lib/logger";
import { SITE_NAME, SITE_URL, CONTACT_EMAIL, REPLY_TO_EMAIL } from "@/lib/constants";

const schema = z.object({
  full_name:    z.string().min(2).max(120).transform(s => s.trim()),
  email:        z.string().email(),
  phone:        z.string().max(30).optional().transform(v => v?.trim() ? normalisePhone(v.trim()) : undefined),
  interest:     z.enum(["worship_team", "host_venue", "vision_carrier", "creative_team", "partner", "give", "attend", "other"]),
  partner_type: z.string().max(120).optional().transform(v => v?.trim() || undefined),
  message:      z.string().max(400).optional().transform(v => v?.trim() || undefined),
});

const INTEREST_LABELS: Record<string, string> = {
  worship_team:   "Worship team",
  host_venue:     "Host a venue",
  vision_carrier: "Vision Carrier",
  creative_team:  "Creative team",
  partner:        "Partnership",
  give:           "Financial support",
  attend:         "Attend sessions",
  other:          "Other",
};

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "public");
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 422 });
  }

  const d = parsed.data;
  const interestLabel = INTEREST_LABELS[d.interest] ?? d.interest;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
    const from   = process.env.RESEND_FROM_EMAIL ?? `${SITE_NAME} <hello@greenhousews.co.ke>`;

    // Notification to team
    await resend.emails.send({
      from,
      to:      [CONTACT_EMAIL],
      replyTo: d.email,
      subject: `New involvement enquiry — ${d.full_name} (${interestLabel})`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a18">
          <h2 style="color:#1b3a2a;margin-bottom:4px">New involvement enquiry</h2>
          <p style="color:#666;margin-top:0">via The Green House website</p>
          <table style="width:100%;border-collapse:collapse;margin-top:20px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:140px">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${d.full_name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="mailto:${d.email}" style="color:#1b3a2a">${d.email}</a></td></tr>
            ${d.phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee">${d.phone}</td></tr>` : ""}
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Interest</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#c9a24a">${interestLabel}</td></tr>
            ${d.partner_type ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Partnership type</td><td style="padding:10px 0;border-bottom:1px solid #eee">${d.partner_type}</td></tr>` : ""}
            ${d.message ? `<tr><td style="padding:10px 0;color:#666;vertical-align:top">Message</td><td style="padding:10px 0;white-space:pre-wrap">${d.message}</td></tr>` : ""}
          </table>
        </div>
      `,
    });

    // Confirmation to submitter
    await resend.emails.send({
      from,
      to:      [d.email],
      replyTo: REPLY_TO_EMAIL,
      subject: `We've received your message — ${SITE_NAME}`,
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>body{margin:0;padding:0;background:#f0ebe0;font-family:Arial,sans-serif;color:#1a1a18}.wrap{max-width:560px;margin:0 auto}.header{background:#1b3a2a;padding:36px 40px 28px;border-radius:16px 16px 0 0}.logo{color:#c9a24a;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700}.header h1{color:#f7f2e8;font-size:26px;font-weight:700;margin:12px 0 0}.body{background:#fff;border-radius:0 0 16px 16px;padding:28px 40px 36px}.footer{text-align:center;padding:20px 40px;font-size:13px;color:#6b7280}.footer a{color:#c9a24a;text-decoration:none}</style>
</head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">${SITE_NAME}</div>
    <h1>Thanks, ${d.full_name.split(" ")[0]}.</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;line-height:1.7;margin-bottom:20px">
      We've received your message and someone from the team will be in touch soon.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;width:130px;font-size:13px">Interest</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;font-size:14px">${interestLabel}</td></tr>
      ${d.partner_type ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:13px">Partnership type</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px">${d.partner_type}</td></tr>` : ""}
      ${d.message ? `<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;vertical-align:top">Your message</td><td style="padding:10px 0;font-size:14px;white-space:pre-wrap">${d.message}</td></tr>` : ""}
    </table>
    <p style="font-size:13px;color:#6b7280;line-height:1.6">In the meantime, feel free to attend an upcoming session — no commitment needed.</p>
    <a href="${SITE_URL}/events" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#1b3a2a;color:#f7f2e8;text-decoration:none;border-radius:100px;font-size:14px;font-weight:600">See upcoming sessions →</a>
  </div>
  <div class="footer">
    <p>Questions? <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
    <p><a href="${SITE_URL}">${SITE_URL}</a> · ${SITE_NAME}</p>
  </div>
</div>
</body></html>`,
    });

    logger.info("get_involved_submission", { name: d.full_name, interest: d.interest });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error("get_involved_email_failed", { error: String(err) });
    return NextResponse.json({ error: "Unable to send your message. Please try again." }, { status: 500 });
  }
}
