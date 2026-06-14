-- Get Involved form submissions — persisted for admin review
CREATE TABLE IF NOT EXISTS public.enquiries (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT        NOT NULL,
  email        TEXT,
  phone        TEXT,
  interest     TEXT        NOT NULL,
  partner_type TEXT,
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Admins read all enquiries
CREATE POLICY "admins_read_enquiries"
  ON public.enquiries FOR SELECT
  USING (is_admin());

-- Service role inserts (API route uses admin client)
CREATE POLICY "service_insert_enquiries"
  ON public.enquiries FOR INSERT
  WITH CHECK (true);

GRANT SELECT             ON public.enquiries TO authenticated;
GRANT INSERT             ON public.enquiries TO anon;
GRANT INSERT             ON public.enquiries TO authenticated;
