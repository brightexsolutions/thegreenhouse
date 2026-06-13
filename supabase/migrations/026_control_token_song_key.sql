-- Control panel access token (allows non-admin members to access the control page)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS control_token TEXT;
GRANT UPDATE (control_token) ON public.events TO authenticated;

-- Musical key on songs (e.g. "G", "Bb", "F#m")
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS key TEXT;
GRANT UPDATE (key) ON public.songs TO authenticated;
