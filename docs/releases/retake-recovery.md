# Retaker recovery release

This release focuses ForgeNursing on a short, repeatable practice routine for NCLEX-RN retakers. It preserves existing account access and billing terms.

## Changes

- Retaker homepage and free three-question entry point; optional exam date, prior preparation, difficulty, and manual CPR category ratings.
- Practice, Progress, and Account navigation; other study tools remain available in a secondary menu.
- Completed public checks attach to the signed-in account and seed a suggested practice focus. Correct-only checks also carry forward. Unclaimed checks remain in browser storage until saved successfully.
- Preferences live in authenticated user metadata, separate from authorization. No schema migration is needed.
- Selected-option explanations take precedence over question-level distractor text. Public questions without option-specific explanations explicitly ask the learner to compare their actual selection with the correct rationale.
- Progress uses observed counts and two full samples of three answers. No mastery, readiness, or unsupported improvement labels. All-correct areas are not called weaknesses.
- Trial endpoint only reads authenticated account access. Existing database signup triggers provision the trial once; it no longer accepts arbitrary user IDs or resets trial/beta dates.
- Malformed generated questions fail with a retry message instead of returning unrelated hardcoded questions. Option labels and per-option explanations are checked. Explanations are not included in newly generated question responses before submission.
- Retests are labeled in stored session data and provide a return path to the source practice session.
- Visual-lesson UI removed from practice. Public pricing and trial language aligned; Stripe price IDs and legacy founder terms remain unchanged.

## Validation

- 16 focused regression tests cover trial authentication/read-only behavior, saved-check ownership and concurrent claims, optional preference validation, report-category prioritization, and honest progress comparisons.
- TypeScript check passes (includes correction of three pre-existing Playwright assertion signatures that blocked compilation).
- The repository-wide Vitest run has existing failures unrelated to this release: two PHI scripts do not register Vitest tests; the system prompt test still expects a retired six-section format. Image PHI checks also require a configured Gemini key. Those tests and the tutor system prompt were not changed.
- Vercel preview build succeeded. Browser review verified the homepage, the public three-question check (including selected-option feedback), its result screen, and navigation to signup. A headline contrast issue found during review was fixed. Authenticated end-to-end and mobile-viewport checks remain pending.

## Before production release

1. Review the preview on desktop and phone.
2. Run authenticated signup/email-confirmation, saved-check handoff, practice/retest, and returning-subscriber checks with a designated test account. Use test billing only.
3. Have a qualified nursing educator review the launch questions and explanations. Schema checks cannot establish clinical correctness. Do not add pass-rate claims or clinical-review badges without evidence.
4. Verify the production Supabase email redirect allowlist for the production callback. Cross-device email confirmation cannot recover anonymous browser-local check credentials; the interface asks users to continue in the original browser.
5. Verify event collection and measure starter-check completion, signup, first practice session, repeat use, and paid conversion. This release does not claim validated conversion or learning outcomes.

Rollback: revert the release commit. No database migration or billing migration is required. Added non-security preference metadata can remain without changing old application behavior.

## Demo refinement — September 18

- The free sample now uses three authored question pairs: potassium interpretation, delegation, and urgent symptoms. Every distractor has its own explanation. Existing database question IDs remain the session identifiers; no bank mutation or schema migration is required. Other bank items are excluded from new public samples.
- Each original miss offers an optional related question before signup. The retry endpoint verifies the anonymous session credential, membership, and an original miss. It returns no answer key before submission and never rewrites the original score. Retry outcomes are explicitly visit-only; only the original check is claimed after signup.
- Mobile question and feedback containers fit their content; removed full-screen minimum heights and flex spacers. Buttons follow the answers. Errors preserve the current phase.
- Homepage describes the teaching loop; repeated limitations and legacy terms removed from the main sales copy. Results list topics from missed questions rather than claiming a diagnosed pattern.
- 27 focused regression tests pass, including content coverage, retry access, answer-key exclusion, and score separation. TypeScript passes.
- Content references: Merck Manual hyperkalemia/hypokalemia, NCSBN National Guidelines for Nursing Delegation, NHS heart attack symptoms. Links appear with each explanation. Reference checking is not independent nursing-educator validation; that release check remains open.
