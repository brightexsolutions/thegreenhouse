-- Migration 012: vocalist on session_songs + session_song_id on display_state
-- Allows per-session vocalist assignment and precise song-selection tracking.

-- 1. vocalist column on session_songs (already added in 011 as part of attendee_photos,
--    but included here idempotently in case that migration wasn't fully applied)
ALTER TABLE public.session_songs
  ADD COLUMN IF NOT EXISTS vocalist TEXT;

-- 2. session_song_id on display_state
--    Stores the session_songs.id of the currently active song so the control
--    can highlight the exact section the song was selected from, even if the
--    same song appears in multiple sections.
ALTER TABLE public.display_state
  ADD COLUMN IF NOT EXISTS session_song_id UUID REFERENCES public.session_songs(id) ON DELETE SET NULL;

-- Grant for anon + authenticated (Supabase May 2026+ explicit grant requirement)
GRANT SELECT ON public.session_songs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.display_state TO authenticated;

-- RLS: allow anon to read session_songs (needed for live attendee view)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_songs' AND policyname = 'anon can read session_songs'
  ) THEN
    CREATE POLICY "anon can read session_songs"
      ON public.session_songs FOR SELECT TO anon
      USING (true);
  END IF;
END $$;
