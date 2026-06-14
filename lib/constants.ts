export const SITE_NAME        = "The Green House W.S";
export const EMAIL_FROM_NAME  = "Green House Worship Community";
export const SITE_URL         = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.greenhousews.co.ke";
export const SESSION_FREQUENCY = "quarterly";

export const GOOGLE_SITE_VERIFICATION = "VF6ZtFBVZPyZxr2XDozrNRD_U1Tuy6B69pJp7gERino";

export const CONTACT_EMAIL    = "thegreenhouse.contact01@gmail.com";
export const REPLY_TO_EMAIL   = "thegreenhouse.contact01@gmail.com";
export const CONTACT_WHATSAPP          = "254706609085";
export const REGISTRATION_SUPPORT_WA   = "254741980127";

// Resend FROM addresses — tickets get their own mailbox, everything else goes through hello
export const TICKET_FROM_EMAIL = () => process.env.RESEND_TICKET_FROM  ?? `${EMAIL_FROM_NAME} <tickets@greenhousews.co.ke>`;
export const COMMS_FROM_EMAIL  = () => process.env.RESEND_COMMS_FROM   ?? `${EMAIL_FROM_NAME} <hello@greenhousews.co.ke>`;

// Session highlight videos — update per session after event
export const SESSION_01_HIGHLIGHT_VIDEO = "https://res.cloudinary.com/dpjget2he/video/upload/v1781371203/greenhouse-session-1-ewe-yesu_g3yorq.mp4";
export const SESSION_01_UMWEMA_VIDEO    = "https://res.cloudinary.com/dpjget2he/video/upload/v1781426590/greenhouse-session-1-umwema_znsmuo.mp4";
export const SESSION_01_EBENEZER_VIDEO  = "https://res.cloudinary.com/dpjget2he/video/upload/v1781434031/greenhouse-session1-Wewe_ni_Ebenezer_yzbimx.mp4";

export const SOCIAL_INSTAGRAM = "https://instagram.com/thegreenhouseke";
export const SOCIAL_TIKTOK    = "https://tiktok.com/@thegreenhouseke";
export const SOCIAL_YOUTUBE   = "https://youtube.com/@thegreenhouseke";

/** Partners & Supporters — add new entries here as they come on board.
 *  logoUrl: public URL to partner logo image (PNG/SVG with transparency ideal).
 *           If null, the partner name is displayed large instead.
 */
export const PARTNERS: Array<{
  name:        string;
  role:        string;
  description: string | null;
  logoUrl:     string | null;
  url:         string | null;
}> = [
  {
    name:        "Brightex Solutions",
    role:        "Web & Technology Services for Greenhouse",
    description: "Building and maintaining the platform behind The Green House.",
    logoUrl:     null,
    url:         "https://brightexsolutions.co.ke",
  },
  {
    name:        "Glace Confectionary",
    role:        "Cakes, Cookies for Events",
    description: "Cakes, cookies, and treats that make every session sweeter.",
    logoUrl:     null,
    url:         null,
  },
];

/** Build a WhatsApp link with optional pre-filled message */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT_WHATSAPP}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Supabase storage CDN URL.
 *  When transform params are supplied, uses the /render/image/ endpoint so
 *  Supabase handles resizing — not Vercel. This avoids consuming Vercel's
 *  Image Optimization quota. Always pair the returned URL with unoptimized
 *  on the Next.js <Image> component.
 */
export function storageUrl(path: string, params?: { width?: number; quality?: number }): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!params) return `${supabaseUrl}/storage/v1/object/public/${path}`;
  const q = new URLSearchParams();
  if (params.width)   q.set("width",   String(params.width));
  if (params.quality) q.set("quality", String(params.quality));
  // /render/image/public/ is the Supabase transform endpoint (free tier supported)
  return `${supabaseUrl}/storage/v1/render/image/public/${path}?${q.toString()}`;
}
