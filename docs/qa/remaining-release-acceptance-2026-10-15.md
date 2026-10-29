# Remaining release acceptance — 2026-10-15

Status: BLOCKED/PENDING, not passed. This is a continuation plan for the already authorized release QA.

## Billing integration

Verified Stripe fixtures are in billing-renewal-results-2026-10-15.json. Their clock is at 2026-11-16T17:00:00Z. The next boundary is genuine signed delivery to the protected preview, followed by stored entitlement and access checks.

Before any protection change, obtain explicit approval for a temporary project-wide Vercel automation bypass used only by the ForgeNursing sandbox webhook. Explain that holders can bypass Vercel protection across this project; application sign-in and Stripe signature verification remain required. Prior connector creation/revocation returned 403, so do not promise automatic cleanup unless verified. Do not ask for the value in chat. A dashboard fallback needs user action if native credential protection blocks it.

1. Read the current sandbox endpoint and preview configuration without exposing secrets. Keep Production configuration untouched.
2. With approval and a confirmed cleanup path, generate the temporary bypass, update the EXISTING sandbox endpoint URL and re-enable it. Retain its matching signing secret. Never use the live webhook/account.
3. Snapshot the designated QA profile's current billing fields. Link only that isolated fixture to each prepared synthetic customer/subscription in sequence. Do not fabricate status success by manually writing the desired subscription_status.
4. Trigger a genuine subscription update event via QA metadata, or resend the original lifecycle event if an authorized supported operation is available. Label current-state reconciliation separately from original renewal-event delivery.
5. Verify succeeded webhook event, the resulting profile status, server entitlement response, and browser access. Expected: active grants access; past_due blocks paid access under current policy; canceled maps to expired and blocks access. Keep beta disabled and do not change real learner trial dates.
6. Restore the exact QA profile state with conditional updates, verify it, disable the sandbox endpoint, revoke the bypass, and verify removal. Stop and report any cleanup failure.
7. Do not delete/finish the simulation until retained evidence and integration work no longer need it.

## Tutor

Run docs/qa/tutor-release-probe-plan-2026-10-15.json against commit 9a3f5c87b3a59c535fc933f5a6fa54ec6af8faad (or record a newer tested configuration). All 27 planned responses are still pending on this configuration. Save exact outputs and actual chat IDs; record each repeat independently. UI observations cannot be substituted with stored text for button/layout claims. AI-assisted source checking is not independent RN review.

## Authenticated mobile acceptance

Use an actual phone browser or a supported viewport-capable browser at 320 and 390 CSS px. Current controlled browser exposes no viewport resizing; prior iframe landing-only evidence does not close these checks.

- Home: all primary controls visible; bottom navigation and upcoming review do not overlap content.
- Practice: setup/source/topic controls usable; empty submit disabled; long options wrap; select/submit locks first answer; feedback and retry button reachable above bottom navigation.
- Retry: fresh related item; refresh resumes; answer saves; return reaches the original session; scores remain separate.
- Results and Progress: original score distinct from retry/review; cards stack; no horizontal overflow or clipped values.
- Account: long email/value wraps; billing status readable; subscription/support controls reachable.
- Tutor: keyboard does not cover input/send; long replies readable; streaming/guard fallback completes; emergency handoff has no study nudges.
- Delayed Review: run only after genuine due time. Upcoming/due copy accurate; fresh delayed variant; saved answer; independent score; refresh resume; completed review unavailable for repeated scoring.

Record device/browser/version, actual CSS width, URL/commit, pass/fail per row and screenshots of any defect. Do not assert Safari acceptance from Chromium.

## Timed gate

Automation 6ad0fc3a1c2c819196ebbf3295b8a665 is enabled for 2026-10-15 22:03 America/Chicago. Queue a6b8231d-5f02-459d-b7a6-fbe10f7f6649 is due 2026-10-16T03:01:31.900607Z. No backdating. Browser availability is still a prerequisite for the end-to-end portion.
