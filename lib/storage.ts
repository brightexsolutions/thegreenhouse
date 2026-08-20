/**
 * Cache-Control for Supabase Storage uploads.
 *
 * Every upload path in this project names its file with a UUID, so the bytes
 * behind a given URL never change. The old value was one hour, which meant the
 * same unchanged image was fetched from origin over and over. Egress is
 * metered on the free tier, and that kind of repeat traffic is what emptied
 * the Cloudinary credits.
 */
export const IMMUTABLE_CACHE = "31536000";
