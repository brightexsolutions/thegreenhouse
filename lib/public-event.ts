import type { Event } from "@/types/database";

/**
 * Every `events` column that is safe to send to a browser.
 *
 * The public pages used to `select("*")` and hand the whole row to client
 * components, which serialised the check-in, control and contribution tokens
 * into the page HTML for anyone to read. Select this list instead whenever an
 * event row can reach a visitor, and add new columns here deliberately.
 *
 * Never add: checkin_token, control_token, song_submission_token,
 * theme_contribution_token, trivia_contribution_token.
 */
export const PUBLIC_EVENT_COLUMNS = [
  "id",
  "slug",
  "title",
  "subtitle",
  "event_date",
  "event_time",
  "venue_name",
  "venue_address",
  "venue_map_url",
  "type",
  "price_kes",
  "capacity",
  "status",
  "cover_image",
  "banner_image",
  "highlight_video",
  "description",
  "feedback_url",
  "theme_id",
  "theme_title",
  "theme_scripture",
  "theme_description",
  "dress_code",
  "playlist_url",
  "early_bird_deadline",
  "post_event_email_sent",
  "reminder_email_sent",
  "deleted_at",
  "created_at",
  "updated_at",
].join(", ");

/** An event row with every secret token removed. */
export type PublicEvent = Omit<
  Event,
  | "checkin_token"
  | "control_token"
  | "song_submission_token"
  | "theme_contribution_token"
  | "trivia_contribution_token"
> & {
  theme_id?:            string | null;
  reminder_email_sent?: boolean;
};
