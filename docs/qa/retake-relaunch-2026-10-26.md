# Retake relaunch — locked release specification, October 26, 2026

Michael's October 26 handoff supersedes the $9.99/month and $79/year model and general nursing-study positioning. Audience is NCLEX-RN retakers. CPR ratings and exam date become intake, followed by targeted daily bank practice, selected-option feedback, separate immediate retry, suggested next-day review and category progress. Failure is data; no shame, pass prediction or unsupported competitor/statistical claims.

## Locked offer

Seven-day no-card trial. Retake Pass: $29.99 one-time for three months, no renewal. Guarantee accompanies every price: Don't pass? Three more months free. One user-initiated extension at the end of the initial period, no proof or claim process. Mechanics must be explicit: up to six months of access. Server-side expiry and atomic single-use extension are required before checkout switches. Calendar-month arithmetic clamps month-end dates in UTC. New pass purchase must be granted only from verified paid checkout webhook, idempotent by checkout session, with server-owned user binding. Invalid/expired/refunded access cannot be granted by client metadata or subscription_status alone.

The initial foundation defines offer validation and calendar/date-state helpers; these are not yet wired into payment or entitlement and do not claim atomic extension enforcement. Existing subscriptions/access are untouched. Live legacy price archival does not cancel existing subscriptions: their renewal transition needs a deliberate implementation before rollout. Never silently cancel a paid customer's subscription as part of a catalog update.

## Product work and gates

1. Finish pass table/RLS, verified one-time Checkout/webhook grant, entitlement/middleware checks, one atomic extension, Settings purchase/access/extension state, live invoice portal. Sandbox acceptance before production. Archive $129/year and $59/every-four-months legacy prices during coordinated live switch; standard recurring offers retired for new purchases. Terms, FAQ, hero, pricing and checkout all consistent before relaunch. No full live credential is exposed.
2. Bank originals default (b6ec7a35), generated supplement explicit. Default-bank unavailability/exhaustion cannot silently generate. Preview rollout flag and publication still need acceptance. Launch requires 200+ audited questions: 180 current plus about 10 families/30 questions drafted, independently key/citation/distractor audited by Muse, revised and published. Drafts do not count as audited/live. Keep content labeling AI-assisted/source-checked, not independently clinically validated. Taxonomy maps consistently to eight NCLEX categories.
3. Review queue lists all pending items/counts and permits immediate practice. Approximately 24 hours becomes recommendation only. New isolated RPC/preview path must retain ownership, fresh content, separate scoring, resumption and exhaustion without backdating records. No old time-gate acceptance is sufficient for the new requirement.
4. Remove Courses nav/routes/uploaded-notes practice and tutor course selector/context; General-only tutor. Preserve existing conversations and passing Back/retry/pagination. Avoid deleting course-linked history while retiring course UI. Dictionary remains.
5. Password change minimum; name/email/preferences only if scoped implementation is inexpensive. Trial days need real fresh-trial browser acceptance; never extend/backdate the expired test account.
6. Dictionary: one JVD entry with searchable alias terminology and legacy saved-alias recognition; ascites Gastrointestinal. First foundation implements this display cleanup without deleting stored words.
7. Preserve all Muse-accepted tutor, pricing-boundary, auth, recommendation and navigation regressions. Audit old $9.99/$79 pricing acceptance is superseded, not a new-offer pass.
8. Muse preview acceptance 1–7 in the handoff gates production. Then production clean-session pricing → checkout → Stripe verification gates marketing. No mock exam, no clinical approval upgrade. Weekly 1–2-family audited publication is a post-launch operating commitment, not an unaudited automated publish job.

## Foundation acceptance build

Adds password form under Settings/Security: verify current signed-in user's password, then Supabase updateUser; require matching new password of at least 12 characters, explicit success/error, no password logs. Browser acceptance must change only the test account, sign out, verify old password fails and new succeeds. Do not disclose credentials in screenshots or chat.

Adds Retake Pass constants, one-time price validator, calendar-month and state helpers. These are dormant foundations, not a launched money-path change. Adds dictionary canonical view while preserving inline aliases and stored saved data. Removing a canonical saved JVD through the user's explicit action removes its saved aliases as one visible concept.

Validation: 237 tests across 36 files, TypeScript and incremental lint pass. No browser password change, fresh signup, Stripe mutation, schema migration, new-family audit, review gate change, course removal or production deployment claimed in this foundation batch. The old money path remains temporarily intact until the replacement is complete; this is not a relaunch acceptance candidate.
