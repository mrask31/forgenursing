# ForgeNursing retaker flow

Decision: help an NCLEX-RN retaker turn a missed practice answer into a useful next action. Every primary screen must support starting, understanding, applying, or reviewing practice.

## Core journey

1. Public visitor tries three questions with explanations and optional related retries before creating an account.
2. Home offers one primary action: resume unfinished practice, otherwise start a short suggested session. No mandatory questionnaire.
3. Practice offers a three-question suggested focus when there is sufficient history, five mixed questions, or an explicitly chosen topic. Starting new work explains that the unfinished set ends.
4. Each answer shows the relevant cue, correct-answer rationale, and explanation for the selected option. Tutor is contextual help. A related question is optional after a miss.
5. Session summary preserves original answers and links to review and Home. A related retry must remain distinguishable from the original session.
6. Progress shows actual answer counts, a suggested review area, and three recent completed sessions with an expandable history. Trends describe small practice samples, not readiness.
7. Account provides identity, access status, plan editing, and support even after study access expires.

## Feature purpose and disposition

| Feature | Purpose | Decision |
| --- | --- | --- |
| Optional performance report ratings | Choose an initial practice category | Keep; no upload required |
| Optional exam date | Remember the learner's planning date | Keep; no readiness countdown |
| Previous prep and hardest-part questionnaire | No current effect on practice | Remove from setup; preserve existing stored values |
| Suggested focus | Choose a useful next set from missed answers | Keep; explain basis; allow mixed practice |
| Related retry | Apply the explanation to a fresh question | Keep; optional and clearly labeled |
| Tutor | Resolve confusion about a question | Keep contextual; standalone access secondary |
| Medication dictionary | Look up a medication during review | Secondary reference only |
| Courses | Retrieve previously saved course materials | Secondary legacy access; no required course setup |
| Uploaded notes and saved tutor history | Revisit existing learning materials | Secondary; never required to begin |
| Repeated instructional cards | Explain the routine | Expand for new users; collapse for returning users |
| Duplicate navigation | None on mobile | Bottom tabs own core navigation; drawer holds secondary tools/help |
| Long session feed | Retrieve prior explanations | Show three initially; expand on request |
| Pass predictions, confidence scores, streak pressure | Not supported by observed learning evidence | Exclude from core flow |

No new paid tier, billing change, database migration, or production release is part of this restoration.

## Review and release gates

Implementation review comes first. Browser and dummy-account testing remain deferred until the revised flow is accepted. Then verify new and returning users, resume/retry transitions, saved answers, tutor context, report-based starting focus, category aggregation, expired access, Account loading, and mobile navigation. Clinical content review and payment verification are separate from visual/code checks. Do not describe this branch as production ready before those gates pass.
