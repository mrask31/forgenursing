# ForgeNursing bank screenshots for Muse

The current source-checked bank has 60 families and 180 questions, all published to the preview audience only. No production publication exists as verified October 16, 2026. This is AI-assisted source checking, not independent clinical validation. Do not describe these questions as independently reviewed or approved.

## Storage

- `content/drafts/question-bank-v1.json`: 180 editable draft question records, family/role IDs, sources and rationales.
- `content/drafts/teaching-points.tsv`: teaching cues and takeaways.
- `content/source-checked-bank.json`: 60 compiled frozen packet bundles, each original/retry/one delayed review and packet hash.
- `scripts/clinical/build-source-checked-bank.ts`: compiler.
- Supabase project `gqrpjvmxquipurmhmvfs`, `public.source_checked_content_versions`: runtime publications including packet JSON, version, audience, packet_sha256 and withdrawal state.
- `public.quiz_sessions`, `public.quiz_questions`: real learner attempts, not the canonical bank.
- `public.source_checked_review_queue`, `public.source_checked_review_attempts`, `public.source_checked_exposures`: real scheduling, delayed answers and family-role exposure history.

## Learner routes

On the release branch preview with SOURCE_CHECKED_PRACTICE_ENABLED=true, /quiz starts source-checked generic practice and /review serves eligible missed originals after the genuine 24-hour delay. /quiz?sessionId=<actual-session-UUID> resumes an existing authorized session; it is not a bank-family selector. Practice selects fresh content and cannot directly address qb1-d02 via a family parameter. /answer-trap-check is a separate three-question public sample, not this bank.

API routes: /api/quiz/sessions, /api/quiz/generate, /api/quiz/answer, /api/quiz/retest-weakness, /api/quiz/results and /api/review. Runtime source loader: src/lib/learning/source-checked-server.ts. The production flag and production publication audience gate use of this bank; a trial subscription alone does not enable it.

## Deterministic screenshot preview

Source commit b6abb5f71ee5be6178f37890c5659972848a7394 adds:

- /preview/bank — numbered index of all 60 family IDs.
- /preview/bank/qb1-d02 — original question for that family.
- /preview/bank/qb1-d02?variant=retry — immediate retry.
- /preview/bank/qb1-d02?variant=review — delayed review content, without modifying any genuine queue/due time.

Use the release Vercel preview origin, not forgenursing.com. An authenticated account with current trial, active subscription or other normal study entitlement can open it. Deployment protection, if presented, is separate from app sign-in and is not bypassed by this route. Production returns 404 even after merging. The family page reads the latest database publication and validates its schema/hash/withdrawal/hold state; it does not regenerate a question or silently substitute the draft.

Capture workflow: open family URL; choose Original (default); take question screenshot before selecting; choose the answer from the reel spec and press Submit Answer; take feedback screenshot. Use Show full rationale when that view is required. Reset question returns to the unanswered state. Wrong-answer feedback depends on which choice was submitted. The variant selector also supports retries and delayed content. Local Q001/Q002/Q003 are variant labels within a family; the Word document numbers all 180 questions globally, so qb1-d02 starts at global Question 004.

Reuses QuizQuestion, QuizRationale, QuizProgress and the quiz width/font wrapper. Small staging controls remain above the learner component. This is a staging preview, not a claim that the bank is live on production. For reels, crop around the learner area and do not remove or contradict its source-check disclosure. The screenshot route never writes scores, exposure or review records and does not emit the rationale interaction conversion events. Tutor navigation is disabled in preview. Normal site pageview analytics may still record a preview visit, so exclude preview hosts from learner metrics.

For a mobile screenshot composition, capture the actual rendered mobile viewport and then size the image to 1080x1920; setting a desktop browser viewport to 1080px wide may show the desktop shell. No 1080x1920 screenshots or authenticated mobile rendering have been accepted in this implementation pass: the cloud browser remains blocked by its recorded URL security stop boundary. Muse must verify the live staging rendering before using captures.

## Release timing

No committed production date. Required acceptance remains full tutor rubric, concurrent-chat first-message retest, active/past_due/expired access behavior, authenticated 320/390-width and Safari acceptance, plus browser verification of the recent UI fixes. After these pass: verify production/live Stripe configuration; publish the frozen bank to production audience; enable the production source-checked flag; merge/build with production configuration; smoke-test practice and queue. Do not promote the sandbox-configured preview build into production. The genuine 24-hour delayed review loop was already accepted on October 16; this preview route does not replace that evidence.
