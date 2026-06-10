-- Add song submission token to events (auto-generated UUID for all rows)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS song_submission_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Ensure uniqueness for lookup
CREATE UNIQUE INDEX IF NOT EXISTS events_song_submission_token_idx ON public.events (song_submission_token);

GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.songs TO anon;
