-- ============================================================================
-- Answer Trap Check — Phase 2A Migration
-- Status: NOT APPLIED — Run manually via Supabase SQL Editor
-- Date: 2026-06-18
-- ============================================================================

-- ============================================================================
-- 1. Pre-generated question bank
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.answer_trap_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_stem TEXT NOT NULL,
  options JSONB NOT NULL,  -- [{label: "A", text: "..."}, ...]
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  trap_type TEXT NOT NULL,  -- internal mistake_type value
  trap_display_name TEXT NOT NULL,  -- e.g. "Assessment Trap"
  key_cue TEXT NOT NULL,
  why_correct_short TEXT NOT NULL,
  why_wrong_short TEXT NOT NULL,
  one_line_fix TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  nclex_category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answer_trap_questions_trap_type
  ON public.answer_trap_questions(trap_type);
CREATE INDEX IF NOT EXISTS idx_answer_trap_questions_active
  ON public.answer_trap_questions(is_active, trap_type);

-- RLS enabled — no public policies. All access via service role in API routes.
ALTER TABLE public.answer_trap_questions ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- Questions are only read server-side via service role key.

-- ============================================================================
-- 2. Anonymous session tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.answer_trap_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT NOT NULL,  -- random ID stored in cookie
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- null until signup
  questions JSONB NOT NULL DEFAULT '[]',  -- array of question IDs served
  answers JSONB NOT NULL DEFAULT '[]',  -- array of {question_id, selected_answer, is_correct, trap_type}
  detected_trap TEXT,  -- dominant trap_type from missed answers
  detected_trap_display TEXT,  -- display name e.g. "Assessment Trap"
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 3,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,  -- SHA-256 hashed IP for rate limiting (not raw IP)
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE INDEX IF NOT EXISTS idx_answer_trap_sessions_anonymous_id
  ON public.answer_trap_sessions(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_answer_trap_sessions_user_id
  ON public.answer_trap_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_trap_sessions_ip_hash
  ON public.answer_trap_sessions(ip_hash, created_at);

-- RLS enabled — no anon policies. All writes via service role in API routes.
ALTER TABLE public.answer_trap_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own claimed sessions only.
CREATE POLICY "Users can view own claimed answer trap sessions"
  ON public.answer_trap_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for browser clients.
-- All session creation, answer submission, completion, and claiming
-- happens exclusively through server-side API routes using service role.

-- ============================================================================
-- End of migration. DO NOT apply automatically.
-- Run via Supabase SQL Editor after review.
-- ============================================================================
