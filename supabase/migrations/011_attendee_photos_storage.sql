-- Storage bucket for attendee photo submissions (live page photo sharing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendee-photos',
  'attendee-photos',
  false,              -- not public — served via signed URL or admin-only API
  2097152,            -- 2MB server-side limit (matches API route enforcement)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anon can INSERT (live attendees uploading photos — service_role key used in API, but bucket INSERT needed)
-- Note: actual upload goes through the API route which uses service_role, so bucket-level policies
-- are a secondary guard. The API route enforces 2MB + type checks before calling storage.
CREATE POLICY "attendee_photos_anon_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attendee-photos');

-- Only authenticated admins can read/delete objects
CREATE POLICY "attendee_photos_admin_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attendee-photos' AND
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "attendee_photos_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attendee-photos' AND
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- Vocalist name on session_songs (assigned for display during live event)
ALTER TABLE public.session_songs
  ADD COLUMN IF NOT EXISTS vocalist TEXT;
