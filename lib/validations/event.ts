import { z } from "zod";

export const eventSchema = z.object({
  slug:              z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens"),
  title:             z.string().min(1, "Title is required").max(120),
  subtitle:          z.string().max(200).optional(),
  event_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  event_time:        z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format"),
  venue_name:        z.string().max(120).optional(),
  venue_address:     z.string().max(255).optional(),
  venue_map_url:     z.string().url().optional().or(z.literal("")),
  type:              z.enum(["free", "paid"]).default("free"),
  price_kes:         z.number().int().min(0).default(0),
  capacity:          z.number().int().min(1).optional(),
  status:            z.enum(["draft", "published", "live", "past", "cancelled"]).default("draft"),
  description:       z.string().max(2000).optional(),
  feedback_url:      z.string().url().optional().or(z.literal("")),
  theme_title:       z.string().max(100).optional(),
  theme_scripture:   z.string().max(100).optional(),
  theme_description: z.string().max(1000).optional(),
  playlist_url:      z.string().url().optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventSchema>;
