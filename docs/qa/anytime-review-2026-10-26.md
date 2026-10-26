# Anytime review queue — October 26, 2026

Michael confirms Stripe preview API/signing settings updated. Redeployment dpl_9G6eTZK6jCeNbVgvbWp7qkUPrbCc on 4ae05fad is READY at forgenursing-f7jypt0sj-michaels-projects-b1fddaa4.vercel.app. This verifies deployment completion only, not payment or webhook acceptance.

New review behavior: pending bank and legacy clinical reviews are listed with counts and per-item Review now actions. The approximate 24h due_at remains the recommendation, with local timezone labels, not a gate. Home and review use the same eligibility/summary copy. Generated and retry misses still do not create bank review entries.

Separate additive service-only RPCs copy existing ownership/content/freshness/idempotency/exhaustion/scoring behavior and remove only time comparisons: start_source_checked_review_anytime; answer_source_checked_review_anytime; answer_scheduled_review_anytime; source_checked_review_status_anytime. Production's original RPCs remain unchanged. The release branch calls new paths. Legacy clinical start in API likewise no longer rejects future recommendations. API lists pending and recommended-now separately. Up to 1000 pending items loaded; the audited bank is below that bound. Future scale beyond that requires queue pagination.

Validation: 237 tests / 38 files, TypeScript and incremental lint pass. API regression verifies future items are present in pending inventory. Actual Postgres synthetic transaction created a fresh original miss with future due_at, confirmed pending_count=1/due empty, started review before due, reopened the same attempt, answered immediately, exhausted its family and retained the original score. All synthetic records rolled back; no learner record dates changed. Browser queue acceptance pending.

Muse: miss a bank original, verify it appears immediately with a future optional recommendation; take it now; refresh/reopen and confirm attempt resumes; submit and confirm separate score/exhaustion; verify counts refresh and Home copy agrees. Check a generated miss creates no bank queue entry. Preserve tutor Back/retry. Bank feature flag/publication must be available; this change does not enable an environment variable or publish production bank content.

Pass purchase/webhook/expiry acceptance remains separate. Courses removal, bank launch publication, positioning sweep, real trial verification, new 30-question drafts/audit and live catalog/production switch remain pending. No production app deployment or live price/subscription mutation.
