# Release reliability follow-up — October 14, 2026

## Implemented and locally verified

- Align eslint-config-next 14.2.35 with Next 14.2.35 and pin ESLint 8.57.1. The full lint tool now runs.
- Repair three conditional hook calls across FollowUpPrompts and SuggestedPrompts. Remove no-op debug effects.
- Add an incremental prebuild lint gate. No new errors or hook-order errors are allowed. The full lint report still contains 457 documented legacy type/style errors and 16 warnings; this is not a clean full-lint claim.
- Protect sample answer persistence with a compare-and-swap on the previous answer JSON and unfinished status. A competing submission returns a retryable conflict rather than overwriting a saved answer. Duplicate submissions return the stored first answer, even after completion.
- Validate answer input and feedback shape, bound stalled requests to 20 seconds, preserve the selected answer, and avoid automatic replay. Never display gateway HTML or internal errors to learners.
- Add request references to client requests, server responses/logs and question_answer_failed analytics. Diagnostics include status/failure category, not question text, email, credentials, or raw response bodies. The earlier transient failure's root cause remains unknown.
- Make the tutor evaluation runner fail explicitly when its provider key is absent or any model call fails. Saved responses remain unreviewed; no run grants clinical approval.

Validation: 131 automated tests in 18 files pass, TypeScript passes, incremental lint gate passes, git diff whitespace check passes. New tests cover gateway HTML, malformed success responses, network failure, timeout, malformed input, conditional saves, conflicts, duplicate answers and save failures. The existing database answers column is JSONB, supporting the conditional comparison. No schema changes are required.

## Outstanding acceptance evidence

- Preview build and browser verification must be recorded against the actual deployed commit.
- Signed-in Home, practice/retry, saved results, progress, account and subscription acceptance remain pending an authenticated QA browser session. A unit test is not browser acceptance.
- Actual tutor model responses and the full clinical rubric require evaluation, including uploaded-source/image modes. No local provider key is available; the runner's dry run validates four probe definitions only.
- Independent RN review remains required for exact content packets and tutor outputs. There are no approved packets; scheduled review remains gated. No approval or patient-safety validation is implied by the software checks.
- Recruitment/launch readiness remains unapproved until these acceptance and clinical gates are resolved.

## Authenticated follow-up findings

Secure sign-in succeeded on the preview. Home claimed the sample result (2/3), showed the saved-session entry point, and both Home and /review displayed the unapproved-content gate. Account settings loaded successfully with the existing beta access status.

The signed-in pricing page exposed a legacy branch with a semester plan and founder offers. New purchases now use the same two published offers for every account. The retired founder purchase endpoint returns 410; the standard endpoint rejects semester prices even if an old environment value remains. Existing subscription prices and webhook recognition are unchanged. Legacy payment-required/cancel pages redirect to the current checkout flow; they no longer claim that a card starts the free trial. Checkout failures now clear the spinner and show a retryable error instead of returning success or redirecting between legacy pages.

Regression coverage increased to 136 tests in 19 files, including new offer-route authorization checks. Five legacy lint findings were removed with obsolete billing/pricing code; 452 remain. Revised pricing still needs browser verification on the updated preview before release.
