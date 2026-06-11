-- Trivia questions library (reusable across events)
CREATE TABLE IF NOT EXISTS public.trivia_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT        NOT NULL,
  type          TEXT        NOT NULL DEFAULT 'multiple_choice'
                            CHECK (type IN ('multiple_choice', 'open_input')),
  options       JSONB,                 -- ["Opt A", "Opt B", "Opt C", "Opt D"] for MC
  correct_index INT,                   -- 0-based index into options (MC only)
  hint          TEXT,
  category      TEXT        DEFAULT 'fun'
                            CHECK (category IN ('scripture', 'worship', 'community', 'fun', 'general')),
  points        INT         NOT NULL DEFAULT 10,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- Active trivia rounds — one per question launch per event
CREATE TABLE IF NOT EXISTS public.trivia_rounds (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question_id    UUID        NOT NULL REFERENCES public.trivia_questions(id),
  status         TEXT        NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'revealing', 'closed')),
  timer_seconds  INT,                   -- optional countdown in seconds
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendee responses per round
CREATE TABLE IF NOT EXISTS public.trivia_responses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID        NOT NULL REFERENCES public.trivia_rounds(id) ON DELETE CASCADE,
  attendee_name TEXT,
  answer_text   TEXT        NOT NULL,
  answer_index  INT,                    -- MC: which option index (0-based)
  is_correct    BOOLEAN,                -- MC: null for open_input
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extend display_state to track which trivia round is active
ALTER TABLE public.display_state
  ADD COLUMN IF NOT EXISTS trivia_round_id UUID REFERENCES public.trivia_rounds(id);

-- RLS
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_rounds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_responses ENABLE ROW LEVEL SECURITY;

-- trivia_questions: public read, admin write
CREATE POLICY "trivia_questions_public_read"
  ON public.trivia_questions FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "trivia_questions_admin_write"
  ON public.trivia_questions FOR ALL
  USING (is_admin());

-- trivia_rounds: public read, admin write
CREATE POLICY "trivia_rounds_public_read"
  ON public.trivia_rounds FOR SELECT
  USING (true);

CREATE POLICY "trivia_rounds_admin_write"
  ON public.trivia_rounds FOR ALL
  USING (is_admin());

-- trivia_responses: anyone can insert, admins can read
CREATE POLICY "trivia_responses_insert"
  ON public.trivia_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "trivia_responses_admin_read"
  ON public.trivia_responses FOR SELECT
  USING (is_admin());

-- Explicit GRANTs (required for Supabase projects created after May 2026)
GRANT SELECT           ON public.trivia_questions TO anon, authenticated;
GRANT SELECT           ON public.trivia_rounds    TO anon, authenticated;
GRANT INSERT           ON public.trivia_responses TO anon, authenticated;
GRANT ALL              ON public.trivia_questions TO authenticated;
GRANT ALL              ON public.trivia_rounds    TO authenticated;
GRANT SELECT           ON public.trivia_responses TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sample trivia questions (safe to run multiple times — skips if already seeded)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.trivia_questions LIMIT 1) THEN

    -- Scripture category
    INSERT INTO public.trivia_questions (question, type, options, correct_index, hint, category, points) VALUES
    (
      'Which book of the Bible contains the verse "Be still and know that I am God"?',
      'multiple_choice',
      '["Psalms", "Proverbs", "Isaiah", "Jeremiah"]',
      0,
      'It''s one of the most quoted books in worship',
      'scripture',
      10
    ),
    (
      'How many books are in the New Testament?',
      'multiple_choice',
      '["24", "27", "39", "66"]',
      1,
      'Think about the number of books just in the NT',
      'scripture',
      10
    ),
    (
      'Who wrote most of the New Testament epistles?',
      'multiple_choice',
      '["Peter", "John", "Paul", "Luke"]',
      2,
      'He was once called Saul',
      'scripture',
      10
    ),
    (
      'Complete this verse: "For God so loved the world that He gave His only begotten Son, that whoever ___"',
      'open_input',
      NULL,
      NULL,
      'John 3:16 — one of the most memorised verses',
      'scripture',
      15
    ),

    -- Worship category
    (
      'Which of these is a worship song by Hillsong Worship?',
      'multiple_choice',
      '["Oceans", "Way Maker", "Goodness of God", "Build My Life"]',
      0,
      'Think about a famous song involving walking on water',
      'worship',
      10
    ),
    (
      'Who originally recorded the worship song "Waymaker"?',
      'multiple_choice',
      '["Sinach", "CeCe Winans", "Tasha Cobbs", "Elevation Worship"]',
      0,
      'She is a Nigerian gospel artist',
      'worship',
      10
    ),
    (
      'What year was the song "Good Good Father" released?',
      'multiple_choice',
      '["2014", "2015", "2016", "2017"]',
      1,
      'It was in the mid 2010s',
      'worship',
      15
    ),
    (
      'Name one worship song that has meant something to you recently.',
      'open_input',
      NULL,
      NULL,
      NULL,
      'worship',
      10
    ),

    -- Community category
    (
      'How many churches are typically represented at a Green House session?',
      'multiple_choice',
      '["1–2", "3–5", "5–10", "10+"]',
      2,
      'Think cross-church community',
      'community',
      10
    ),
    (
      'The Green House sessions happen how often?',
      'multiple_choice',
      '["Weekly", "Monthly", "Quarterly", "Annually"]',
      2,
      'Less frequent than you might think',
      'community',
      10
    ),
    (
      'What city is The Green House based in?',
      'multiple_choice',
      '["Mombasa", "Nairobi", "Kisumu", "Nakuru"]',
      1,
      'The capital city',
      'community',
      5
    ),
    (
      'What is one word that describes your experience at The Green House so far?',
      'open_input',
      NULL,
      NULL,
      NULL,
      'community',
      10
    ),

    -- Fun category
    (
      'If worship had a flavour, what would it be?',
      'multiple_choice',
      '["Honey", "Bread", "Water", "Wine"]',
      0,
      'Think about sweetness and the Psalms',
      'fun',
      5
    ),
    (
      'Which of these is NOT a book of the Bible?',
      'multiple_choice',
      '["Obadiah", "Enoch", "Nahum", "Habakkuk"]',
      1,
      'One of these is from the Apocrypha, not the canon',
      'fun',
      15
    ),
    (
      'How many Psalms are in the Bible?',
      'multiple_choice',
      '["100", "119", "150", "155"]',
      2,
      'More than 100, less than 155',
      'fun',
      10
    ),
    (
      'Finish the lyric: "You are the strength of my heart and my ___"',
      'open_input',
      NULL,
      NULL,
      'Psalm 73:26',
      'fun',
      10
    );

  END IF;
END $$;
