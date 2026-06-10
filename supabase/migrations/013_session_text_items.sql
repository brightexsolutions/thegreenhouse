-- Migration 013: non-song items in session_songs
-- Allows adding quotes, topics, and text discussion points to session programs
-- alongside songs. song_id becomes nullable; item_type distinguishes rows.

-- 1. Make song_id nullable
ALTER TABLE public.session_songs
  ALTER COLUMN song_id DROP NOT NULL;

-- 2. Add item_type (default 'song' keeps all existing rows valid)
ALTER TABLE public.session_songs
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'song';

-- 3. Add item_text for non-song items
ALTER TABLE public.session_songs
  ADD COLUMN IF NOT EXISTS item_text TEXT;

-- 4. Drop old unique index (requires non-null song_id)
DROP INDEX IF EXISTS idx_session_songs_unique;

-- 5. Partial unique index — only one copy of a given song per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_songs_unique_song
  ON public.session_songs(session_id, song_id)
  WHERE song_id IS NOT NULL;

-- 6. Grants (idempotent)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_songs TO authenticated;
GRANT SELECT ON public.session_songs TO anon;
