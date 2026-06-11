-- Enable full row data in WAL for display_state UPDATE events.
-- Without REPLICA IDENTITY FULL, the WAL record for UPDATE only stores the PK
-- in the "old" tuple — Supabase Realtime needs the full row to apply
-- client-side filters and populate payload.new completely.
ALTER TABLE public.display_state REPLICA IDENTITY FULL;

-- Add display_state to the supabase_realtime publication so that Postgres
-- WAL changes are broadcast to Realtime subscribers.
-- Guard: skip if the publication uses FOR ALL TABLES (puballtables = true),
--        or if the table is already listed explicitly.
DO $$
BEGIN
  -- Only attempt ADD TABLE when the publication is NOT "all tables"
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication
    WHERE pubname = 'supabase_realtime' AND puballtables = true
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.display_state;
    EXCEPTION
      WHEN duplicate_object THEN NULL;  -- already in publication
      WHEN undefined_object THEN NULL;  -- publication doesn't exist
    END;
  END IF;
END $$;
