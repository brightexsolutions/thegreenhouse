-- Migration 021: add photo_consent to registrations
-- The registration form already captures this; column stores the result.
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS photo_consent BOOLEAN NOT NULL DEFAULT false;
