-- ─── Enable RLS on all tables ───────────────────────────────────────────────
ALTER TABLE public.admin_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_songs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_wall_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_state        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings        ENABLE ROW LEVEL SECURITY;

-- ─── Helper functions ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND role = 'super_admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── events ─────────────────────────────────────────────────────────────────
CREATE POLICY "events_public_read" ON public.events
  FOR SELECT USING (status IN ('published','live','past') AND deleted_at IS NULL);
CREATE POLICY "events_admin_all" ON public.events
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "events_superadmin_deleted" ON public.events
  FOR SELECT USING (is_super_admin());

-- ─── event_images ────────────────────────────────────────────────────────────
CREATE POLICY "event_images_public_read" ON public.event_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id
            AND e.status IN ('published','live','past') AND e.deleted_at IS NULL)
  );
CREATE POLICY "event_images_admin_all" ON public.event_images
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── event_sessions ──────────────────────────────────────────────────────────
CREATE POLICY "sessions_public_read" ON public.event_sessions
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id
            AND e.status IN ('published','live','past') AND e.deleted_at IS NULL)
  );
CREATE POLICY "sessions_admin_all" ON public.event_sessions
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── songs ───────────────────────────────────────────────────────────────────
CREATE POLICY "songs_public_read" ON public.songs
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "songs_admin_all" ON public.songs
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── session_songs ───────────────────────────────────────────────────────────
CREATE POLICY "session_songs_public_read" ON public.session_songs FOR SELECT USING (true);
CREATE POLICY "session_songs_admin_all"   ON public.session_songs
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── registrations ───────────────────────────────────────────────────────────
CREATE POLICY "registrations_public_insert" ON public.registrations
  FOR INSERT WITH CHECK (true);
-- Token-based reads are handled via service-role in API routes; admin sees all
CREATE POLICY "registrations_admin_all" ON public.registrations
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── communications_log ──────────────────────────────────────────────────────
CREATE POLICY "comms_admin_all" ON public.communications_log
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── prayer_wall_entries ─────────────────────────────────────────────────────
CREATE POLICY "prayer_public_read_approved" ON public.prayer_wall_entries
  FOR SELECT USING (is_approved = true);
CREATE POLICY "prayer_public_insert" ON public.prayer_wall_entries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "prayer_admin_all" ON public.prayer_wall_entries
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── mood_checkins ───────────────────────────────────────────────────────────
CREATE POLICY "mood_public_insert" ON public.mood_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "mood_admin_read"    ON public.mood_checkins FOR SELECT USING (is_admin());

-- ─── attendance_badges ───────────────────────────────────────────────────────
CREATE POLICY "badges_admin_all" ON public.attendance_badges
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── display_state ───────────────────────────────────────────────────────────
-- Public can read so the display screen works without auth
CREATE POLICY "display_public_read" ON public.display_state FOR SELECT USING (true);
CREATE POLICY "display_admin_all"   ON public.display_state
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── system_logs ─────────────────────────────────────────────────────────────
CREATE POLICY "logs_superadmin_all" ON public.system_logs
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- ─── site_settings ───────────────────────────────────────────────────────────
CREATE POLICY "settings_public_read"    ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings_superadmin_all" ON public.site_settings
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- ─── admin_profiles ─────────────────────────────────────────────────────────
CREATE POLICY "admin_profiles_self"        ON public.admin_profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admin_profiles_superadmin"  ON public.admin_profiles
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- ─── GRANTs (required for new Supabase projects May 2026+) ──────────────────
GRANT SELECT                         ON public.events              TO anon, authenticated;
GRANT SELECT                         ON public.event_images        TO anon, authenticated;
GRANT SELECT                         ON public.event_sessions      TO anon, authenticated;
GRANT SELECT                         ON public.songs               TO anon, authenticated;
GRANT SELECT                         ON public.session_songs       TO anon, authenticated;
GRANT SELECT                         ON public.prayer_wall_entries TO anon, authenticated;
GRANT SELECT                         ON public.display_state       TO anon, authenticated;
GRANT SELECT                         ON public.site_settings       TO anon, authenticated;
GRANT INSERT                         ON public.registrations       TO anon, authenticated;
GRANT INSERT                         ON public.prayer_wall_entries TO anon, authenticated;
GRANT INSERT                         ON public.mood_checkins       TO anon, authenticated;
GRANT ALL                            ON public.events              TO authenticated;
GRANT ALL                            ON public.event_images        TO authenticated;
GRANT ALL                            ON public.event_sessions      TO authenticated;
GRANT ALL                            ON public.songs               TO authenticated;
GRANT ALL                            ON public.session_songs       TO authenticated;
GRANT ALL                            ON public.registrations       TO authenticated;
GRANT ALL                            ON public.communications_log  TO authenticated;
GRANT ALL                            ON public.prayer_wall_entries TO authenticated;
GRANT ALL                            ON public.mood_checkins       TO authenticated;
GRANT ALL                            ON public.attendance_badges   TO authenticated;
GRANT ALL                            ON public.display_state       TO authenticated;
GRANT ALL                            ON public.system_logs         TO authenticated;
GRANT ALL                            ON public.site_settings       TO authenticated;
GRANT ALL                            ON public.admin_profiles      TO authenticated;
