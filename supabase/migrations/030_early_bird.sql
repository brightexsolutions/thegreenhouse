-- Early bird announcement feature
-- Adds early_bird_deadline to events and is_early_bird flag to registrations

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS early_bird_deadline TIMESTAMPTZ;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS is_early_bird BOOLEAN NOT NULL DEFAULT false;

-- Grant access on new columns (Supabase new-project requirement)
GRANT SELECT (early_bird_deadline) ON public.events TO anon, authenticated;
GRANT SELECT, UPDATE (is_early_bird) ON public.registrations TO authenticated;
