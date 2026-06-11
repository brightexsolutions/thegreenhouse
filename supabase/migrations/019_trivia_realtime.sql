-- Enable full row data in WAL for trivia_rounds so UPDATE events carry the full
-- new row (not just the PK). Required for Supabase Realtime filters to work.
ALTER TABLE public.trivia_rounds REPLICA IDENTITY FULL;

-- Add trivia_rounds to the supabase_realtime publication so attendee/display
-- pages get instant round-status changes (active → revealing → closed) via
-- Realtime instead of waiting for the next poll cycle.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication
    WHERE pubname = 'supabase_realtime' AND puballtables = true
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.trivia_rounds;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END IF;
END $$;
