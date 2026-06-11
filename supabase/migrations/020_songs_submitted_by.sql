-- Migration 020: add submitted_by column to songs table
-- Required by the song contribution page which credits the vocalist who submitted a song.
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS submitted_by TEXT;
