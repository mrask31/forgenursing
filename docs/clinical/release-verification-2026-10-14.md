# Retry and review release verification — October 14, 2026

## Verified

- 121 automated tests in 17 files pass, including content/hash checks, review API access, persisted parent-session navigation, and the existing regression suite.
- TypeScript validation passes. A focused React Hooks check passes for all changed client screens. The repository-wide ESLint configuration currently fails before checking files because its legacy configuration loads an incompatible flat React config; this release does not claim a clean full lint run.
- Vercel builds the preview successfully.
- Database integration checks pass inside rolled-back transactions: account isolation, service-only approval/review operations, immutable reviewed content, first-answer idempotence, original-miss scheduling, repeat-answer handling, delayed scheduling, and withdrawal rejection. No synthetic approvals, queue rows, or review attempts remain.
- The clinical content registry, review queue, and review attempts are empty after testing. The security advisor reports no new warning for the new functions. The clinical registry's intentional deny-by-default RLS has no public policy; pre-existing function-search-path and other project warnings are outside this release.
- Browser preview: start the three-question sample, deliberately miss, open and answer a related question, continue, answer the remaining originals, view results, and reach signup. The recap shows 2/3 original answers and the successful retry separately. No account or payment was created.
- One answer submission displayed a recoverable error. The selection was preserved and the next submission succeeded; no root cause was established from available logs. This is not counted as a flawless transport run.
- PostHog captured linked v2 miss/offer/start/load/answer events with one opportunity ID and separate original/retry IDs. QA tagging was true. The all-traffic report shows one pending opportunity while the public report excludes it. The 24-hour window intentionally leaves final rates blank until mature.
- Public and QA retry tables and the future matched delayed-comparison table execute successfully in their existing dashboards. Historical acquisition tiles are preserved.

## Boundaries and remaining clinical work

- There has been no independent RN approval. The eight exported sample pairs are review inputs, not an expanded approved bank.
- The delayed-review queue cannot serve content until a qualified independent reviewer approves exact packets and an operator publishes them. Historical AI-generated misses are not backfilled.
- The tutor probe runner was dry-run validated. Actual model responses, uploaded-source/image modes, and full conversations still require reproducible clinician-scored evaluation. Prompt safeguards are not clinical validation.
- No authenticated browser session was available for the new Home/review screens. Their API/database behavior was tested; a signed-in browser run remains a separate acceptance check.
- The due-cohort database query is an internal operator report until non-owner QA accounts are excluded. Home-IP filtering was not configured.
- Spacing intervals are product defaults, not evidence of optimal scheduling, durable learning, or exam readiness.
