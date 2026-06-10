-- Live feedback submitted by attendees from /live/[slug] during the event
CREATE TABLE IF NOT EXISTS public.live_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 280),
  author_name TEXT,                   -- NULL = anonymous
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_feedback_event_id_created_idx
  ON public.live_feedback (event_id, created_at DESC);

-- Add featured_feedback to display_state so the control panel can push
-- a selected attendee message onto the projection display as an overlay
ALTER TABLE public.display_state
  ADD COLUMN IF NOT EXISTS featured_feedback TEXT;

-- Grants (Supabase May 2026+ explicit grant requirement)
GRANT SELECT, INSERT              ON public.live_feedback  TO anon;
GRANT SELECT, INSERT, UPDATE      ON public.live_feedback  TO authenticated;
GRANT SELECT, INSERT, UPDATE      ON public.display_state  TO anon;
GRANT SELECT, INSERT, UPDATE      ON public.display_state  TO authenticated;
