-- Add author name alongside projected feedback on the display
ALTER TABLE public.display_state
  ADD COLUMN IF NOT EXISTS featured_feedback_author TEXT;

-- Attendee photo submissions
CREATE TABLE IF NOT EXISTS public.attendee_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  caption       TEXT,
  submitted_by  TEXT,           -- display name (optional, not linked to auth)
  is_approved   BOOLEAN NOT NULL DEFAULT false,
  show_on_site  BOOLEAN NOT NULL DEFAULT false,
  file_size_kb  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendee_photos_event_idx ON public.attendee_photos(event_id);
CREATE INDEX IF NOT EXISTS attendee_photos_approved_idx ON public.attendee_photos(event_id, is_approved, show_on_site);

-- RLS
ALTER TABLE public.attendee_photos ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT (submit photos)
CREATE POLICY "anon_insert_attendee_photos"
  ON public.attendee_photos FOR INSERT TO anon
  WITH CHECK (true);

-- Anon can SELECT only approved+show_on_site photos (for gallery page)
CREATE POLICY "anon_select_approved_photos"
  ON public.attendee_photos FOR SELECT TO anon
  USING (is_approved = true AND show_on_site = true);

-- Authenticated admins can do everything
CREATE POLICY "admin_all_attendee_photos"
  ON public.attendee_photos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Explicit GRANTs (Supabase May 2026+ requirement)
GRANT SELECT, INSERT ON public.attendee_photos TO anon;
GRANT ALL ON public.attendee_photos TO authenticated;
