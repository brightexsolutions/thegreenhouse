export const SITE_NAME        = "The Green House";
export const SITE_URL         = process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenhousews.co.ke";
export const SESSION_FREQUENCY = "quarterly";

export const GOOGLE_SITE_VERIFICATION = "VF6ZtFBVZPyZxr2XDozrNRD_U1Tuy6B69pJp7gERino";

export const CONTACT_EMAIL    = "hello@greenhousews.co.ke";
export const REPLY_TO_EMAIL   = "thegreenhouse.contact01@gmail.com";
export const CONTACT_WHATSAPP = "254706609085";

export const SOCIAL_INSTAGRAM = "https://instagram.com/thegreenhouseke";
export const SOCIAL_TIKTOK    = "https://tiktok.com/@thegreenhouseke";
export const SOCIAL_YOUTUBE   = "https://youtube.com/@thegreenhouseke";

/** Build a WhatsApp link with optional pre-filled message */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT_WHATSAPP}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Supabase storage CDN URL with optional transform params */
export function storageUrl(path: string, params?: { width?: number; quality?: number }): string {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
  if (!params) return `${base}/${path}`;
  const q = new URLSearchParams();
  if (params.width)   q.set("width",   String(params.width));
  if (params.quality) q.set("quality", String(params.quality));
  return `${base}/${path}?${q.toString()}`;
}
