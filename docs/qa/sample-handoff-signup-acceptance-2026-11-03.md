# Free-sample handoff and signup corrections — November 3, 2026

Source brief: [ForgeNursing Sample Handoff + Signup Copy Fix Brief 2026-11-03](https://drive.google.com/file/d/17lUbb0srgzHmzcZEGsB0Y4PILCUlGnMr/view), fetched before implementation. Scope: requested items 1–4, in priority order. Item 5 was not part of this batch.

Started from production main commit 3ea22f5, preserving October 29 public-question rotation, CPR/tutor, lifecycle-email and payment-email changes. The older release branch was not used as the deployment base.

## Item 1 — PASS, shipped first

Production hotfix 40cb674b408710cb6ad8e6ebeb6105a85758fde7 reached READY before the rest of the batch. Browser-read signup and homepage show "$29.99 one-time for 3 months. Nothing auto-renews." and "Don’t pass? One free three-month extension — no proof required." Signup advertises "240+ practice questions — more added weekly." The current source did not contain the reported monthly/cancellation/3,000 claims; the ambiguous next-three wording was still present and was replaced explicitly. No forbidden claim is present in the observed rendered signup or homepage. Retake Pass price and Stripe purchase mechanics were not changed.

## Item 2 — PASS, live browser evidence

Both missed-answer and all-correct result screens show "Start my free trial" and the requested line: "$29.99 one-time after your trial · No credit card required · Don’t pass? The next 3 months are free." Additional copy says the visitor chooses whether to buy, nothing auto-renews, and there is one free three-month extension without proof. "Copy My Result" remains a secondary action. Clicking the trial button reached the signup page.

## Item 3 — PASS, live browser and automated checks

Completed a QA-tagged sample with one missed original and one correctly answered optional retry. Original recap: 2/3; retry shown separately as correct. Trial → signup → browser Back restored the same recap and trial panel. Refresh preserved it. Directly returning to the URL preserved it. Navigating Home, waiting for navigation, then browser Back preserved it. An initial tool navigation sequence returned to about:blank because Back raced the Home transition; repeating with the Home navigation visibly completed passed. It was not counted as an application pass until the controlled sequence succeeded.

Explicit "Start a new sample" reset returned to the intro. Completed a second QA sample at 3/3; its all-correct panel had the same terms and survived refresh.

Implementation stores a versioned, schema-validated completed recap, session/anonymous identifiers and separate retry outcomes on this browser for 30 days. It stores only the latest completed session, does not persist passwords, and is not an entitlement or authoritative score source. Restoration calls neither answer nor completion APIs and does not fire another sample_completed event. Invalid/expired/blocked storage falls back safely; if storage is unavailable, the recap stays available for the visit and the copy-result fallback is explained. Storage failure, expiry, inconsistent scores, latest-session replacement and reset are unit-tested.

## Item 4 — PASS, browser observations plus form-state tests

The password field always shows the existing eight-character minimum and links its rule/error with aria-describedby. Invalid email followed by blur showed the inline email error and matching disabled-button hint. Focusing then leaving an empty password showed the inline password error and eight-character hint. The initial empty form explained that an email was required. Automated tests verify the remaining password/Terms/loading states and that a valid form has no blocking hint. No real credentials were entered, no Terms agreement was accepted, and no signup was submitted. No password policy, signup API, trial access or credential settings were altered.

## Verification and rollout

Main batch 54c5c580404ce316e1934c004df5e4d47a17b4d0 reached Production READY at deployment dpl_2Zu75yeNjxSRqnFyRraWAb4uEfRo, assigned forgenursing.com and www.forgenursing.com. All browser checks above used the live site with qa=1. Two anonymous QA samples and one related retry were the only practice records created; no real learner records were edited/reset, no email was sent and no payment was attempted.

291 tests across 49 files passed. TypeScript and git diff whitespace checks passed. Incremental lint found zero new/blocking errors; 368 documented legacy errors and 11 warnings remain. This is not a full-lint-clean claim. React review covered hook ordering, pageshow listener cleanup, schema-versioned optional storage, accessible field errors, and avoiding API/scoring replay on restore.
