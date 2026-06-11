-- Song: track who submitted it via the contribute link
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS submitted_by TEXT;  -- vocalist name from contribute page

-- Open-input trivia: correct answer + keywords for fuzzy matching
ALTER TABLE public.trivia_questions
  ADD COLUMN IF NOT EXISTS correct_answer   TEXT,    -- reference answer for open_input
  ADD COLUMN IF NOT EXISTS answer_keywords  TEXT;    -- comma-separated keywords (all must appear)

-- Open-input responses can now be auto-scored; allow admin override
ALTER TABLE public.trivia_responses
  ADD COLUMN IF NOT EXISTS admin_override   BOOLEAN; -- super admin can flip is_correct

-- Standalone themes library
CREATE TABLE IF NOT EXISTS public.themes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  scripture   TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- Events can reference a theme from the library
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "themes_public_read"
  ON public.themes FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "themes_admin_write"
  ON public.themes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON public.themes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.themes TO authenticated;
