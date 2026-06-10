-- ─── Add dress_code to events ────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS dress_code TEXT;

-- ─── Backfill Session 02 dress code ──────────────────────────────────────────
UPDATE public.events
SET dress_code = 'Smart casual — come comfortable, come yourself.'
WHERE slug = 'session-02' AND dress_code IS NULL;
