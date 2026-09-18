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

## Dummy-account release checks — September 18

Tested the hosted preview through authenticated HTTP requests using a dedicated reserved-domain dummy account. Browser checks cover the public flow; this is not a claim of signed-in browser end-to-end coverage.

- Signup returned a session immediately and provisioned a seven-day trial. Password login and a later fresh login passed. Email confirmation is not required by the observed project configuration, so that path was not tested.
- Optional preferences persisted. A completed public check attached to the dummy account; repeating the claim was idempotent. Both remained available after fresh login.
- Found a release blocker: Anthropic returned 404 for retired `claude-sonnet-4-20250514`. Replaced the four remaining calls (practice, retest, tutor, image explanation) with `claude-sonnet-4-6`, the documented replacement: https://platform.claude.com/docs/en/about-claude/model-deprecations.
- On commit `0c41207`, two generated practice questions returned no answer key, saved answers, resisted repeat-answer score changes, and completed with retrievable results. A fresh related retest generated and completed. Progress counted three answers and marked the sample insufficient for a stable pattern. Tutor text streaming passed. Image explanation was not exercised.
- The all-wrong test revealed an inappropriate strongest-area label. Progress now requires at least one correct answer before including a topic in that field.
- Expiring only the dummy account's trial blocked practice with 402. Calling the trial endpoint did not restore access. Temporarily setting its subscription status active granted access despite the expired trial. Original trial status and date were restored. This tests entitlement logic, not Stripe payments or webhooks.
- Subscription lookup returned no subscription; checkout rejected a missing price. No real checkout or charge was created.
- All 27 focused regressions and TypeScript passed after the model replacement; the Vercel preview build passed.

Still required before calling the release fully verified: signed-in browser interaction, Stripe test-mode checkout/webhook, production email redirect configuration, event collection, and independent nursing-educator review. The dummy account remains labeled as a test account with its original trial and no paid subscription.

## Signed-in experience refinement

- Home, Practice, Progress, Account are distinct navigation destinations, with a persistent four-item mobile navigation bar. The closed mobile drawer no longer leaves hidden controls in the tab order.
- Home prioritizes resuming unfinished practice, offers the last completed session, and makes optional plan setup nonblocking. Session-history failures prevent accidentally starting over.
- Practice offers one five-question start action, mixed or topic selection, and uploaded notes as a secondary option. Existing documents no longer silently change the default question source. Starting a new set explains what happens to unfinished practice.
- Question and feedback actions follow the content with less empty space. Results keep actual scores, selected-answer explanations, related-question actions, and clear navigation; repeated pattern-summary panels are removed.
- Progress links to completed sessions for review. Account shows the actual trial expiry, respects active beta access, links to subscription options, and provides subscription support. This does not add automated subscription management.
- Production billing and stored learning records are unchanged. Signed-in browser verification still requires a secure browser login; authenticated API checks from the preceding release remain documented above.

Browser sign-in exposed that expired users were redirected away from Account. `/settings` now requires authentication but not a subscription; practice routes and API entitlement checks retain their existing restrictions. No subscription dates or statuses were changed.


## Retaker flow restoration — September 18

Flow and feature-purpose decisions are recorded in `docs/product/retaker-flow.md`. Home distinguishes related retries, instructions collapse for returning users, unused setup questions are removed, Practice offers suggested focus directly, Progress initially shows three sessions, and mobile drawer no longer duplicates the four tabs. Focus formatting is normalized consistently across recommendations and progress; both use up to 500 answers. Account now has an authenticated, uncached, own-profile endpoint independent of study entitlement, and the browser auth callback returns immediately.

TypeScript passed for this pass. Browser, live account, and clinical validation remain pending; no production deployment. The Account change addresses an observed code-level loading risk but the reported symptom has not yet been reproduced and verified after the fix.


## Final flow review

Clears the prior question before generating another, blocks new-session starts until saved practice has loaded, surfaces session-loading failures, and exposes correct as well as missed answers in saved review. Corrected the results-screen “Try a related question” action, which still opened the tutor, to create a related retry with a return link to the original session. TypeScript and 27 focused recovery tests pass.


### Verification on the completed flow

- Preview for code commit `64e04d3` reached READY. TypeScript passed; 27 focused recovery tests passed.
- Signed-in browser: Home loads; Account renders the correct account/access instead of the timeout; Progress initially shows three sessions; the suggested-practice link selects the matching focus and displays the unfinished-session warning; saved review includes correct and missed answers, and a correct answer expands to its full explanation. Owner answers and unfinished session were not modified.
- Live dummy-account API flow: two new questions generated without answer keys in the prompt response; both answers scored; duplicate submissions could not rewrite answers; completed results saved; a new related retry generated and was answered; progress updated. Account, recommendations, unique focus labels, and prior saved results also passed.
- Limits: this was desktop browser verification plus authenticated API testing, not a complete mobile browser or paid checkout audit. Clinical accuracy requires separate review. Generation requests took tens of seconds in this environment. No production deployment.


## Final release gate — payment hardening

Found and corrected: legacy semester configuration could block the two current plans; the standard checkout endpoint accepted arbitrary Stripe price IDs; checkout completion mapped non-trial subscription statuses to active. Checkout now requires a configured price, rejects already-active accounts, and reflects actual subscription status before granting access or sending confirmation. TypeScript and 30 focused tests pass.

Stripe read-only catalog verification confirms active USD 9.99/month and USD 79/year prices in ForgeNursing's live account. Authored public demo explanations were checked against their linked Merck potassium references, NCSBN delegation guidance, and NHS heart attack guidance. This is source verification, not independent clinician certification or a review of every dynamically generated question.

Remaining release limits: the browser exposes no mobile viewport/device emulation controls; keyboard zoom did not change the viewport. Only a live Stripe account is connected, so no sandbox payment-to-webhook transaction has been completed. Production release stays on hold until the outstanding checks are completed; conditional deployment authorization is recorded from the user.
