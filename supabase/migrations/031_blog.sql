-- Blog posts. Public-facing articles used to keep the site fresh for search
-- and to give returning visitors a reason to come back between sessions.
--
-- content is markdown, authored in the admin panel and rendered server-side.
-- meta_title / meta_description override the derived title and excerpt in
-- <head> when the author wants search copy that differs from the on-page copy.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        NOT NULL UNIQUE,
  title            TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  excerpt          TEXT        CHECK (excerpt IS NULL OR char_length(excerpt) <= 320),
  content          TEXT        NOT NULL,
  cover_image      TEXT,
  cover_alt        TEXT,
  author_name      TEXT        NOT NULL DEFAULT 'The Green House',
  category         TEXT        NOT NULL DEFAULT 'reflection'
                               CHECK (category IN ('reflection','session-recap','teaching','community','announcement')),
  tags             TEXT[]      NOT NULL DEFAULT '{}',
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','published')),
  meta_title       TEXT        CHECK (meta_title IS NULL OR char_length(meta_title) <= 70),
  meta_description TEXT        CHECK (meta_description IS NULL OR char_length(meta_description) <= 170),
  reading_minutes  INTEGER     NOT NULL DEFAULT 1,
  view_count       INTEGER     NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- The public index and sitemap both read published posts newest first.
CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts (status, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);

-- Keep updated_at honest so sitemap lastmod means something to crawlers.
CREATE OR REPLACE FUNCTION public.touch_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_touch_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_blog_post_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors see published, non-deleted posts only. Drafts stay private.
CREATE POLICY "blog_public_read_published" ON public.blog_posts
  FOR SELECT TO anon
  USING (status = 'published' AND deleted_at IS NULL);

-- Admins (a row in admin_profiles) get everything, drafts included.
CREATE POLICY "blog_admin_all" ON public.blog_posts
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── GRANTs (required for new Supabase projects May 2026+) ───────────────────
GRANT SELECT ON public.blog_posts TO anon;
GRANT ALL    ON public.blog_posts TO authenticated;
