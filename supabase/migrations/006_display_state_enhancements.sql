-- Add theme and show_qr to display_state
ALTER TABLE public.display_state
  ADD COLUMN IF NOT EXISTS theme       TEXT    NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS show_qr     BOOLEAN NOT NULL DEFAULT false;

GRANT SELECT, INSERT, UPDATE ON public.display_state TO anon;
GRANT SELECT, INSERT, UPDATE ON public.display_state TO authenticated;
