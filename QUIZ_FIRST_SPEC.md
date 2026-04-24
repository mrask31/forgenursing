# ForgeNursing Quiz-First Entry Path — Product Specification

**Status:** APPROVED — Implementation Authorized (V1 Phase 1 only)  
**Date:** 2026-04-24  
**Author:** Engineering  
**Version:** 1.1 — Revisions applied, product decisions documented

---

## Executive Summary

ForgeNursing has 33 real users. Only 2 have returned after signup day. The hypothesis: nursing students expect Qbank-style practice (UWorld, ATI, Kaplan) and bounce when they see a Socratic tutor. This spec adds a **quiz-first entry path** — an NCLEX-style question bank powered by the same Claude AI and uploaded materials that drive the tutor. The existing `/tutor` route is untouched. This is purely additive.

The hidden moat: every wrong answer links to the tutor with full context. Quiz is the hook; clinical reasoning tutor is the retention engine.

---

## Table of Contents

1. [User Flows](#section-1-user-flows)
2. [Architecture & Routes](#section-2-architecture--routes)
3. [Database Schema](#section-3-database-schema)
4. [Prompt Engineering](#section-4-prompt-engineering)
5. [UX Specification](#section-5-ux-specification)
6. [Analytics (PostHog)](#section-6-analytics-posthog)
7. [Rollout Plan](#section-7-rollout-plan)
8. [Edge Cases](#section-8-edge-cases)
9. [Risk Assessment](#section-9-risk-assessment)
10. [Open Questions for Product Owner](#section-10-open-questions-for-product-owner)

---

## Section 1: User Flows

### 1.1 New Signup — First Login (quiz_first_enabled = true)

```
Signup → Email verification → Auth callback → Middleware checks hasAccess()
  → PHI acknowledgment modal (existing, if phi_acknowledged_at is null)
  → Program level selection modal (existing, if program_level is null)
  → NEW: Entry Choice Screen (/entry)
      ┌─────────────────────────────────────┐
      │  "How do you want to study today?"  │
      │                                     │
      │  [📝 Practice Questions]            │
      │   NCLEX-style quiz from your        │
      │   materials or general topics       │
      │                                     │
      │  [💬 AI Tutor]                      │
      │   Socratic clinical reasoning       │
      │   tutor (existing experience)       │
      │                                     │
      │  ☐ Remember my choice              │
      └─────────────────────────────────────┘
  → User picks "Practice Questions" → /quiz
  → User picks "AI Tutor" → /tutor (existing, unchanged)
```

If "Remember my choice" is checked, `default_entry_path` is set on the profiles table. Future logins skip the entry screen and go directly to the saved path.

### 1.2 Existing User — Next Login After Quiz-First Ships

```
Login → Middleware checks hasAccess() → checks quiz_first_enabled on profile
  → IF quiz_first_enabled = true AND default_entry_path is null:
      → /entry (Entry Choice Screen, same as 1.1)
  → IF quiz_first_enabled = true AND default_entry_path = 'quiz':
      → /quiz
  → IF quiz_first_enabled = true AND default_entry_path = 'tutor':
      → /tutor
  → IF quiz_first_enabled = false:
      → /tutor (current behavior, no change)
```

Feature flag `quiz_first_enabled` is set per-user on the profiles table. Rollout controls who sees the new path.

### 1.3 Quiz Path — With Uploaded Documents

```
/quiz → Quiz Setup Screen
  → System detects user has documents in the documents table
  → Shows: "Quiz from your materials" (default selected)
  → Shows: "General NCLEX practice" (alternative)
  → Optional: Select specific class/document to focus on
  → User taps "Start Quiz" → 10-question session begins
  → Questions generated from user's uploaded material via RAG
  → Each question: clinical scenario stem + 4 options (A-D)
  → User selects answer → immediate feedback (rationale screen)
  → After 10 questions → Results Screen
```

### 1.4 Quiz Path — Without Uploaded Documents

```
/quiz → Quiz Setup Screen
  → System detects NO documents uploaded
  → Shows upload banner: "Upload your course materials for personalized questions"
      → Banner links to /binder (existing upload flow)
  → Default: "General NCLEX practice" (auto-selected, only option)
  → Optional: Select NCLEX category focus
      (Safe & Effective Care, Health Promotion, Psychosocial, Physiological)
  → User taps "Start Quiz" → 10-question session begins
  → Questions generated from NCLEX blueprint (generic prompt)
  → Same flow as 1.3 from here
```

### 1.5 User Gets Question Wrong → Rationale → "Dig Deeper with Tutor"

```
User selects wrong answer → Rationale Screen (incorrect variant)
  ┌──────────────────────────────────────────┐
  │  ✗ Incorrect — The correct answer is B   │
  │                                          │
  │  WHY B IS CORRECT:                       │
  │  [2-3 sentence rationale]                │
  │                                          │
  │  WHY YOUR ANSWER (C) IS WRONG:           │
  │  [1-2 sentence explanation]              │
  │                                          │
  │  ─────────────────────────────────────── │
  │  🧠 Want to understand the reasoning?    │
  │  [Dig Deeper with Tutor →]               │
  │  ─────────────────────────────────────── │
  │                                          │
  │  [Next Question →]                       │
  └──────────────────────────────────────────┘

"Dig Deeper with Tutor" →
  → Saves quiz progress (current question index, session_id)
  → Opens /tutor?intent=dig-deeper&quizSessionId={id}&questionId={id}
  → Tutor receives full context: question stem, user's wrong answer,
    correct answer, rationale, source document (if any)
  → Tutor opens with: "Let's work through why [correct answer] is right.
    Walk me through your thinking when you chose [user's answer]."
  → User can return to quiz via "Back to Quiz" button in tutor header
  → Quiz resumes at next question
```

### 1.6 User Completes 10 Questions → Results Screen

```
Question 10 answered → Results Screen (/quiz/results?sessionId={id})
  ┌──────────────────────────────────────────┐
  │  Quiz Complete!                          │
  │                                          │
  │  Score: 7/10 (70%)                       │
  │  ████████░░░ 70%                         │
  │                                          │
  │  By Category:                            │
  │  • Pharmacology: 3/4                     │
  │  • Priority Setting: 2/3                 │
  │  • Safety: 2/3                           │
  │                                          │
  │  Questions you missed:                   │
  │  Q3 — Beta blocker hold criteria         │
  │    [Review →] [Dig Deeper with Tutor →]  │
  │  Q5 — Fluid overload priority            │
  │    [Review →] [Dig Deeper with Tutor →]  │
  │  Q9 — Delegation to UAP                  │
  │    [Review →] [Dig Deeper with Tutor →]  │
  │                                          │
  │  [Start New Quiz]  [Back to Home]        │
  └──────────────────────────────────────────┘
```

### 1.7 User Abandons Mid-Quiz → Resume on Return

```
User closes browser / navigates away during question 6 of 10
  → quiz_sessions.status remains 'in_progress'
  → quiz_questions tracks which questions are answered (answered_at not null)

User returns to /quiz →
  → System checks for in_progress session
  → Shows resume banner:
      "You have an unfinished quiz (6/10 complete). Resume or start fresh?"
      [Resume Quiz]  [Start New Quiz]
  → Resume: loads session, jumps to question 7
  → Start New: marks old session as 'abandoned', creates new session
```

### 1.8 Mode Switching Between Quiz and Tutor

```
From Quiz → Tutor:
  → Via "Dig Deeper" link on rationale screen (context-rich handoff)
  → Via nav menu: "Switch to Tutor" (no context, fresh tutor session)
  → Quiz progress is always saved; user can return

From Tutor → Quiz:
  → Via nav menu: "Switch to Practice Questions"
  → If in_progress quiz exists: offer resume
  → If no in_progress quiz: go to quiz setup

Nav menu (persistent across both modes):
  ┌─────────────────┐
  │ 📝 Quiz         │  ← highlighted when on /quiz
  │ 💬 Tutor        │  ← highlighted when on /tutor
  │ 📁 Binder       │  ← existing
  │ ⚙️ Settings     │  ← existing
  └─────────────────┘
```

---

## Section 2: Architecture & Routes

### 2.1 New Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/entry` | Entry choice screen (quiz vs tutor) | Yes + hasAccess() |
| `/quiz` | Quiz setup + active quiz session | Yes + hasAccess() |
| `/quiz/results` | Results screen after quiz completion | Yes + hasAccess() |

### 2.2 Entry Flow Decision Tree

```
middleware.ts (modified entry logic only)
  │
  ├─ User has quiz_first_enabled = false?
  │   └─ → /tutor (current behavior, zero changes)
  │
  ├─ User has quiz_first_enabled = true?
  │   ├─ default_entry_path = 'quiz'?  → /quiz
  │   ├─ default_entry_path = 'tutor'? → /tutor
  │   └─ default_entry_path = null?    → /entry
  │
  └─ Feature flag not present on profile?
      └─ → /tutor (safe default)
```

Middleware changes are minimal: after the existing `hasAccess()` check passes, add a single branch that reads `quiz_first_enabled` and `default_entry_path` from the profile query (which already fetches `subscription_status`, `trial_ends_at`, `is_beta`, `beta_expires_at`). Two additional columns in the same SELECT. No new queries.

### 2.3 Feature Flag: `quiz_first_enabled`

- Column on `profiles` table: `quiz_first_enabled BOOLEAN DEFAULT false`
- Controlled via Supabase admin or migration script during rollout phases
- When `false`: user never sees quiz path, middleware routes to `/tutor` as today
- When `true`: user enters the quiz-first flow (entry screen or saved preference)
- Rollback: `UPDATE profiles SET quiz_first_enabled = false` — instant revert

### 2.4 Component Tree

```
src/app/(app)/
├── entry/
│   └── page.tsx              ← NEW: Entry choice screen
│       └── EntryChoiceClient.tsx  ← NEW: Client component
│
├── quiz/
│   ├── page.tsx              ← NEW: Quiz setup + session
│   │   └── QuizPageClient.tsx     ← NEW: Client component
│   ├── results/
│   │   └── page.tsx          ← NEW: Results screen
│   │       └── QuizResultsClient.tsx ← NEW: Client component
│   └── components/
│       ├── QuizSetup.tsx     ← NEW: Category/document selection
│       ├── QuizQuestion.tsx  ← NEW: Question display + answer selection
│       ├── QuizRationale.tsx ← NEW: Correct/incorrect rationale display
│       ├── QuizProgress.tsx  ← NEW: Progress bar (e.g., "Question 4 of 10")
│       └── QuizResults.tsx   ← NEW: Score breakdown + missed question list
│
├── tutor/                    ← EXISTING: No changes to tutor components
│   └── (all existing files unchanged)
│
src/lib/ai/
├── system-prompt.ts          ← EXISTING: Unchanged
├── prompts.ts                ← EXISTING: Unchanged
├── quiz-prompts.ts           ← NEW: Quiz question generation prompts
│
src/app/api/
├── quiz/
│   ├── generate/
│   │   └── route.ts          ← NEW: POST — generate single question
│   ├── sessions/
│   │   └── route.ts          ← NEW: POST (create), GET (list/resume)
│   └── answer/
│       └── route.ts          ← NEW: POST — submit answer, get rationale
│
src/components/
├── quiz/                     ← NEW: Shared quiz UI components
│   └── (see above)
├── tutor/                    ← EXISTING: Unchanged
└── ui/                       ← EXISTING: Shared (Button, Dialog, etc.)
```

**Shared with /tutor:** All `src/components/ui/*` components (Button, Dialog, ScrollArea, etc.), `src/lib/supabase/*` client utilities, `src/lib/subscription-access.ts`, PostHog analytics wrapper.

**Not shared:** Quiz components are entirely new. No tutor components are imported by quiz. No quiz components are imported by tutor. Clean separation.

### 2.5 Existing Routes — No Modifications

The following routes are NOT modified beyond the middleware entry logic:

- `/tutor` — all tutor functionality unchanged
- `/binder` — document upload unchanged (quiz reads from same documents table)
- `/classes` — class management unchanged
- `/settings` — add "Default study mode" preference (quiz/tutor toggle)
- `/onboarding` — unchanged
- All API routes under `/api/chat/*` — unchanged

---

## Section 3: Database Schema

### 3.1 New Table: `quiz_sessions`

```sql
CREATE TABLE public.quiz_sessions (
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
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_user_status ON public.quiz_sessions(user_id, status);
CREATE INDEX idx_quiz_sessions_created_at ON public.quiz_sessions(created_at);

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
```

### 3.2 New Table: `quiz_questions`

```sql
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_stem TEXT NOT NULL,
  options JSONB NOT NULL,
    -- Format: [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, ...]
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  user_answer TEXT CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  rationale_correct TEXT NOT NULL,
  rationale_incorrect JSONB NOT NULL,
    -- Format: {"A": "...", "B": "...", "C": "...", "D": "..."}
    -- Each key explains why that option is wrong (or right for correct answer)
  nclex_category TEXT,
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  source_doc_id TEXT,  -- stores documents.id (bigint cast to uuid by RPC); no FK
  source_chunk_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,

  UNIQUE(session_id, question_index)
);

-- Indexes
CREATE INDEX idx_quiz_questions_session_id ON public.quiz_questions(session_id);
CREATE INDEX idx_quiz_questions_answered ON public.quiz_questions(session_id, answered_at);

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
```

### 3.3 Profile Table Additions

```sql
-- Add columns to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_first_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_entry_path TEXT DEFAULT NULL
    CHECK (default_entry_path IN ('quiz', 'tutor'));
```

### 3.4 Future Rate Limiting Accommodation

```sql
-- Not created at launch. Schema reserved for Phase 2+ rate limiting.
-- When needed:

-- CREATE TABLE public.quiz_rate_limits (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now()),
--   questions_generated INTEGER NOT NULL DEFAULT 0,
--   max_questions INTEGER NOT NULL DEFAULT 100,
--   UNIQUE(user_id, period_start)
-- );
--
-- CREATE INDEX idx_quiz_rate_limits_user_period
--   ON public.quiz_rate_limits(user_id, period_start);

-- Rate check function (future):
-- SELECT questions_generated < max_questions
-- FROM quiz_rate_limits
-- WHERE user_id = $1 AND period_start = date_trunc('day', now());
```

The `quiz_questions` table naturally supports rate limiting queries without a dedicated table:
```sql
-- Count questions generated today for a user
SELECT COUNT(*) FROM quiz_questions qq
JOIN quiz_sessions qs ON qq.session_id = qs.id
WHERE qs.user_id = $1
AND qq.created_at >= date_trunc('day', now());
```

---

## Section 4: Prompt Engineering

> **This is the most critical section.** Question quality determines whether quiz-first retains users or accelerates churn. Every prompt below is production-ready text.

### 4.1 NCLEX Question Generation Prompt — From Uploaded Material

**Model:** Claude Sonnet (via `@ai-sdk/anthropic`, Vercel AI SDK `streamText` or `generateText`)  
**Max tokens:** ~800 per question  
**Estimated cost:** $0.003–0.005 per question (~$0.03–0.05 per 10-question quiz)

```
SYSTEM PROMPT — QUIZ QUESTION GENERATOR (DOCUMENT-BASED)

<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions from nursing course materials. You are NOT a tutor — you are an exam item writer. Your questions must be clinically accurate, appropriately difficult, and follow NCLEX item-writing standards.
</identity>

<program_level>
{{PROGRAM_LEVEL_BLOCK}}
</program_level>

<source_material>
The following is an excerpt from the student's uploaded course material. Generate a question DIRECTLY from this content. The question must test a concept that appears in this material.

---
{{DOCUMENT_CHUNK_TEXT}}
---
</source_material>

<previous_questions>
The following question stems have already been used in this quiz session. Do NOT repeat or closely paraphrase any of them. Generate a meaningfully different question.

{{PREVIOUS_QUESTION_STEMS_JSON}}
</previous_questions>

<instructions>
Generate exactly ONE NCLEX-style multiple-choice question following these rules:

QUESTION STEM RULES:
- Write a clinical scenario in 2-3 sentences. Include a patient (age, relevant history, presenting signs/symptoms).
- End with a clear, single-action question: "Which action should the nurse take FIRST?" or "Which finding should the nurse report IMMEDIATELY?" or similar NCLEX phrasing.
- Do NOT use "all of the above" or "none of the above."
- Do NOT use negative stems ("Which is NOT correct?") unless testing safety (e.g., contraindications).

ANSWER OPTIONS RULES:
- Provide exactly 4 options labeled A through D.
- Exactly 1 option is correct. The other 3 are plausible distractors.
- Distractors must reflect COMMON STUDENT MISCONCEPTIONS, not obviously wrong answers.
- Each option should be similar in length (within ~20% word count of each other).
- Options should be grammatically parallel.
- Randomize the position of the correct answer (do not always put it in B or C).

RATIONALE RULES:
- rationale_correct: 2-3 sentences explaining WHY the correct answer is right. Reference the clinical reasoning (ABCs, Maslow, safety, assessment-before-intervention).
- rationale_incorrect: For EACH wrong option, 1-2 sentences explaining WHY it's wrong AND what misconception it targets. Connect back to the correct reasoning.

CATEGORY: Assign exactly one NCLEX category from this list:
- Management of Care
- Safety and Infection Control
- Health Promotion and Maintenance
- Psychosocial Integrity
- Basic Care and Comfort
- Pharmacological Therapies
- Reduction of Risk Potential
- Physiological Adaptation
- Priority Setting
- Delegation

DIFFICULTY: Rate 1-5 where:
- 1 = Pure recall (definition, normal range)
- 2 = Comprehension (explain why)
- 3 = Application (apply to clinical scenario) ← target most questions here
- 4 = Analysis (compare, prioritize, differentiate)
- 5 = Synthesis (complex multi-system, SATA-style reasoning)
</instructions>

<output_format>
Respond with ONLY valid JSON. No markdown, no explanation, no preamble.

{
  "question_stem": "A nurse is caring for four postoperative patients. Which patient should the nurse assess FIRST?",
  "options": [
    {"label": "A", "text": "A patient 2 hours post-op from a total knee replacement reporting pain of 6/10"},
    {"label": "B", "text": "A patient 4 hours post-op from a cholecystectomy with a temperature of 100.2°F"},
    {"label": "C", "text": "A patient 1 hour post-op from a thyroidectomy reporting increasing neck tightness"},
    {"label": "D", "text": "A patient 6 hours post-op from an appendectomy requesting to ambulate"}
  ],
  "correct_answer": "C",
  "rationale_correct": "Post-thyroidectomy neck tightness suggests hematoma formation, which can compress the trachea and cause airway obstruction — a life-threatening emergency. Using ABCs, airway is always the highest priority. This patient needs immediate assessment for signs of respiratory compromise (stridor, dyspnea, swelling).",
  "rationale_incorrect": {
    "A": "Pain of 6/10 is expected 2 hours post-op from a total knee replacement and is not life-threatening. Students often prioritize pain because it feels urgent, but NCLEX ranks physiological threats (airway) above comfort.",
    "B": "A low-grade fever of 100.2°F at 4 hours post-op is a common inflammatory response and does not indicate an emergency. Students may confuse this with infection, but infection-related fever typically presents 48-72 hours post-op.",
    "D": "Requesting to ambulate 6 hours post-appendectomy is a positive sign of recovery. This patient is stable and can wait. Students sometimes worry about post-op mobility, but this is a routine request."
  },
  "nclex_category": "Priority Setting",
  "difficulty": 3
}
</output_format>
```

**Program level blocks** (injected into `{{PROGRAM_LEVEL_BLOCK}}`):

These match the existing `PROGRAM_LEVEL_BLOCKS` from `src/lib/ai/system-prompt.ts`:

| Level | Block |
|-------|-------|
| LPN | `Generate questions at the LPN/LVN level. Focus on task-based clinical reasoning, safety, and basic assessment. Use NCLEX-PN framework. Avoid graduate-level pathophysiology.` |
| ADN | `Generate questions at the ADN/associate degree level. Focus on acute care prioritization, delegation basics, pharmacology fundamentals. Use NCLEX-RN Next Generation format.` |
| BSN | `Generate questions at the BSN level. Include evidence-based practice, patient education, and leadership concepts. Higher complexity case studies. Full NCLEX-RN Next Generation depth.` |
| MSN | `Generate questions at the MSN/graduate level. Advanced pathophysiology, differential diagnosis, clinical decision-making at the provider level. DNP-level case complexity is appropriate.` |

### 4.2 Generic Question Prompt — No Uploaded Material

When the user has no documents, replace the `<source_material>` block with an NCLEX blueprint targeting block:

```
SYSTEM PROMPT — QUIZ QUESTION GENERATOR (GENERIC / NO DOCUMENTS)

<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions targeting the NCLEX test blueprint. You are NOT a tutor — you are an exam item writer.
</identity>

<program_level>
{{PROGRAM_LEVEL_BLOCK}}
</program_level>

<nclex_blueprint_focus>
Generate a question from the following NCLEX Client Needs category:

Category: {{SELECTED_CATEGORY}}

<!-- NCLEX Client Needs percentages sourced from: NCSBN NCLEX-RN Test Plan, Effective April 2023. Next update expected March 31, 2026. -->

NCLEX Client Needs categories and their approximate exam weight:
- Safe and Effective Care Environment
  - Management of Care (15-21%): delegation, prioritization, ethical/legal, advocacy, case management
  - Safety and Infection Control (10-16%): standard precautions, fall prevention, restraints, error prevention
- Health Promotion and Maintenance (6-12%): developmental stages, screening, immunizations, lifestyle choices
- Psychosocial Integrity (6-12%): therapeutic communication, crisis intervention, grief/loss, mental health
- Physiological Integrity
  - Basic Care and Comfort (6-12%): nutrition, mobility, elimination, rest/sleep, pain management
  - Pharmacological Therapies (13-19%): medication administration, adverse effects, dosage calculation, expected outcomes
  - Reduction of Risk Potential (9-15%): lab values, diagnostic tests, complications, vital sign changes
  - Physiological Adaptation (11-17%): fluid/electrolyte, emergency response, pathophysiology, medical emergencies

Generate a question that tests a HIGH-YIELD concept within the selected category. Prioritize topics that appear frequently on NCLEX.
</nclex_blueprint_focus>

<previous_questions>
{{PREVIOUS_QUESTION_STEMS_JSON}}
</previous_questions>

<instructions>
(Same as Section 4.1 instructions — identical item-writing rules apply)
</instructions>

<output_format>
(Same JSON format as Section 4.1)
</output_format>
```

**Category rotation logic:** For a 10-question generic quiz, rotate through categories to ensure coverage:
1. Questions 1-2: Physiological Integrity (Pharmacological Therapies) — highest weight
2. Questions 3-4: Safe and Effective Care Environment (Management of Care) — highest weight
3. Question 5: Physiological Integrity (Physiological Adaptation)
4. Question 6: Physiological Integrity (Reduction of Risk Potential)
5. Question 7: Safety and Infection Control
6. Question 8: Basic Care and Comfort
7. Question 9: Health Promotion and Maintenance
8. Question 10: Psychosocial Integrity

This mirrors NCLEX blueprint weighting. If user selects a specific category, all 10 questions target that category.

### 4.3 "Dig Deeper" Hand-Off — Quiz to Tutor Context

When a user clicks "Dig Deeper with Tutor" on a wrong answer, the following context is injected as a system message into the new tutor session:

```
<quiz_context>
The student just answered an NCLEX-style practice question incorrectly. They clicked "Dig Deeper" to understand the reasoning. Use this context to guide a Socratic exploration of WHY the correct answer is right and WHERE their reasoning went wrong.

QUESTION:
{{question_stem}}

STUDENT'S ANSWER: {{user_answer}} — "{{user_answer_text}}"
CORRECT ANSWER: {{correct_answer}} — "{{correct_answer_text}}"

RATIONALE (correct): {{rationale_correct}}
RATIONALE (student's choice): {{rationale_for_user_answer}}

NCLEX CATEGORY: {{nclex_category}}
DIFFICULTY: {{difficulty}}/5

{{#if source_doc_id}}
SOURCE MATERIAL: This question was generated from the student's uploaded document. The relevant excerpt:
---
{{source_chunk_text}}
---
{{/if}}
</quiz_context>

<instructions>
1. Do NOT repeat the question or rationale verbatim — the student already saw it.
2. Start by asking the student to explain their reasoning: "Walk me through why you chose {{user_answer}}."
3. Use the ADPIE framework to guide them to the correct reasoning.
4. If source material is present, reference it: "Looking at your notes on [topic]..."
5. Keep it to 2-3 exchanges max. This is a focused dig-in, not a full tutoring session.
6. End with a CHECK question that tests whether they now understand the distinction.
</instructions>
```

This context is passed via the existing tutor API (`/api/chat`) as a system message prepended to the conversation. The tutor's existing system prompt (`src/lib/ai/system-prompt.ts`) remains unchanged — the quiz context is additive.

**URL structure for handoff:**
```
/tutor?intent=dig-deeper&quizSessionId={uuid}&questionId={uuid}
```

The TutorPageClient already reads `intent` from search params. The `dig-deeper` intent triggers a fetch of the quiz question context before initializing the chat.

### 4.4 Cost Model

| Item | Tokens (est.) | Cost (Claude Sonnet) |
|------|---------------|---------------------|
| Single question generation | ~300 input + ~500 output = ~800 total | $0.003–0.005 |
| 10-question quiz | ~8,000 total | $0.03–0.05 |
| Dig deeper handoff (1 exchange) | ~1,500 total | $0.005–0.008 |
| Full quiz + 3 dig-deepers | ~12,500 total | $0.05–0.07 |

**Comparison to tutor-only:**
- Tutor conversation (10 exchanges): ~15,000 tokens, ~$0.05–0.08
- Quiz (10 questions): ~8,000 tokens, ~$0.03–0.05
- Quiz is slightly cheaper per session but generates more sessions (that's the point)

**Cost risk:** If quiz drives 5x more sessions per user (the goal), per-user cost increases ~3-4x. At 33 users this is negligible ($5-10/day). At 1,000 users it's $150-300/day — manageable but worth monitoring.

---

## Section 5: UX Specification

### Brand Reference
- Navy: `#0B2545`
- Teal: `#0D8F9C`
- Teal Bright: `#0BBCD4`
- Teal Light: `#E0F4F6`
- Body font: DM Sans
- Display font: Instrument Serif
- All screens mobile-first, single-column
- Touch targets ≥ 44px
- Minimal scroll per question

### 5.1 Entry Choice Screen (`/entry`)

```
┌─────────────────────────────────────┐
│  ┌─────┐                            │
│  │FORGE│  ForgeNursing               │
│  └─────┘                            │
│                                      │
│  Hey {{preferred_name}}! 👋          │  ← Instrument Serif, 24px
│  How do you want to study?           │  ← DM Sans, 16px, Navy
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  📝  Practice Questions         │ │  ← Teal border, 56px height
│  │  NCLEX-style quiz — test your   │ │     touch target
│  │  knowledge with instant feedback│ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  💬  AI Clinical Tutor          │ │  ← Navy border, 56px height
│  │  Socratic reasoning — work      │ │
│  │  through concepts step by step  │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌──┐                                │
│  │☐ │ Remember my choice             │  ← 44px checkbox
│  └──┘                                │
│                                      │
│  You can always switch modes from    │
│  the menu.                           │  ← DM Sans, 14px, gray
│                                      │
└─────────────────────────────────────┘
```

### 5.2 Quiz Setup Screen (`/quiz` — before session starts)

```
┌─────────────────────────────────────┐
│  ← Back          Practice Questions  │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ ⚠️ Upload your course materials │ │  ← Only shown if no documents
│  │ for personalized questions.     │ │     Teal Light bg, dismissible
│  │ [Upload in Binder →]           │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Question Source                     │
│  ┌─────────────────────────────────┐ │
│  │ ● My Materials                  │ │  ← Radio, disabled if no docs
│  │ ○ General NCLEX                 │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Focus Area (optional)               │
│  ┌─────────────────────────────────┐ │
│  │ All Categories            ▼     │ │  ← Dropdown
│  └─────────────────────────────────┘ │
│                                      │
│  10 questions · ~8 minutes           │  ← DM Sans, 14px, gray
│                                      │
│  ┌─────────────────────────────────┐ │
│  │        Start Quiz               │ │  ← Teal bg, white text
│  └─────────────────────────────────┘ │     56px height, full width
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ 📊 Resume: 6/10 complete       │ │  ← Only if in_progress session
│  │ [Resume]  [Start Fresh]         │ │     exists. Teal Light bg.
│  └─────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### 5.3 Quiz Question Screen

```
┌─────────────────────────────────────┐
│  Question 4 of 10                    │
│  ████████░░░░░░░░░░░░  40%          │  ← Teal progress bar
│                                      │
│  ┌─────────────────────────────────┐ │
│  │ A 72-year-old patient with COPD │ │
│  │ is admitted with increased       │ │
│  │ dyspnea and SpO2 of 86%. The   │ │
│  │ nurse should set the oxygen     │ │
│  │ delivery to which target?       │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  A) 98-100% via non-rebreather  │ │  ← 56px min height per option
│  └─────────────────────────────────┘ │     Navy border, Teal on select
│  ┌─────────────────────────────────┐ │
│  │  B) 88-92% via nasal cannula    │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │  C) 94-96% via simple mask      │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │  D) 85-88% via Venturi mask     │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │         Submit Answer           │ │  ← Disabled until option selected
│  └─────────────────────────────────┘ │     Teal bg when active
│                                      │
└─────────────────────────────────────┘
```

### 5.4 Rationale Screen — Correct Answer

```
┌─────────────────────────────────────┐
│  Question 4 of 10                    │
│  ████████░░░░░░░░░░░░  40%          │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  ✓ Correct!                     │ │  ← Green (#22C55E) bg
│  │                                  │ │
│  │  B) 88-92% via nasal cannula    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  WHY B IS CORRECT                    │  ← DM Sans bold, 14px
│  COPD patients rely on hypoxic       │
│  drive. Targeting 88-92% prevents    │
│  suppressing respiratory drive       │
│  while correcting hypoxemia.         │
│  Nasal cannula at 1-2 L/min is      │
│  the appropriate delivery method.    │
│                                      │
│  Category: Physiological Adaptation  │  ← Gray tag
│  Difficulty: ●●●○○                   │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │        Next Question →          │ │  ← Teal bg
│  └─────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### 5.5 Rationale Screen — Incorrect Answer

```
┌─────────────────────────────────────┐
│  Question 4 of 10                    │
│  ████████░░░░░░░░░░░░  40%          │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  ✗ Incorrect                    │ │  ← Red (#EF4444) bg
│  │  You chose: A                    │ │
│  │  Correct answer: B              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  WHY B IS CORRECT                    │
│  COPD patients rely on hypoxic       │
│  drive. Targeting 88-92% prevents    │
│  suppressing respiratory drive       │
│  while correcting hypoxemia.         │
│                                      │
│  WHY A IS WRONG                      │  ← Highlighted for user's choice
│  98-100% is dangerously high for     │
│  COPD. High-flow O2 suppresses the   │
│  hypoxic drive, risking respiratory  │
│  arrest. Common student mistake:     │
│  "more oxygen is always better."     │
│                                      │
│  ─────────────────────────────────── │
│  🧠 Want to understand deeper?       │
│  ┌─────────────────────────────────┐ │
│  │  Dig Deeper with Tutor →       │ │  ← Navy bg, white text
│  └─────────────────────────────────┘ │
│  ─────────────────────────────────── │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │        Next Question →          │ │  ← Teal bg
│  └─────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### 5.6 Results Screen (`/quiz/results`)

```
┌─────────────────────────────────────┐
│                                      │
│  Quiz Complete! 🎉                   │  ← Instrument Serif, 28px
│                                      │
│  ┌─────────────────────────────────┐ │
│  │         7 / 10                  │ │  ← Large number, Teal
│  │  ████████████████░░░░  70%      │ │  ← Teal progress bar
│  └─────────────────────────────────┘ │
│                                      │
│  Performance by Category             │  ← DM Sans bold, 16px
│  ┌─────────────────────────────────┐ │
│  │ Pharmacology         3/4  75%   │ │
│  │ ████████████████░░░░            │ │
│  │ Priority Setting     2/3  67%   │ │
│  │ ██████████████░░░░░░            │ │
│  │ Safety               2/3  67%   │ │
│  │ ██████████████░░░░░░            │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Questions You Missed                │  ← DM Sans bold, 16px
│  ┌─────────────────────────────────┐ │
│  │ Q3 · Beta blocker hold criteria │ │
│  │ [Review] [Dig Deeper →]         │ │  ← 44px touch targets
│  ├─────────────────────────────────┤ │
│  │ Q5 · Fluid overload priority    │ │
│  │ [Review] [Dig Deeper →]         │ │
│  ├─────────────────────────────────┤ │
│  │ Q9 · Delegation to UAP          │ │
│  │ [Review] [Dig Deeper →]         │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │       Start New Quiz            │ │  ← Teal bg
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │       Back to Home              │ │  ← Navy outline
│  └─────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

---

## Section 6: Analytics (PostHog)

PostHog is already installed (`posthog-js` in dependencies, imported in existing components). All new events follow the existing pattern of `posthog.capture()` calls.

### 6.1 Event Definitions

#### `quiz_path_selected`
Fired when user chooses "Practice Questions" on the entry screen.

```json
{
  "event": "quiz_path_selected",
  "properties": {
    "source": "entry_screen" | "nav_menu" | "settings",
    "had_previous_preference": true | false,
    "remember_choice_checked": true | false
  }
}
```

#### `quiz_started`
Fired when user taps "Start Quiz" and the first question is generated.

```json
{
  "event": "quiz_started",
  "properties": {
    "session_id": "uuid",
    "source_type": "document" | "generic" | "mixed",
    "nclex_category": "Pharmacological Therapies" | null,
    "class_id": "uuid" | null,
    "has_documents": true | false,
    "is_resume": false
  }
}
```

#### `quiz_question_answered`
Fired each time the user submits an answer.

```json
{
  "event": "quiz_question_answered",
  "properties": {
    "session_id": "uuid",
    "question_id": "uuid",
    "question_index": 4,
    "is_correct": true | false,
    "user_answer": "A",
    "correct_answer": "B",
    "nclex_category": "Physiological Adaptation",
    "difficulty": 3,
    "time_spent_seconds": 42,
    "source_type": "document" | "generic"
  }
}
```

#### `quiz_completed`
Fired when the user finishes all 10 questions and sees the results screen.

```json
{
  "event": "quiz_completed",
  "properties": {
    "session_id": "uuid",
    "score": 7,
    "total": 10,
    "percentage": 70,
    "time_total_seconds": 480,
    "avg_time_per_question_seconds": 48,
    "source_type": "document" | "generic",
    "categories_tested": ["Pharmacology", "Priority Setting", "Safety"],
    "dig_deeper_count": 0
  }
}
```

#### `dig_deeper_clicked`
Fired when user clicks "Dig Deeper with Tutor" from rationale or results screen.

```json
{
  "event": "dig_deeper_clicked",
  "properties": {
    "session_id": "uuid",
    "question_id": "uuid",
    "question_index": 3,
    "nclex_category": "Pharmacological Therapies",
    "source": "rationale_screen" | "results_screen",
    "user_answer": "C",
    "correct_answer": "B"
  }
}
```

#### `mode_switched`
Fired when user switches between quiz and tutor via nav menu.

```json
{
  "event": "mode_switched",
  "properties": {
    "from_mode": "quiz" | "tutor",
    "to_mode": "quiz" | "tutor",
    "source": "nav_menu" | "dig_deeper" | "back_to_quiz",
    "had_in_progress_quiz": true | false
  }
}
```

#### `upload_from_quiz_banner_clicked`
Fired when user clicks the "Upload in Binder" link from the quiz setup banner.

```json
{
  "event": "upload_from_quiz_banner_clicked",
  "properties": {
    "had_previous_documents": false,
    "quiz_session_active": false
  }
}
```

#### `quiz_abandoned`
Fired when a user starts a new quiz while an in_progress session exists, or when session is auto-abandoned after 24 hours.

```json
{
  "event": "quiz_abandoned",
  "properties": {
    "session_id": "uuid",
    "questions_completed": 6,
    "total_questions": 10,
    "time_since_start_minutes": 1440,
    "reason": "user_started_new" | "auto_expired"
  }
}
```

#### `quiz_resumed`
Fired when user resumes an in_progress quiz session.

```json
{
  "event": "quiz_resumed",
  "properties": {
    "session_id": "uuid",
    "questions_completed": 6,
    "total_questions": 10,
    "time_since_last_answer_minutes": 120
  }
}
```

### 6.2 Retention Measurement

**Primary metric:** D1/D3/D7 return rates segmented by entry path.

PostHog cohort definitions:

| Cohort | Definition |
|--------|-----------|
| `quiz_first_users` | Users where first post-signup event is `quiz_path_selected` or `quiz_started` |
| `tutor_only_users` | Users where first post-signup event is a tutor interaction AND `quiz_first_enabled = false` |
| `quiz_first_enabled_chose_tutor` | Users with `quiz_first_enabled = true` who chose tutor on entry screen |

**Retention events:**
- D1 return: any `quiz_started`, `quiz_question_answered`, or tutor message sent within 24-48 hours of signup
- D3 return: any of the above within 72-96 hours of signup
- D7 return: any of the above within 168-192 hours of signup

**Dashboard:** Create a PostHog dashboard "Quiz-First Experiment" with:
1. Funnel: signup → entry_choice → first_quiz_started → first_quiz_completed → D1_return
2. Retention table: quiz_first_users vs tutor_only_users, D1/D3/D7
3. Quiz completion rate: quiz_started → quiz_completed (target: >60%)
4. Dig deeper conversion: quiz_question_answered (is_correct=false) → dig_deeper_clicked (target: >15%)
5. Average score distribution: histogram of quiz_completed.percentage

### 6.3 Funnel Definition

```
signup
  → entry_choice (quiz_path_selected OR tutor session started)
    → first_quiz_started
      → first_quiz_completed
        → D1_return (any activity 24-48h after signup)
          → D3_return
            → D7_return
```

**Target conversion rates (Phase 1):**
- entry_choice → first_quiz_started: >70% (of those who chose quiz)
- first_quiz_started → first_quiz_completed: >60%
- first_quiz_completed → D1_return: >15% (this is the advance criterion)

---

## Section 7: Rollout Plan

### Phase 1: New Signups Only

**Trigger:** Feature flag `quiz_first_enabled = true` set on profile creation for new users.

**Implementation:**
```sql
-- In the signup trigger or auth callback:
-- Set quiz_first_enabled = true for all new signups after launch date
UPDATE profiles
SET quiz_first_enabled = true
WHERE id = NEW.id;
```

**Duration:** 2-4 weeks or until 50+ new signups have gone through the quiz-first flow.

**Monitoring:**
- Daily check: quiz_started count, quiz_completed count, D1 return rate
- Alert if quiz completion rate drops below 40% (question quality issue)
- Alert if error rate on `/api/quiz/generate` exceeds 5%

**Advance criteria to Phase 2:**
- D1 return rate ≥ 15% for quiz-first users (vs current ~6% baseline: 2/33)
- Quiz completion rate ≥ 50%
- No P0 bugs in quiz flow
- Claude API cost within 2x of projected ($0.05/quiz)
- Minimum 30 new signups have reached the entry screen
- Claude API cost within 2x of projected ($0.05/quiz)

### Phase 2: Existing Trial Users (Opt-In)

**Trigger:** In-app banner on `/tutor` for existing trial users:

```
┌─────────────────────────────────────────────┐
│ 📝 New! Practice Questions are here.        │
│ Test your knowledge with NCLEX-style quizzes │
│ powered by your uploaded materials.          │
│ [Try It →]                    [Dismiss]      │
└─────────────────────────────────────────────┘
```

**Implementation:**
```sql
-- Enable for all trialing users
UPDATE profiles
SET quiz_first_enabled = true
WHERE subscription_status = 'trialing'
AND trial_ends_at > now();
```

Users who dismiss the banner are not shown it again (track via `localStorage` or a `quiz_banner_dismissed_at` column).

**Duration:** 2 weeks.

**Advance criteria to Phase 3:**
- Opt-in rate ≥ 20% (of those shown the banner)
- No regression in tutor usage metrics for users who don't opt in

### Phase 3: Beta Users (Opt-In Notification)

**Trigger:** Email notification to beta users via Resend (existing email infrastructure).

**Email content:**
- Subject: "New: Practice Questions in ForgeNursing"
- Body: Brief description, link to `/entry`, screenshot of quiz interface
- CTA: "Try Practice Questions →"

**Implementation:**
```sql
-- Enable for all beta users
UPDATE profiles
SET quiz_first_enabled = true
WHERE is_beta = true
AND beta_expires_at > now();
```

**Duration:** Ongoing. Beta users can switch between quiz and tutor freely.

### Rollback Procedure

At any phase, if metrics indicate regression or quality issues:

```sql
-- Instant rollback: disable quiz-first for all users
UPDATE profiles SET quiz_first_enabled = false;

-- Users with default_entry_path = 'quiz' will fall through to /tutor
-- because middleware checks quiz_first_enabled FIRST
```

- No code deployment required for rollback
- Users mid-quiz will see their session preserved but won't be routed to /quiz on next login
- Quiz data (sessions, questions) is preserved for analysis even after rollback

### Communication Plan

| Phase | Audience | Channel | Message |
|-------|----------|---------|---------|
| Phase 1 | New signups | In-app (entry screen) | No communication needed — it's their first experience |
| Phase 2 | Trial users | In-app banner on /tutor | "New! Practice Questions are here." |
| Phase 3 | Beta users | Email via Resend + in-app banner | "New: Practice Questions in ForgeNursing" |
| Rollback | All affected | None (silent) | Feature flag off, users return to /tutor seamlessly |

---

## Section 8: Edge Cases

### 8.1 Non-Nursing Document Uploaded

**Scenario:** User uploads a history textbook or random PDF, then starts a quiz from "My Materials."

**Handling:**
1. Question generation prompt includes the document chunk. Claude attempts to generate a nursing question.
2. If Claude returns a response that doesn't match the expected JSON schema (Zod validation fails), catch the error.
3. Fallback: show a gentle message — "We couldn't generate a nursing question from this material. Switching to general NCLEX questions for this session."
4. Set `source_type = 'generic'` for remaining questions in the session.
5. Track event: `quiz_generation_fallback` with `reason: 'non_nursing_content'`.

### 8.2 Claude API Timeout Mid-Quiz

**Scenario:** User is on question 6. The `/api/quiz/generate` call for question 7 times out (>30 seconds).

**Handling:**
1. Client shows a loading state with spinner: "Generating your next question..."
2. After 15 seconds, show: "Taking longer than usual. Hang tight..."
3. After 30 seconds, show retry button: "Question generation timed out. [Retry] [Skip to Results]"
4. Retry: re-calls `/api/quiz/generate` with same parameters.
5. Skip to Results: marks session as `completed` with `total_questions` = number answered so far. Score calculated on answered questions only.
6. Quiz progress (questions 1-6) is already saved in `quiz_questions` table — no data loss.

### 8.3 Rate Limit Hit

**Scenario:** Anthropic API returns 429 (rate limit) during question generation.

**Handling:**
1. Server-side: catch 429, extract `retry-after` header if present.
2. Client shows: "Generating..." with a subtle progress animation.
3. Server retries after the `retry-after` delay (or 5 seconds if no header), up to 3 retries.
4. Max total wait: 30 seconds. After 30 seconds, same fallback as 8.2 (retry button + skip option).
5. If rate limits are persistent (>3 consecutive 429s), log alert and consider pre-generating questions.

### 8.4 Upload Mid-Quiz

**Scenario:** User is on question 4, navigates to /binder, uploads a new document, returns to quiz.

**Handling:**
1. Current quiz session continues with its original source configuration.
2. Questions 5-10 continue using the same source (document or generic) as questions 1-4.
3. New material is available for the NEXT quiz session.
4. Rationale: mid-quiz source switching would create inconsistent difficulty and topic coverage.
5. On the results screen, if new documents were uploaded during the session, show: "New materials detected! Your next quiz can use them."

### 8.5 Tiny Document (< 500 words)

**Scenario:** User uploads a 1-page syllabus outline with 200 words of content.

**Handling:**
1. Detect document word count during upload (already parsed for embeddings).
2. If document chunk is < 500 words, the question generation prompt may produce low-quality or repetitive questions.
3. For the first 2-3 questions, use the document content. For remaining questions, supplement with generic NCLEX questions in the same topic area.
4. Set `source_type = 'mixed'` on the session.
5. Show note to user: "Your document is short — we've supplemented with general NCLEX questions on related topics."

### 8.6 Huge Document (> 100 pages)

**Scenario:** User uploads a 500-page textbook PDF.

**Handling:**
1. Document is already chunked for RAG embeddings (existing `/api/process` pipeline).
2. For each question, select a DIFFERENT chunk using a rotation strategy:
   - Divide chunks into 10 buckets (for 10 questions).
   - Select one chunk per bucket, ensuring coverage across the document.
3. Track which chunks have been used in previous quiz sessions for this document.
4. Across multiple quiz sessions, rotate to unused chunks — ensuring the student eventually gets questions from all parts of the material.
5. No user-facing message needed — this is transparent.

### 8.7 Network Disconnect

**Scenario:** User answers question 5, then loses network connectivity.

**Handling:**
1. Answer submission to `/api/quiz/answer` fails (network error).
2. Client stores the answer in `localStorage`:
   ```json
   {
     "quiz_pending_answers": [{
       "session_id": "uuid",
       "question_id": "uuid",
       "user_answer": "B",
       "answered_at": "2026-04-16T10:30:00Z"
     }]
   }
   ```
3. Client shows: "You're offline. Your answer is saved locally."
4. On reconnect (detected via `navigator.onLine` event), sync pending answers to server.
5. If sync succeeds, clear localStorage and continue quiz.
6. If sync fails (e.g., session was abandoned server-side), show: "Your session expired. Starting a new quiz with your progress saved."

### 8.8 Same Question Answered Twice

**Scenario:** Due to network retry or double-tap, the same answer is submitted twice.

**Handling:**
1. `quiz_questions` table has `UNIQUE(session_id, question_index)` constraint.
2. The `/api/quiz/answer` endpoint checks `answered_at IS NOT NULL` before processing.
3. If already answered: return the existing answer and rationale (idempotent response).
4. First answer wins — no overwriting.
5. Client-side: disable submit button immediately on tap, show loading state.

### 8.9 Question Generation Fails Entirely

**Scenario:** Claude returns malformed JSON, empty response, or content that fails Zod validation.

**Handling:**
1. Server-side: parse Claude response with Zod schema. If validation fails, retry once with a slightly modified prompt (add: "Your previous response was not valid JSON. Please respond with ONLY the JSON object.").
2. If retry also fails: log the error with the raw Claude response for debugging.
3. Client-side: show "We hit a snag generating this question. [Try Again] [Skip]"
4. Skip: advance `current_question_index`, generate next question. Session completes with fewer than 10 questions.
5. Future enhancement: maintain a pre-generated question bank as fallback. Not in V1 scope.

---

## Section 9: Risk Assessment

### 9.1 Production Risk: Tutor Regression

**Risk:** Changes to middleware or shared components break the existing `/tutor` flow.

**Mitigation:**
- Middleware change is a single additional branch AFTER the existing `hasAccess()` check. If `quiz_first_enabled` is false or missing, the branch is never entered.
- No tutor components are modified. Quiz components are entirely new files.
- Feature flag default is `false` — existing users are unaffected until explicitly enabled.
- Existing E2E tests (`tests/e2e/`) continue to run against `/tutor` unchanged.
- Add one new E2E test: "tutor flow unchanged when quiz_first_enabled = false."

**Severity if realized:** HIGH — tutor is the only product today. Any regression blocks all 33 users.

### 9.2 Cost Risk: API Call Volume

**Risk:** Quiz generates ~10x more API calls per session than tutor (10 questions = 10 calls vs tutor = 1 call per user message).

**Current state:** 33 users, ~2 active. Cost is negligible.

**Projection at scale:**

| Users | Sessions/day | API calls/day | Cost/day |
|-------|-------------|---------------|----------|
| 33 | ~5 | ~50 | ~$0.25 |
| 100 | ~30 | ~300 | ~$1.50 |
| 500 | ~150 | ~1,500 | ~$7.50 |
| 1,000 | ~300 | ~3,000 | ~$15.00 |

**Mitigation:**
- Monitor daily API spend via Anthropic dashboard.
- Set Anthropic API spend alert at $50/day.
- Future: pre-generate question banks for common topics (eliminates per-question API cost).
- Future: rate limiting table (Section 3.4) caps questions per user per day.

### 9.3 Quality Risk: AI-Generated Distractors

**Risk:** Claude generates distractors that are too obviously wrong (easy quiz, no learning) or too similar to the correct answer (frustrating, feels unfair).

**Mitigation:**
- Prompt engineering (Section 4) explicitly requires "plausible distractors based on common misconceptions."
- Each distractor rationale must explain the misconception it targets.
- Manual QA: review first 50 generated questions before Phase 2 rollout.
- PostHog tracking: if average score is >90% (too easy) or <30% (too hard), flag for prompt tuning.
- Future: difficulty calibration based on aggregate user performance per category.

**Severity if realized:** MEDIUM-HIGH — low-quality questions are worse than no questions. Users will compare to UWorld/ATI and find ForgeNursing lacking.

### 9.4 Data Risk: Table Growth

**Risk:** `quiz_questions` grows at 10 rows per quiz per user. At scale, this becomes significant.

**Projection:**

| Users | Quizzes/week | Rows/week (quiz_questions) | Rows/year |
|-------|-------------|---------------------------|-----------|
| 100 | 200 | 2,000 | 104,000 |
| 1,000 | 2,000 | 20,000 | 1,040,000 |
| 10,000 | 20,000 | 200,000 | 10,400,000 |

**Mitigation:**
- Supabase Postgres handles millions of rows without issue.
- Indexes on `session_id`, `user_id`, and `created_at` keep queries fast.
- Future: archive completed sessions older than 90 days to a `quiz_questions_archive` table.
- Future: aggregate statistics into a `quiz_user_stats` summary table, reducing need to query raw questions.

### 9.5 External Dependency: Anthropic API Outage

**Risk:** If Anthropic's API is down, quiz generation is completely blocked. Unlike the tutor (where the user can still type and wait), quiz has no fallback content.

**Mitigation:**
- Short outage (<5 min): retry logic (Section 8.3) handles transparently.
- Medium outage (5-30 min): show "Quiz generation is temporarily unavailable. Try the AI Tutor instead." with link to `/tutor`.
- Long outage (>30 min): same message, plus PostHog alert to engineering.
- Future: pre-generated question bank provides offline-capable quiz experience.

**Severity if realized:** MEDIUM — quiz is blocked but tutor still works. Users have an alternative.

### 9.6 Worst Case Scenario

**Scenario:** Quiz ships. Questions are low quality (too easy, repetitive, or clinically inaccurate). Users try one quiz, find it inferior to UWorld/ATI, and churn faster than tutor-only users.

**Detection:**
- D1 return rate for quiz-first users is LOWER than tutor-only baseline (currently ~6%).
- Quiz completion rate drops below 40%.
- User feedback (existing `/feedback` route) mentions question quality.

**Response:**
1. Pause Phase 2/3 rollout.
2. Analyze generated questions: review 100 random questions for clinical accuracy, distractor quality, difficulty distribution.
3. Iterate on prompts (Section 4) based on findings.
4. If prompt iteration doesn't fix quality: consider licensing a question bank (Lippincott, Saunders) for V1 and using AI generation only for document-specific questions.
5. Rollback to tutor-only if quality threshold is not met (see below).

**Quality Acceptance Criteria (blocking for Phase 2 advancement):**

Before advancing past Phase 1, founder manually reviews a sample of 30 randomly selected generated questions using this rubric (1-5 scale):

| Dimension | Description | Threshold |
|-----------|-------------|-----------|
| Clinical accuracy | Is the correct answer actually correct? | ≥ 4.0/5 average |
| Distractor plausibility | Are wrong answers reflective of real misconceptions? | ≥ 3.5/5 average |
| NCLEX-style adherence | Does it read like an NCLEX question? | ≥ 3.5/5 average |
| Difficulty calibration | Appropriate for the user's program level? | ≥ 3.5/5 average |

If threshold is not met, pause Phase 2 rollout and iterate prompts before proceeding.

**Reviewer:** Michael (founder) — former Navy Hospital Corpsman, FMF. Nursing clinical background adequate for clinical accuracy review.

---

## Section 10: Open Questions for Product Owner

These are genuinely open decisions that require product input before implementation. Engineering has no strong opinion — each option is technically feasible.

### Q1: Quiz Length

**Options:**
- **A) Fixed 10 questions** — simplest to build, consistent experience, matches Qbank norms
- **B) User-selectable (5 / 10 / 20)** — more flexibility, but 20 questions = 2x API cost and longer sessions
- **C) Adaptive** — start with 10, offer "5 more?" at the end — most complex to build

**Recommendation for V1:** Fixed 10. Add selectable length in V2 if users request it.

### Q2: Free Tier Limits

**Options:**
- **A) Unlimited quizzes during trial** — maximizes engagement, higher API cost
- **B) 3 quizzes/day during trial** — controls cost, creates scarcity
- **C) 1 quiz/day free forever, unlimited for paid** — freemium model

**Needs decision:** What's the trial experience? Currently trial is 7 days with full access. Does quiz follow the same model?

### Q3: Tutor Access During Quiz

**Options:**
- **A) Sequential only** — finish quiz, then tutor (or abandon quiz). Simplest UX.
- **B) "Dig Deeper" exits quiz temporarily** — quiz progress saved, user returns after tutor exchange. (This is what Section 1.5 describes.)
- **C) Split screen** — quiz on left, tutor on right. Complex, desktop-only.

**Recommendation for V1:** Option B (sequential with "Dig Deeper" handoff). Split screen is a V2+ feature.

### Q4: Pricing

**Options:**
- **A) Same tier** — quiz + tutor included in all plans. Simplest.
- **B) Quiz as premium add-on** — tutor is base, quiz is $X/month extra. More revenue but higher friction.
- **C) Quiz-only tier** — cheaper than tutor, targets price-sensitive students. Fragments the product.

**Needs decision:** This affects the checkout flow and Stripe product configuration.

### Q5: Pre-Generated Question Bank

**Options:**
- **A) AI-only for V1** — every question is generated on-the-fly. Simpler, but dependent on API availability and quality.
- **B) Seed bank of 200-500 questions** — manually reviewed, covers NCLEX blueprint. Used as fallback when AI fails or for generic quizzes. Significant upfront effort.
- **C) Hybrid** — AI generates, human reviews, approved questions enter the bank. Best quality, most effort.

**Recommendation for V1:** Option A (AI-only). Build the bank organically by saving high-quality generated questions (score them by user performance — questions with 40-70% correct rate are well-calibrated).

### Q6: Spaced Repetition

**Should missed questions resurface in future quizzes?**

- **A) No** — each quiz is independent. Simplest.
- **B) Yes, basic** — missed questions have a 30% chance of appearing in the next quiz. Moderate complexity.
- **C) Yes, full SRS** — Leitner box or SM-2 algorithm. Significant complexity, proven effective.

**Recommendation for V1:** Option A. Track missed questions in the database (already captured). Build SRS in V2 using the data collected in V1.

### Q7: Leaderboard / Gamification

**Options:**
- **A) None for V1** — focus on core quiz experience
- **B) Personal stats only** — "You've completed 15 quizzes, average score 72%, improving trend ↑"
- **C) Leaderboard** — compare scores with other users. Privacy concerns, competitive pressure.

**Recommendation for V1:** Option A. Personal stats (Option B) in V2.

### Q8: Study Mode vs Test Mode

**Options:**
- **A) Study mode only** — see rationale immediately after each question (current spec)
- **B) Test mode only** — see all rationales after completing all 10 questions
- **C) User chooses** — toggle at quiz setup: "Show answers as you go" vs "Show answers at the end"

**Recommendation for V1:** Option A (study mode). Immediate feedback is more engaging and educational. Test mode in V2 for users who want exam simulation.

### Q9: Question Deduplication Across Sessions

**Should the system avoid repeating questions a user has already seen?**

- If using AI generation: each question is unique by nature (different Claude outputs). Low risk of exact duplicates, but similar questions are possible.
- If using a pre-generated bank: deduplication is essential.

**Recommendation for V1:** Track `question_stem` hashes in `quiz_questions`. Pass previous stems to the prompt (Section 4.1, `<previous_questions>` block) within a session. Cross-session deduplication deferred to V2.

### Q10: Mobile App Considerations

**Is a native mobile app planned?** If so, the quiz API should be designed as a clean REST API from day one (it already is per Section 2.4). No additional work needed for V1, but worth confirming the long-term platform strategy.

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| Qbank | Question bank — the standard format for NCLEX prep (UWorld, ATI, Kaplan) |
| NCLEX | National Council Licensure Examination — the nursing licensure exam |
| ADPIE | Assessment, Diagnosis, Planning, Implementation, Evaluation — nursing process framework |
| RAG | Retrieval-Augmented Generation — using uploaded documents to ground AI responses |
| SRS | Spaced Repetition System — algorithm for optimal review timing |
| SATA | Select All That Apply — NCLEX question format (out of scope for V1) |

## Appendix B: Dependencies on Existing Systems

| System | Dependency | Risk |
|--------|-----------|------|
| Supabase Auth | User authentication, RLS policies | Low — stable, well-tested |
| Supabase Postgres | New tables, existing profiles/documents tables | Low — additive schema changes only |
| Anthropic Claude API | Question generation | Medium — external dependency, cost scaling |
| Vercel AI SDK | `generateText` for quiz (not `streamText` — we need complete JSON) | Low — already in use for tutor |
| PostHog | Analytics events | Low — already installed |
| Existing documents table | RAG source for document-based questions | Low — read-only access |
| Existing middleware | Entry routing logic | Medium — must not regress tutor flow |
| Existing `/tutor` route | "Dig Deeper" handoff target | Low — tutor accepts `intent` param already |

---

---

## Appendix C: Product Owner Decisions

The following decisions were made by Michael (founder) on April 24, 2026 and are authoritative for V1 implementation.

**Q1: Quiz length** — Fixed 10 questions. No user selection. No adaptive length.

**Q2: Free tier limits** — No free tier in V1. Quiz is available to trialing users (during 7-day trial) and paid subscribers only. Access gating uses the existing `hasAccess()` middleware — same rules as the tutor.

**Q3: Tutor access during quiz** — Sequential only with "Dig Deeper" handoff as described in Section 1.5 of this spec. No split-screen. Quiz session is saved when user digs deeper; they return via "Back to Quiz" in tutor header.

**Q4: Pricing** — Same tier. Quiz and tutor are both included in all plans (Monthly $24.99, Semester $89, Annual $149). No separate quiz SKU. No premium add-on.

**Q5: Pre-generated question bank** — AI-only for V1. Every question is generated on-the-fly via Claude. No pre-seeded bank. Post-V1, consider building a bank organically from high-quality generated questions (identified by user performance data).

**Q6: Spaced repetition** — Not implemented in V1. Missed questions are captured in `quiz_questions` table (source data for future SRS), but no resurface logic. V2 feature.

**Q7: Leaderboard / gamification** — None for V1. No personal stats dashboard, no competitive features.

**Q8: Study mode vs test mode** — Study mode only. Rationale displays immediately after each answer. No exam-simulation mode in V1.

**Q9: Question deduplication** — Within-session only. Previous question stems in the current session are passed to the generation prompt to prevent repeats. Cross-session deduplication deferred to V2.

**Q10: Mobile app considerations** — No native app planned. Current API-first architecture is sufficient. No additional work for V1.

— Michael | April 24, 2026

---

*End of specification. Implementation authorized per Part D of the revision prompt. Feature flag `quiz_first_enabled` remains `false` on all production profiles until explicit Phase 1 activation.*
