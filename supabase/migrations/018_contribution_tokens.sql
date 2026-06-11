-- Add contribution tokens for theme and trivia contributors
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS theme_contribution_token  UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS trivia_contribution_token UUID DEFAULT gen_random_uuid();

-- Backfill any existing rows that have NULL
UPDATE public.events
  SET theme_contribution_token  = gen_random_uuid()
  WHERE theme_contribution_token IS NULL;

UPDATE public.events
  SET trivia_contribution_token = gen_random_uuid()
  WHERE trivia_contribution_token IS NULL;

-- Unique indexes so lookups are fast and tokens are unguessable
CREATE UNIQUE INDEX IF NOT EXISTS events_theme_contribution_token_idx
  ON public.events(theme_contribution_token);

CREATE UNIQUE INDEX IF NOT EXISTS events_trivia_contribution_token_idx
  ON public.events(trivia_contribution_token);

-- anon can read event info via these tokens (used by contribute pages — no admin login required)
GRANT SELECT ON public.events        TO anon;
GRANT SELECT ON public.themes        TO anon;
GRANT SELECT ON public.trivia_questions TO anon;
GRANT INSERT ON public.trivia_questions TO anon;
