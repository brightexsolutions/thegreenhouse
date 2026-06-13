-- Highlight video for past events — short looping clip shown on the event detail page
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS highlight_video TEXT;

GRANT UPDATE (highlight_video) ON public.events TO authenticated;
