-- Granular control panel access links per event.
-- Each link has a label, its own revocable token, and a permissions array.
-- Permissions values: 'full' | 'music' | 'scenes' | 'trivia' | 'feedback'
CREATE TABLE IF NOT EXISTS public.control_links (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  label       TEXT        NOT NULL DEFAULT 'Team member',
  permissions TEXT[]      NOT NULL DEFAULT '{full}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_control_links_event  ON public.control_links(event_id);
CREATE INDEX idx_control_links_token  ON public.control_links(token);

ALTER TABLE public.control_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "control_links_admin_all" ON public.control_links
  USING (is_admin()) WITH CHECK (is_admin());

GRANT ALL ON public.control_links TO authenticated;
