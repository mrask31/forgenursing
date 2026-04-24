-- ============================================================================
-- ForgeNursing Quiz-First V1 Phase 1 — Database Migration
-- Status: NOT APPLIED — Run manually via Supabase SQL Editor
-- Date: 2026-04-24
-- ============================================================================

-- ============================================================================
-- 1. Profile Table Additions
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_first_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_entry_path TEXT DEFAULT NULL
    CHECK (default_entry_path IN ('quiz', 'tutor'));

-- ============================================================================
-- 2. New Table: quiz_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.student_classes(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'generic'
    CHECK (source_type IN ('document', 'generic', 'mixed')),
  nclex_category TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_status ON public.quiz_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON public.quiz_sessions(created_at);

-- RLS
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz sessions"
  ON public.quiz_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions"
  ON public.quiz_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz sessions"
  ON public.quiz_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. New Table: quiz_questions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_stem TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  user_answer TEXT CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  rationale_correct TEXT NOT NULL,
  rationale_incorrect JSONB NOT NULL,
  nclex_category TEXT,
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  source_doc_id TEXT,  -- stores documents.id (bigint cast to uuid by match_documents RPC); no FK to avoid type mismatch
  source_chunk_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,

  UNIQUE(session_id, question_index)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_session_id ON public.quiz_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_answered ON public.quiz_questions(session_id, answered_at);

-- RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE quiz_sessions.id = quiz_questions.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quiz questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE quiz_sessions.id = quiz_questions.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quiz questions"
  ON public.quiz_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE quiz_sessions.id = quiz_questions.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- End of migration. DO NOT apply automatically.
-- Run via Supabase SQL Editor after review.
-- ============================================================================
