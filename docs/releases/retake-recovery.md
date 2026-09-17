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
- Public-page browser review and hosted-preview status are recorded in the PR.

## Before production release

1. Review the preview on desktop and phone.
2. Run authenticated signup/email-confirmation, saved-check handoff, practice/retest, and returning-subscriber checks with a designated test account. Use test billing only.
3. Have a qualified nursing educator review the launch questions and explanations. Schema checks cannot establish clinical correctness. Do not add pass-rate claims or clinical-review badges without evidence.
4. Verify the production Supabase email redirect allowlist for the production callback. Cross-device email confirmation cannot recover anonymous browser-local check credentials; the interface asks users to continue in the original browser.
5. Verify event collection and measure starter-check completion, signup, first practice session, repeat use, and paid conversion. This release does not claim validated conversion or learning outcomes.

Rollback: revert the release commit. No database migration or billing migration is required. Added non-security preference metadata can remain without changing old application behavior.
