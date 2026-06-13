export type EventStatus   = "draft" | "published" | "live" | "past" | "cancelled";
export type EventType     = "free" | "paid";
export type SessionType   = "worship" | "prayer" | "sharing" | "teaching" | "open_mic" | "other";
export type RegistrantRole   = "guest" | "vocalist" | "instrumentalist" | "vision_carrier" | "curious";
export type RegistrantSource = "friend" | "whatsapp" | "instagram" | "church" | "website" | "other";
export type CommChannel   = "email" | "whatsapp";
export type CommStatus    = "pending" | "sent" | "failed";
export type AdminRole     = "admin" | "super_admin";

export interface Event {
  id:               string;
  slug:             string;
  title:            string;
  subtitle:         string | null;
  event_date:       string;    // ISO date
  event_time:       string;    // HH:MM:SS
  venue_name:       string | null;
  venue_address:    string | null;
  venue_map_url:    string | null;
  type:             EventType;
  price_kes:        number;
  capacity:         number | null;
  status:           EventStatus;
  cover_image:      string | null;  // poster — shown in event details section
  banner_image:     string | null;  // wide hero background — separate from poster
  highlight_video:  string | null;  // short looping clip shown on past event detail page
  description:      string | null;
  feedback_url:     string | null;
  theme_title:      string | null;
  theme_scripture:  string | null;
  theme_description:string | null;
  dress_code:       string | null;
  playlist_url:     string | null;
  checkin_token:         string | null;
  post_event_email_sent: boolean;
  deleted_at:            string | null;
  created_at:       string;
  updated_at:       string;
}

export interface EventImage {
  id:         string;
  event_id:   string;
  path:       string;
  caption:    string | null;
  sort_order: number;
  is_cover:   boolean;
  created_at: string;
}

export interface EventSession {
  id:           string;
  event_id:     string;
  title:        string;
  type:         SessionType;
  duration_min: number | null;
  notes:        string | null;
  sort_order:   number;
  deleted_at:   string | null;
  created_at:   string;
  updated_at:   string;
  // joined
  session_songs?: SessionSong[];
}

export interface Song {
  id:         string;
  title:      string;
  artist:     string | null;
  lyrics:     string | null;
  key:        string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSong {
  id:         string;
  session_id: string;
  song_id:    string;
  sort_order: number;
  song?:      Song;
}

export interface Registration {
  id:              string;
  event_id:        string;
  ticket_token:    string;
  first_name:      string;
  last_name:       string;
  email:           string | null;
  phone:           string | null;
  role:            RegistrantRole;
  source:          RegistrantSource | null;
  notes:           string | null;
  whatsapp_opt_in: boolean;
  ticket_sent:     boolean;
  checked_in:      boolean;
  deleted_at:      string | null;
  created_at:      string;
  updated_at:      string;
}

export interface CommunicationsLog {
  id:              string;
  event_id:        string | null;
  registration_id: string | null;
  channel:         CommChannel;
  recipient:       string;
  subject:         string | null;
  message_body:    string | null;
  status:          CommStatus;
  provider_id:     string | null;
  error_message:   string | null;
  sent_at:         string | null;
  created_at:      string;
}

export interface AdminProfile {
  id:         string;
  full_name:  string;
  avatar_url: string | null;
  role:       AdminRole;
  created_at: string;
}

export interface PrayerWallEntry {
  id:          string;
  event_id:    string;
  content:     string;
  author_name: string | null;
  is_approved: boolean;
  created_at:  string;
}

export interface MoodCheckin {
  id:         string;
  event_id:   string;
  emoji:      string;
  created_at: string;
}

export interface DisplayState {
  id:           string;
  event_id:     string;
  scene:        "branding" | "countdown" | "now_playing" | "lyrics" | "program" | "theme" | "prayer" | "community" | "interlude" | "custom";
  song_id:      string | null;
  verse_index:  number;
  custom_text:  string | null;
  updated_at:   string;
}
