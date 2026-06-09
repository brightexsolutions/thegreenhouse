-- ─── Seed: Session 01 (past) ────────────────────────────────────────────────
INSERT INTO public.events (
  slug, title, subtitle, event_date, event_time, venue_name,
  type, status, description
) VALUES (
  'session-01',
  'The Green House — Session 01',
  'Inaugural Worship & Sharing Evening',
  '2025-03-28',
  '19:00:00',
  'Nairobi',
  'free',
  'past',
  'The inaugural gathering of The Green House community. A low-pressure evening of worship, prayer, and genuine connection across Nairobi churches.'
) ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: Session 02 (upcoming) ────────────────────────────────────────────
INSERT INTO public.events (
  slug, title, subtitle, event_date, event_time, venue_name,
  type, status, description,
  theme_title, theme_scripture, theme_description
) VALUES (
  'session-02',
  'The Green House — Session 02',
  'Worship & Sharing Evening',
  '2026-06-26',
  '19:00:00',
  'TBA',
  'free',
  'published',
  'The second gathering of The Green House. Come as you are. Low pressure. Real connection.',
  'Delusion',
  '2 Timothy 4:3-6',
  'A conversation about truth, comfort, and what we choose to hear.'
) ON CONFLICT (slug) DO NOTHING;

-- ─── Seed: Site settings defaults ────────────────────────────────────────────
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name',       'The Green House'),
  ('contact_email',   'hello@thegreenhouseke.com'),
  ('whatsapp_number', '254700000000'),
  ('instagram_handle',''),
  ('twitter_handle',  '')
ON CONFLICT (key) DO NOTHING;
