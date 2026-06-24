-- Track whether the pre-event reminder email has been dispatched for an event.
-- Prevents the daily cron from re-sending if it runs more than once on the same day.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reminder_email_sent BOOLEAN NOT NULL DEFAULT false;
