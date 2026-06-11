-- Attach an optional trivia question to each program section so the
-- evening's trivia can be planned in advance alongside the program.
ALTER TABLE public.event_sessions
  ADD COLUMN IF NOT EXISTS trivia_question_id UUID
    REFERENCES public.trivia_questions(id) ON DELETE SET NULL;
