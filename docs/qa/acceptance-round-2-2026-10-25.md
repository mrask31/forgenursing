# Acceptance round 2 — October 25, 2026

User/Muse acceptance: standard pricing and checkout offers pass ($9.99/month, $79/year, seven-day trial); branded 404 passes; signed-out signup and signed-in account notice pass; live billing details pass; /practice reaches /quiz after authentication. Prior user screenshots and confirmation verify live portal opening and return to ForgeNursing. Purchase, cancellation, and payment-method mutations were not exercised.

Review coverage is a product limitation: only eligible source-checked original misses schedule delayed review. Generated and retry misses do not. Queue list/count remain open. Course-to-tutor context passes, with a brief General Tutor flash. Topic diversity remains weak (four of five from a PPE cluster); this is distinct from duplicate stems.

Still reproduced: tutor debrief Back/resume loses feedback and retry; Save/Flag promise absent destinations; raw history titles and blank transcripts; account self-service absent; stale/misclassified course data; JVD aliases and ascites category.

## Tutor feedback return fix

Cause: answer submission advances the persisted session cursor, whereas rationale state was only in the mounted quiz component. Returning to the chooser then resuming loads the next unanswered step.

The successful tutor handoff now writes sessionId and feedbackQuestionId into the current quiz history entry before navigating away. Returning reloads the saved answered question through a read-only authenticated endpoint, restoring rationale and retry eligibility without recording an answer or advancing scores. The endpoint uses RLS and an explicit owner predicate, rejects unanswered questions, and revalidates content holds and withdrawal. Explicit Next clears the return cursor; retry uses the existing separate session path.

Validation: 221 tests across 30 files pass; TypeScript passes. New endpoint tests cover authentication, entitlement, ownership predicate, unanswered solutions, withdrawn content, completed-session feedback and retry-of-retry exclusion. Browser navigation acceptance remains pending; no automated browser pass is claimed.

Acceptance steps: miss an original; open tutor debrief; use browser Back; confirm same selected answer, feedback and retry; refresh and confirm persistence; take retry and confirm separate score; return and continue original; repeat on the final question. Confirm no duplicate answer, session or review entry.

No production deployment, clinical approval, price archival, learner-record rewriting or course-data correction performed in this batch.
