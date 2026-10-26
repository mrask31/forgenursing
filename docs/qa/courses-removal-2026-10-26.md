# Courses removal and checkout return — October 26, 2026

Muse accepted Retake Pass sandbox purchase on October 26: $29.99 one-time, purchased October 26 and access until January 26, 2027, no early extension action. Anytime reviews accepted: 9 pending to 8 after immediate review, saved separately, original score remained 3/5. Expiry/extension browser acceptance remains unverified; synthetic transaction tests are the current evidence. Production rollout remains gated.

This batch removes Courses navigation, makes /classes and /classes/[classId] and /binder redirect to /tutor, removes the uploaded-notes practice choice and course upload workflow from the tutor, and makes TutorContext General-only. Course data is not deleted. Historical conversations are consolidated into General Tutor history, preserving cursor pagination, deduplication and authenticated owner-scoped transcript retrieval. Legacy classId links no longer select a course or cause a class-mismatch redirect; explicit session IDs still receive metadata access checks and load the persisted transcript. Previously attached historical files are retained, not removed.

Login now honors next (and legacy redirect) after successful authentication, including when middleware encounters an already-authenticated login request. The shared return-path validator permits internal paths only and rejects external/protocol-relative/backslash/control-character targets and login/signup loops. Access controls still apply at the destination.

Validation: 239 tests in 39 files pass; TypeScript passes; incremental lint passes with zero new errors (429 legacy errors and 11 warnings remain). Browser acceptance not claimed.

Muse acceptance: no Courses nav or course selector; old course routes redirect sanely; no notes practice or course upload promise; General Tutor new session works; old NUR 400 transcript opens cold from History, refresh and switching work, Load older completes without duplicate IDs; miss -> tutor -> Back retains feedback/retry through refresh, retry scored separately; signed-out Buy -> login -> checkout automatically. Dictionary remains accessible. Production app and live Stripe catalog were not changed.

Still open: broader retaker positioning/site copy, bank-default acceptance and 200+ audited-question gate (30 new questions pending Muse audit), fresh-trial days verification, live catalog/legacy renewal transition and production rollout. Trial expiry and pass expiry/extension must not be simulated by backdating real learner records.
