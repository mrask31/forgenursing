# ForgeNursing QA — Known Issues & Landmines

Living document for bugs, deferred fixes, and known landmines the test suite watches for. Update as items are added, resolved, or re-triaged.

---

## 🔴 LANDMINES (dormant bugs under active regression coverage)

_(No active landmines — L-001 and L-003 resolved in commit 0cd47f5)_

---

## ⚠️ DEFERRED FEATURES (not bugs — missing functionality)

### D-001: Password reset page — CLOSED
- **Discovered:** April 2026 during auth flows test setup
- **Resolved:** Forgot password + reset password pages live as of commit `ae11183`.
- **Description:** `/reset-password` route did not exist. Now implemented.

---

## 📋 OPEN INVESTIGATIONS (monitor, don't fix)

### I-001: Anti-bot 3-second signup timer
- **Discovered:** April 2026 during signup E2E test work
- **Description:** Signup form rejects submissions faster than 3 seconds after page load. Invisible to real users (humans take longer). Relevant if ForgeNursing ever runs conversion funnel experiments or embeds signup in a landing page test.
- **Action:** None required. Log only.

### I-002: Two post-login modals gate the /tutor experience
- **Discovered:** April 2026 during auth flows test setup
- **Description:** AppShell.tsx renders a PHI acknowledgment dialog (if `phi_acknowledged_at` is null) followed by a program selection dialog (if `program_level` is null). Every new user sees both before they can ask a question.
- **Impact:** Unknown — no funnel analytics currently measure drop-off at these gates.
- **Action:** Revisit after 15 paying users. Consider instrumenting with an event when users dismiss each modal, and whether bounce rate at these gates justifies a different flow.

### I-003: Two overlapping email systems coexist in the codebase
- **Discovered:** April 13, 2026 during welcome email pipeline diagnostic
- **Description:** The repo has two separate email subsystems that overlap on some lifecycle days and gap on others:
  - **System 1 (pre-existing):** `process-welcome-queue` (Day 0), `process-beta-sequence` (Day 3, 30, 76), `process-trial-expiration` (Day 6, 7). Uses tables `welcome_email_queue`, `beta_email_sequence`, `trial_expiration_emails`.
  - **System 2 (added later):** `process-onboarding-sequence` (Day 0, 3, 6), `process-beta-reengagement` (Day 7). Uses unified `email_queue` table. Called via `/api/cron/process-emails` → `fn-send-emails` edge function (source not in repo).
- **Gaps vs intended spec:**
  - Full 6-email beta sequence over 90 days: NOT BUILT (System 1 has 3 of 6, System 2 has 1 of 6)
  - Full 5-email trial sequence over 7 days: NOT BUILT (System 1 has 2, System 2 has 3)
- **Risk:** Duplicate sends on overlapping days, missing sends on gap days, template drift between systems, confusion when adding new emails.
- **Status:** DEFERRED. Welcome (Day 0) is now wired via R-001 fix. Beta and trial sequences are partial but not actively broken.
- **Revisit when:** Post-15-paying-users, before any major marketing push that expects a full drip sequence. At that point do a consolidation audit — pick one system, migrate the other, delete the loser.
- **Do NOT:** Add more emails to either system before consolidation. Adding now makes the eventual cleanup harder.

### I-004 (System 1 resolved, System 2 deferred): Email cron routes

**System 1 routes — RESOLVED tonight (April 14, 2026, ~22:30 CDT):**
- `/api/emails/process-trial-expiration` — was 401ing because inline auth check only accepted `Bearer SUPABASE_SERVICE_ROLE_KEY` and `x-cron-secret` header, not `Bearer CRON_SECRET` which is what Vercel cron sends. Added the missing accept branch. DB functions all exist. Should now work end-to-end.
- `/api/emails/process-beta-sequence` — same auth bug as trial-expiration, PLUS called 3 nonexistent DB functions (`queue_beta_sequence_email`, `get_pending_beta_sequence_emails`, `mark_beta_sequence_email_sent`) that should have been named `beta_lifecycle_*`. Fixed the auth check, renamed the three function calls to their lifecycle equivalents, and reshaped the `mark_*_sent` arguments to match the lifecycle signature (`p_queue_id` vs `p_email_id`, `p_error_msg` vs `p_error_message`).

**Why both routes were failing for months/weeks:**
1. Inline auth checks in older routes were written before `CRON_SECRET` was added to Vercel env vars. They were originally invoked via `Bearer SUPABASE_SERVICE_ROLE_KEY` (probably during local testing). When the actual Vercel cron schedule started hitting them, auth always failed.
2. `process-beta-sequence` additionally had a function-name/table-name mismatch. Someone renamed the backend from `beta_sequence` to `beta_lifecycle` in a migration but didn't update the route code to match.

**System 2 routes — STILL BROKEN, deferred to a separate session:**
- `/api/emails/process-beta-reengagement`
- `/api/emails/process-onboarding-sequence`

**Root cause for System 2:** These routes were added in commit `44bad14` (April 13, 2026) and depend on database objects that were never migrated to production:
- Missing table: `public.email_queue`
- Missing functions: `get_beta_day7_eligible_users`, `get_day3_eligible_users`, `get_day6_eligible_users`
- Missing trigger: `queue_onboarding_day_0` on `profiles`

The three SQL files exist in the repo root (`supabase_email_queue.sql`, `supabase_email_eligibility_functions.sql`, `supabase_email_queue_day0_trigger.sql`) but were never applied via `supabase db push` or via the SQL Editor.

**Why we didn't apply them tonight:** The day-0 trigger would become a fourth trigger firing on `profiles` INSERT/UPDATE, on top of three existing triggers (`on_user_signup_start_trial`, `on_profile_trial_started`, `on_profile_trial_queue_email`). Two of the existing triggers already call different welcome-email functions (`send_welcome_email` and `queue_welcome_email`). Adding a fourth trigger without understanding how those existing triggers interact risks spamming beta users with multiple welcome/onboarding emails per signup.

**What needs to happen before applying the System 2 migration (documented here as I-006):**
1. Read the source of `send_welcome_email()` and `queue_welcome_email()` functions in the database
2. Determine which actually sends emails vs which is a no-op
3. Decide whether to consolidate on System 1 (delete System 2 routes), consolidate on System 2 (migrate System 1 functions to the new schema), or run both in parallel with deduplication
4. Apply the System 2 SQL files only after that decision is made

Related open items: I-003 (two overlapping email systems), I-006 (trigger architecture investigation).

### I-006: OPEN — System 2 email architecture decision deferred
- **Discovered:** April 14, 2026
- **Description:** `supabase_email_queue.sql` migration NOT yet applied. Trigger investigation required before applying. See I-004 for full context.

### I-008: welcome_emails_sent column mismatch — CLOSED
- **Discovered:** April 14, 2026
- **Resolved:** Column mismatch resolved as side effect of I-010 fix (DB migration).

### I-009: Trial Day 1/3/5 engagement sequence — CLOSED
- **Discovered:** April 14, 2026
- **Resolved:** Trial Day 1/3/5 engagement sequence live as of commit `9bb9fa5`.

### I-010: Welcome email pg_net failures — CLOSED
- **Discovered:** April 14, 2026
- **Resolved:** Welcome email pg_net failures resolved via DB migration.

### I-011: OPEN — 06-image-upload mobile-safari flaky fail
- **Discovered:** April 15, 2026 during full Playwright suite run
- **Description:** `/tutor` → `/tutor?sessionId=...` redirect race on mobile WebKit causes `page.goto` to throw "Navigation interrupted by another navigation". Desktop passes consistently. `waitUntil: 'networkidle'` did not resolve it.
- **Impact:** Low — not a product bug, purely a test timing issue on mobile WebKit.
- **Action:** Revisit when tutor session redirect logic is refactored.

### I-005: subscription/status/route.ts — CLOSED
- **Discovered:** April 13, 2026 during trial expiry audit
- **Resolved:** Aligned with shared `hasAccess()` function as of commit `1c5d287`.

---

## ✅ RESOLVED

### R-001: Welcome email queue was not wired to any cron
- **Discovered:** April 13, 2026 during E2E welcome email test validation
- **Severity:** Active fire — every new signup was silently skipping their welcome email
- **Root cause:** `/api/emails/process-welcome-queue` route existed and worked, but had no cron entry in `vercel.json`. It only ran when triggered manually. The hourly `/api/cron/process-emails` route called a separate Supabase edge function `fn-send-emails` which either doesn't exist or doesn't touch `welcome_email_queue`.
- **Fix:** Commit `61f7fda` added GET export and `CRON_SECRET` auth check to the processor route, and added `{ "path": "/api/emails/process-welcome-queue", "schedule": "15 * * * *" }` to `vercel.json`. Runs hourly at :15 past the hour.
- **Users affected before fix:** Unknown exact count. Queue showed 30 total rows, only 2 marked `sent` (both from a manual trigger on April 6). Estimate: ~20+ real beta users received no automated welcome, though all 24 current beta users were manually emailed so they're covered.
- **Verified:** April 13, 2026 ~20:50 UTC. Manual Run triggered via Vercel Cron Jobs dashboard. Route returned HTTP 200 in 1.39s, user-agent `vercel-cron/1.0`, confirmed downstream POSTs to Supabase (200) and Resend (200). Both pending rows from today flipped to `status = sent` with valid Resend message IDs (`8b531ddc...`, `b9d77dbc...`). Cron is live on `15 * * * *` schedule going forward.

### R-002: Stripe webhook retry cron was authentication-failing silently (was L-002)
- **Discovered:** April 13, 2026 during welcome cron diagnostic (Vercel log inspection)
- **Resolved:** April 13, 2026 in commit `2fa8838`
- **Root cause:** The route at `src/app/api/stripe/webhook-retry/route.ts` only checked `WEBHOOK_RETRY_SECRET` with fallback to `SUPABASE_SERVICE_ROLE_KEY`. Vercel's cron runner sends `Authorization: Bearer ${CRON_SECRET}`, which was not in the accepted list. Every scheduled invocation on the `*/5 * * * *` schedule returned HTTP 401 and did nothing.
- **Fix:** Added `CRON_SECRET` to the accepted auth tokens in both the GET and POST handlers. Preserved backward compatibility with `WEBHOOK_RETRY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`. Added null-safety so that if `CRON_SECRET` is unset, the accept path is skipped (no `Bearer undefined` vulnerability).
- **Verified:** April 13, 2026 ~16:00 UTC (CDT). Manual Run triggered via Vercel Cron Jobs dashboard. Route returned HTTP 200 twice in sequence at 16:00:13 and 16:00:25. No internal errors. Pre-fix entries (15:35-15:50) all show 401 for contrast.
- **Business impact before fix:** Any failed Stripe webhook (subscription updates, payment events, failed payment notifications) had no working retry mechanism. The impact was minimal given current low paying-user count but would have scaled with business growth. No known real users affected.
- **Related hardening opportunity (DEFERRED):** While investigating L-002, tonight's audit revealed that other cron routes may have inconsistent auth patterns. The working welcome queue route checks both `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`. Other cron routes in the repo (`/api/cron/process-emails`, `/api/emails/process-beta-reengagement`, `/api/emails/process-beta-sequence`, `/api/emails/process-onboarding-sequence`, `/api/emails/process-trial-expiration`) should be audited for the same class of issue. Filed as I-004 below.

### R-003: Beta login redirect now checks isBetaActive (was L-001)
- **Resolved:** April 14, 2026 in commit `0cd47f5` (side effect of L-003 fix)
- **Root cause:** Login page and middleware only checked `hasSubscriptionAccess()`, not beta status. Beta users with `subscription_status = null` were redirected to `/checkout`.
- **Fix:** Login page now uses `hasAccess()` with all 4 params (status, trial_ends_at, is_beta, beta_expires_at). Middleware expanded to select and pass beta columns. PRIORITY 1 shortcut removed entirely.
- **Regression guard:** `tests/e2e/11-beta-login-regression.spec.ts` — now passes against local dev server.

### R-004: Trial expiry paywall enforced — 2 leaking users paywalled (was L-003)
- **Resolved:** April 14, 2026 in commit `0cd47f5`
- **Root cause:** `hasSubscriptionAccess('trialing')` returned true regardless of `trial_ends_at`. The `isTrialActive()` function existed but was never evaluated due to OR short-circuiting.
- **Fix:** `hasSubscriptionAccess` narrowed to only `'active'`. `hasAccess` rewritten: active → allow, trialing+not expired → allow, beta active → allow, else → block. Login page PRIORITY 1 shortcut (any `stripe_subscription_id` = full access) removed. Auth callback updated to use `hasAccess` with full profile context.
- **Exposure before fix:** 2 non-beta users with expired trials had active `/tutor` access.
- **Regression guard:** `tests/e2e/12-trial-expiry-regression.spec.ts`
- **Verified locally:** smoke (3 pass, 1 skip) + L-001 beta regression (pass) + trial expiry regression (pass)
