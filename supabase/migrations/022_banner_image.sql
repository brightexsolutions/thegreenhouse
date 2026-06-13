-- Add banner_image column to events
-- banner_image: wide landscape photo used as hero background
-- cover_image:  portrait/square poster shown in event details section
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image TEXT;

GRANT UPDATE (banner_image) ON public.events TO authenticated;
