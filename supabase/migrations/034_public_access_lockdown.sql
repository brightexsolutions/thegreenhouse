-- 034: stop the public (anon) key reading secrets or writing around the API.
--
-- The anon key ships in the browser bundle, so anything it may do, anyone may
-- do with curl. Every write in the app goes through an API route using the
-- service role, which is unaffected by everything below.
--
-- APPLY ORDER: safe to run at any time against code from PR "security,
-- correctness and performance review" or later. The browser only ever reads
-- events with an explicit column list (display and control pages), all of
-- which stay granted here.

-- ── 1. Event tokens ─────────────────────────────────────────────────────────
-- events_public_read exposed every column of published/live/past events,
-- including checkin_token, control_token and the three contribution tokens.
-- With checkin_token alone, /api/checkin/[slug]/statuses returns every
-- registrant's name, email and phone.
--
-- Column privileges cannot depend on who is asking, so: the public policy is
-- narrowed to anon, anon gets a column list without the tokens, and signed-in
-- users are left to events_admin_all (is_admin()), which a self-registered
-- account does not pass.

DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_public_read ON public.events
  FOR SELECT TO anon
  USING (status IN ('published', 'live', 'past') AND deleted_at IS NULL);

REVOKE ALL ON public.events FROM anon;
GRANT SELECT (
  id, slug, title, subtitle, event_date, event_time, venue_name, venue_address,
  venue_map_url, type, price_kes, capacity, status, cover_image, banner_image,
  highlight_video, description, feedback_url, theme_title, theme_scripture,
  theme_description, theme_id, playlist_url, dress_code, early_bird_deadline,
  deleted_at, created_at, updated_at
) ON public.events TO anon;

-- ── 2. Direct writes that skip the API ──────────────────────────────────────
-- Each of these let anon write straight to a table, bypassing the route's
-- validation, capacity check, rate limit and live-only rules.

DROP POLICY IF EXISTS registrations_public_insert   ON public.registrations;
DROP POLICY IF EXISTS anon_insert_attendee_photos   ON public.attendee_photos;
DROP POLICY IF EXISTS trivia_responses_insert       ON public.trivia_responses;
DROP POLICY IF EXISTS anon_insert_feedback          ON public.feedback_submissions;
DROP POLICY IF EXISTS live_feedback_anon_insert     ON public.live_feedback;
DROP POLICY IF EXISTS service_insert_enquiries      ON public.enquiries;
DROP POLICY IF EXISTS prayer_public_insert          ON public.prayer_wall_entries;
DROP POLICY IF EXISTS mood_public_insert            ON public.mood_checkins;
DROP POLICY IF EXISTS attendee_photos_anon_insert   ON storage.objects;

-- Was FOR ALL TO authenticated USING (true): any signed-in account.
DROP POLICY IF EXISTS admin_all_attendee_photos ON public.attendee_photos;
CREATE POLICY admin_all_attendee_photos ON public.attendee_photos
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- anon needs SELECT on the tables the live pages read, and nothing else.
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> 'events'
  LOOP
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- Tables the public never reads at all.
REVOKE ALL ON public.registrations, public.communications_log, public.control_links,
              public.system_logs, public.enquiries, public.feedback_submissions,
              public.trivia_responses, public.attendance_badges
  FROM anon;

-- ── 3. Functions ────────────────────────────────────────────────────────────
ALTER FUNCTION public.is_admin()                     SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin()               SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column()     SET search_path = public, pg_temp;
ALTER FUNCTION public.touch_blog_post_updated_at()   SET search_path = public, pg_temp;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- ── 4. Policies that re-evaluated auth.uid() per row ────────────────────────
DROP POLICY IF EXISTS admin_read_feedback ON public.feedback_submissions;
CREATE POLICY admin_read_feedback ON public.feedback_submissions
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- ── 5. Indexes for the queries the live session actually runs ───────────────
CREATE INDEX IF NOT EXISTS idx_trivia_responses_round   ON public.trivia_responses(round_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_trivia_rounds_event      ON public.trivia_rounds(event_id);
CREATE INDEX IF NOT EXISTS idx_trivia_rounds_question   ON public.trivia_rounds(question_id);
CREATE INDEX IF NOT EXISTS idx_feedback_event           ON public.feedback_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_session_songs_song       ON public.session_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_comms_registration       ON public.communications_log(registration_id);
CREATE INDEX IF NOT EXISTS idx_events_theme             ON public.events(theme_id);
