-- ─── Storage buckets ────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('event-images',  'event-images',  true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('ticket-assets', 'ticket-assets', false, 5242880,  ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ─── event-images: public read, admin write ──────────────────────────────────
CREATE POLICY "event_images_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "event_images_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "event_images_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' AND
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
  );

-- ticket-assets: service role only (no public RLS policies — accessed via service_role key in API)
