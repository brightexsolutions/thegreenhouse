-- Security hardening, 2026-08-20.
--
-- Two gaps found while auditing the platform:
--   1. live_feedback was the only table of 23 with RLS never enabled, while
--      still granting SELECT to anon. Any visitor could read every event's
--      feedback straight off the REST API, and any signed-in user could
--      rewrite it.
--   2. display_state grants INSERT and UPDATE to anon. RLS blocks it today
--      because no permissive anon write policy exists, but the grant
--      contradicts the control-link permission model entirely: one added
--      policy would hand the projection screen to anyone on the internet.

-- ── 1. live_feedback ─────────────────────────────────────────────────────────
ALTER TABLE public.live_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_feedback_anon_insert" ON public.live_feedback;
DROP POLICY IF EXISTS "live_feedback_admin_all"   ON public.live_feedback;

-- Attendees submit during a session but never read the room back.
-- The live page and the control panel both read through the service-role
-- client in the API layer, which is not subject to RLS.
CREATE POLICY "live_feedback_anon_insert" ON public.live_feedback
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "live_feedback_admin_all" ON public.live_feedback
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- anon keeps INSERT only. The SELECT and UPDATE grants go.
REVOKE SELECT, UPDATE ON public.live_feedback FROM anon;
REVOKE UPDATE           ON public.live_feedback FROM authenticated;
GRANT  INSERT           ON public.live_feedback TO anon;
GRANT  SELECT, UPDATE, DELETE ON public.live_feedback TO authenticated;


-- ── 2. display_state ─────────────────────────────────────────────────────────
-- Reading is fine: the projection screen and every attendee device poll it.
-- Writing is not: that goes through /api/live/[slug]/display, which checks a
-- control-link token or an admin session and then writes with the service role.
REVOKE INSERT, UPDATE ON public.display_state FROM anon;
GRANT  SELECT         ON public.display_state TO anon;


-- ── 3. Verify ────────────────────────────────────────────────────────────────
-- Every table in public should now report rowsecurity = true.
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND rowsecurity = false
 ORDER BY tablename;
-- Expected: zero rows.
