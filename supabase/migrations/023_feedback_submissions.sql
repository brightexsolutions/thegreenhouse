CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name        TEXT,
  message     TEXT NOT NULL,
  attended    BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (anon insert)
CREATE POLICY "anon_insert_feedback"
  ON public.feedback_submissions FOR INSERT TO anon
  WITH CHECK (true);

-- Admins can read all feedback
CREATE POLICY "admin_read_feedback"
  ON public.feedback_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

GRANT INSERT ON public.feedback_submissions TO anon;
GRANT SELECT ON public.feedback_submissions TO authenticated;
