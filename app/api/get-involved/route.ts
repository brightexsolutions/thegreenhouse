import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/constants";

const schema = z.object({
  full_name:  z.string().min(2).max(120),
  email:      z.string().email(),
  phone:      z.string().max(30).optional(),
  interest:   z.enum(["worship_team", "host_venue", "vision_carrier", "creative_team", "attend", "other"]),
  message:    z.string().max(400).optional(),
});

const INTEREST_LABELS: Record<string, string> = {
  worship_team:   "Worship team",
  host_venue:     "Host a venue",
  vision_carrier: "Vision Carrier",
  creative_team:  "Creative team",
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

  try {
    // Send notification email via Resend
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? `${SITE_NAME} <hello@thegreenhouseke.com>`,
      to:   [CONTACT_EMAIL],
      subject: `New involvement enquiry — ${d.full_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a18">
          <h2 style="color:#1b3a2a;margin-bottom:4px">New involvement enquiry</h2>
          <p style="color:#666;margin-top:0">via The Green House website</p>
          <table style="width:100%;border-collapse:collapse;margin-top:20px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:140px">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600">${d.full_name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="mailto:${d.email}" style="color:#1b3a2a">${d.email}</a></td></tr>
            ${d.phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee">${d.phone}</td></tr>` : ""}
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">Interest</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#c9a24a">${INTEREST_LABELS[d.interest] ?? d.interest}</td></tr>
            ${d.message ? `<tr><td style="padding:10px 0;color:#666;vertical-align:top">Message</td><td style="padding:10px 0;white-space:pre-wrap">${d.message}</td></tr>` : ""}
          </table>
        </div>
      `,
    });

    logger.info("get_involved_submission", { name: d.full_name, interest: d.interest });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error("get_involved_email_failed", { error: String(err) });
    return NextResponse.json({ error: "Unable to send your message. Please try again." }, { status: 500 });
  }
}
