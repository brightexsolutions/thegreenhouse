-- 033: close the admin self-promotion hole.
--
-- admin_profiles_self was FOR ALL with USING/WITH CHECK (id = auth.uid()),
-- on a table with full write grants to anon and authenticated. Any signed-in
-- user could therefore UPDATE their own row to role = 'super_admin', and
-- because email signup is open on the project, anyone at all could sign up
-- and INSERT a super_admin row for themselves.
--
-- Every legitimate write to this table goes through the service role
-- (app/api/admin/system/admins), which bypasses RLS and these grants. The only
-- thing a signed-in user needs is to read their own row (middleware.ts).

DROP POLICY IF EXISTS admin_profiles_self ON public.admin_profiles;

CREATE POLICY admin_profiles_self_read ON public.admin_profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

REVOKE ALL ON public.admin_profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.admin_profiles FROM authenticated;
