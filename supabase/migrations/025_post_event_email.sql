-- Track whether the post-event thank-you email has been sent for each past event
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS post_event_email_sent BOOLEAN NOT NULL DEFAULT false;

GRANT UPDATE (post_event_email_sent) ON public.events TO authenticated;
