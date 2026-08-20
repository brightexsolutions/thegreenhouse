-- ─────────────────────────────────────────────────────────────────────────────
-- Green House: outstanding database work as of 2026-08-20
--
-- Paste into the Supabase SQL editor and run. Migrations 001 through 030 were
-- verified as already applied, so nothing below re-runs old work.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Create the blog ───────────────────────────────────────────────────────
-- This is supabase/migrations/031_blog.sql. The blog code is deployed but the
-- table does not exist yet, so /blog and /admin/blog will error until this runs.
--
-- Run the contents of supabase/migrations/031_blog.sql here.
-- It is kept in its own file so the migration history stays intact.


-- ── 2. Clear the last dead Cloudinary URL ────────────────────────────────────
-- The Cloudinary account was deleted, so this URL returns 401. It is the only
-- Cloudinary reference left anywhere in the database: every event cover, every
-- banner and all 35 event_images rows are already on Supabase Storage.
--
-- Check what is there before changing it:
SELECT slug, title, highlight_video
FROM public.events
WHERE highlight_video ILIKE '%cloudinary%';

-- Expected: one row, session-01, pointing at
-- https://res.cloudinary.com/dpjget2he/video/upload/v1781371203/greenhouse-session-1-ewe-yesu_g3yorq.mp4
--
-- Clearing it stops the event page rendering a player that cannot load.
-- Uncomment to apply:
--
-- UPDATE public.events
--    SET highlight_video = NULL
--  WHERE highlight_video ILIKE '%cloudinary%';
--
-- When the Session 01 recording exists on YouTube, set it to the embed URL
-- instead of NULL and EventHighlightVideo will use the YouTube player:
--
-- UPDATE public.events
--    SET highlight_video = 'https://www.youtube.com/embed/VIDEO_ID'
--  WHERE slug = 'session-01';


-- ── 3. Optional: verify nothing else points at a dead host ───────────────────
SELECT 'events'       AS source, slug AS ref, highlight_video AS url
  FROM public.events        WHERE highlight_video ILIKE '%cloudinary%'
UNION ALL
SELECT 'events.cover',  slug, cover_image
  FROM public.events        WHERE cover_image     ILIKE '%cloudinary%'
UNION ALL
SELECT 'events.banner', slug, banner_image
  FROM public.events        WHERE banner_image    ILIKE '%cloudinary%'
UNION ALL
SELECT 'event_images',  id::text, path
  FROM public.event_images  WHERE path            ILIKE '%cloudinary%'
UNION ALL
SELECT 'site_settings', key, value
  FROM public.site_settings WHERE value           ILIKE '%cloudinary%';

-- Expected after step 2: zero rows.
