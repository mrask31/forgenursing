# Tutor history batch — October 25, 2026

## Accepted baseline

User/Muse verified all four tutor return checks on 236b4e45: same feedback on Back and refresh; separate retry score; continuation at next original; final-question retry returns to unchanged original results (3/5, two retry sessions each 1/1). Billing portal and return also accepted. These are browser acceptance reports, not automated browser results.

## Changes

Removed tutor Save and Flag controls that promised unavailable Learning Library/Dashboard destinations. Existing saved/flagged records are untouched. Display-only history title normalization strips markdown, caps title length, and substitutes a neutral label for internal ORIENT and refusal titles in both history drawer and course session lists. Stored titles and messages are not rewritten or deleted.

Transcript loading now binds the chat hook to its session ID, aborts stale history requests, resets loading when the session changes, checks HTTP failures and shows a readable error. Empty saved conversations have explicit copy. History API now requires authentication and an owned chat before reading its messages; database failures return 503 rather than an empty array. Existing RLS remains in effect.

## Validation and acceptance remaining

225 tests / 32 files pass; TypeScript passes. Tests cover title normalization, authenticated ownership, persisted message responses and explicit database failures. No browser recovery pass claimed.

Muse: open a previously blank history item from the drawer and course list; verify saved transcript after refresh and when switching between two conversations; check no Save/Flag controls or phantom tooltips; check markdown/refusal/internal titles display cleanly; recheck tutor Back and separate retry. A genuine zero-message record cannot be reconstructed by this change; empty/error copy must distinguish it from a restored transcript.

Trial-days verification still requires a real mid-trial signup; no existing trial was extended/backdated. Account self-service, course/dictionary record cleanup, review-coverage product decision, Stripe legacy-price cleanup and production rollout remain open. No live prices, subscriptions, learner records or production deployment changed in this batch.
