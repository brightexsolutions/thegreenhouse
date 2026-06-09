-- ─── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Updated-at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─── ENUMs ──────────────────────────────────────────────────────────────────
CREATE TYPE event_status      AS ENUM ('draft','published','live','past','cancelled');
CREATE TYPE event_type        AS ENUM ('free','paid');
CREATE TYPE session_type      AS ENUM ('worship','prayer','sharing','teaching','open_mic','other');
CREATE TYPE registrant_role   AS ENUM ('guest','vocalist','instrumentalist','vision_carrier','curious');
CREATE TYPE registrant_source AS ENUM ('friend','whatsapp','instagram','church','website','other');
CREATE TYPE comm_channel      AS ENUM ('email','whatsapp');
CREATE TYPE comm_status       AS ENUM ('pending','sent','failed');
CREATE TYPE admin_role        AS ENUM ('admin','super_admin');
CREATE TYPE log_level         AS ENUM ('debug','info','warn','error');
CREATE TYPE log_category      AS ENUM ('cron','auth','comms','api','storage','admin');

-- ─── admin_profiles ─────────────────────────────────────────────────────────
CREATE TABLE public.admin_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role       admin_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── events ─────────────────────────────────────────────────────────────────
CREATE TABLE public.events (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT        NOT NULL UNIQUE,
  title             TEXT        NOT NULL,
  subtitle          TEXT,
  event_date        DATE        NOT NULL,
  event_time        TIME        NOT NULL,
  venue_name        TEXT,
  venue_address     TEXT,
  venue_map_url     TEXT,
  type              event_type  NOT NULL DEFAULT 'free',
  price_kes         INTEGER     NOT NULL DEFAULT 0,
  capacity          INTEGER,
  status            event_status NOT NULL DEFAULT 'draft',
  cover_image       TEXT,
  description       TEXT,
  feedback_url      TEXT,
  theme_title       TEXT,
  theme_scripture   TEXT,
  theme_description TEXT,
  playlist_url      TEXT,
  checkin_token     UUID        UNIQUE DEFAULT uuid_generate_v4(),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_events_slug   ON public.events(slug);
CREATE INDEX idx_events_status ON public.events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_date   ON public.events(event_date DESC) WHERE deleted_at IS NULL;

-- ─── event_images ────────────────────────────────────────────────────────────
CREATE TABLE public.event_images (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  path       TEXT NOT NULL,
  caption    TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_images_event ON public.event_images(event_id);

-- ─── event_sessions ──────────────────────────────────────────────────────────
CREATE TABLE public.event_sessions (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     UUID         NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title        TEXT         NOT NULL,
  type         session_type NOT NULL DEFAULT 'worship',
  duration_min INTEGER,
  notes        TEXT,
  sort_order   INTEGER      NOT NULL DEFAULT 0,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_event_sessions_event ON public.event_sessions(event_id, sort_order)
  WHERE deleted_at IS NULL;

-- ─── songs ───────────────────────────────────────────────────────────────────
CREATE TABLE public.songs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  artist     TEXT,
  lyrics     TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_songs_updated_at BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_songs_title ON public.songs USING gin(title gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- ─── session_songs ───────────────────────────────────────────────────────────
CREATE TABLE public.session_songs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  song_id    UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_session_songs_unique ON public.session_songs(session_id, song_id);
CREATE INDEX idx_session_songs_session ON public.session_songs(session_id, sort_order);

-- ─── registrations ───────────────────────────────────────────────────────────
CREATE TABLE public.registrations (
  id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID             NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_token    UUID             NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  first_name      TEXT             NOT NULL,
  last_name       TEXT             NOT NULL,
  email           TEXT,
  phone           TEXT,
  role            registrant_role  NOT NULL DEFAULT 'guest',
  source          registrant_source,
  notes           TEXT,
  whatsapp_opt_in BOOLEAN          NOT NULL DEFAULT false,
  ticket_sent     BOOLEAN          NOT NULL DEFAULT false,
  checked_in      BOOLEAN          NOT NULL DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
  CONSTRAINT chk_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE TRIGGER trg_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_registrations_event ON public.registrations(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_registrations_token ON public.registrations(ticket_token);
CREATE UNIQUE INDEX idx_registrations_event_email
  ON public.registrations(event_id, email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_registrations_event_phone
  ON public.registrations(event_id, phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;

-- ─── communications_log ──────────────────────────────────────────────────────
CREATE TABLE public.communications_log (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID         REFERENCES public.events(id) ON DELETE SET NULL,
  registration_id UUID         REFERENCES public.registrations(id) ON DELETE SET NULL,
  channel         comm_channel NOT NULL,
  recipient       TEXT         NOT NULL,
  subject         TEXT,
  message_body    TEXT,
  status          comm_status  NOT NULL DEFAULT 'pending',
  provider_id     TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_comms_event  ON public.communications_log(event_id);
CREATE INDEX idx_comms_status ON public.communications_log(status);

-- ─── prayer_wall_entries ─────────────────────────────────────────────────────
CREATE TABLE public.prayer_wall_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 280),
  author_name TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prayer_wall_event ON public.prayer_wall_entries(event_id, is_approved);

-- ─── mood_checkins ───────────────────────────────────────────────────────────
CREATE TABLE public.mood_checkins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mood_event ON public.mood_checkins(event_id);

-- ─── attendance_badges ───────────────────────────────────────────────────────
CREATE TABLE public.attendance_badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  badge_type      TEXT NOT NULL,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_badges_registration ON public.attendance_badges(registration_id);

-- ─── display_state ───────────────────────────────────────────────────────────
CREATE TABLE public.display_state (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  scene       TEXT NOT NULL DEFAULT 'branding',
  song_id     UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  verse_index INTEGER NOT NULL DEFAULT 0,
  custom_text TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── system_logs ─────────────────────────────────────────────────────────────
CREATE TABLE public.system_logs (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  level      log_level    NOT NULL DEFAULT 'info',
  category   log_category NOT NULL,
  message    TEXT         NOT NULL,
  metadata   JSONB,
  admin_id   UUID         REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_system_logs_level    ON public.system_logs(level);
CREATE INDEX idx_system_logs_category ON public.system_logs(category);
CREATE INDEX idx_system_logs_created  ON public.system_logs(created_at DESC);

-- ─── site_settings ───────────────────────────────────────────────────────────
CREATE TABLE public.site_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
