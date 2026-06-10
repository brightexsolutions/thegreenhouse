-- Walk-in attendees: people who show up without registering online.
-- Allow registrations with no email/phone when is_walkin = true.
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS is_walkin BOOLEAN NOT NULL DEFAULT false;

-- Drop old contact constraint, replace with walkin-aware version
ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS chk_contact;

ALTER TABLE public.registrations
  ADD CONSTRAINT chk_contact
    CHECK (email IS NOT NULL OR phone IS NOT NULL OR is_walkin = true);

-- Walk-ins are created via the check-in tool (token-gated), not the public register API.
-- They get checked_in = true at creation time.
-- Source is stored as 'other'; role defaults to 'guest'.

GRANT SELECT, INSERT ON public.registrations TO anon;
