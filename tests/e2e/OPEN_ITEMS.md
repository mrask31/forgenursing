# ForgeNursing QA — Known Issues & Landmines

Living document for bugs, deferred fixes, and known landmines the test suite watches for. Update as items are added, resolved, or re-triaged.

---

## 🔴 LANDMINES (dormant bugs under active regression coverage)

### L-001: Beta login redirect ignores isBetaActive()
- **Discovered:** April 2026 during ADPIE E2E test setup
- **Severity:** Dormant — 0/24 real beta users currently affected
- **File:** `src/app/(public)/login/page.tsx` (redirect logic around lines 240-265)
- **Description:** Login page redirect only checks `hasSubscriptionAccess()`. Beta users with `subscription_status = null` would be incorrectly routed to `/checkout` instead of `/tutor`, locking them out of free beta access.
- **Why it's dormant:** Current signup flow sets `subscription_status` for every user, including beta. All 24 existing beta users have 'trialing' or 'active' — none have NULL.
- **Waking conditions (any of these could trigger real user impact):**
  - Stripe webhook nulls `subscription_status` on a beta user row
  - Signup flow changes to leave `subscription_status` unset for beta users
  - Beta-to-paid conversion transition has a bug
  - A future DB migration resets `subscription_status` on any beta row
- **Regression guard:** `tests/e2e/11-beta-login-regression.spec.ts` — runs under `@regression` tag. Uses the `qa-beta-clone@forgenursing.test` user which permanently mirrors the vulnerable state.
- **Fix when prioritized:** In the login redirect, call `hasAccess(subscriptionStatus, trial_ends_at, is_beta, beta_expires_at)` instead of `hasSubscriptionAccess(subscriptionStatus)`. Requires adding `is_beta`, `beta_expires_at`, `trial_ends_at` to the profile query on the login page.
- **Fix priority:** DEFERRED — will be fixed after 15 paying users or immediately if regression test fires, whichever comes first.
- **Related:** Any PR touching `login/page.tsx`, signup flow, Stripe webhook handlers, or beta profile fields MUST run the full E2E suite including `@regression` tag.

### L-003: Trial expiry paywall does not enforce trial_ends_at — 2 users actively leaking
- **Discovered:** April 13, 2026 during Stripe trial E2E test work (session follow-up to R-001 and R-002)
- **Severity:** ACTIVE — 2 non-beta users currently have expired trials AND `/tutor` access
- **Status:** Partial fix in-progress, stashed locally, NOT committed to main
- **Exposure counts (as of April 13, 2026):**
  - `actively_leaking` (non-beta, trialing, trial_ends_at < NOW): **2**
  - `legitimate_trial_users` (non-beta, trialing, trial_ends_at >= NOW): 4
  - `beta_users_in_trialing_state`: 23 (safe — beta path handled separately)
- **Root cause:** `hasSubscriptionAccess(status)` historically treated `'trialing'` as unconditionally valid, regardless of `trial_ends_at`. The `isTrialActive()` function existed but was never called by the main access check because `hasAccess()` used OR short-circuiting: `hasSubscriptionAccess(status) || isTrialActive(trialEndsAt) || isBetaActive(...)` — and `hasSubscriptionAccess('trialing')` returned true before the date check ever evaluated.
- **Callers of the broken logic (11 total, verified by diagnostic):**
  1. `src/app/(public)/login/page.tsx` — direct `hasSubscriptionAccess()` call at Priority 2
  2. `src/app/auth/callback/route.ts` — direct `hasSubscriptionAccess()` call
  3. `src/components/layout/PublicLayout.tsx` — direct `hasSubscriptionAccess()` call for nav UI state
  4. `middleware.ts:195` — `hasAccess(status, trialEndsAt)` (2-arg, beta flags omitted)
  5. `middleware.ts:277` — `hasAccess(status, trialEndsAt)` (2-arg, beta flags omitted)
  6. `src/lib/entitlement.ts:66` — `hasAccess(...)` (shared helper, feeds 7/8/9)
  7. `src/app/api/chat/route.ts:364` — via entitlement
  8. `src/app/api/process/route.ts:68` — via entitlement
  9. `src/app/actions/binder.ts:21,73` — via entitlement
  10. `src/hooks/useUser.ts:84` — custom inline `isSubscribed || isTrialActive`
  11. `src/app/api/subscription/status/route.ts:130` — custom inline `HAS_ACCESS_STATUSES` constant
- **What's been fixed (stashed, NOT committed):**
  - `src/lib/subscription-access.ts` — `hasSubscriptionAccess` narrowed to `status === 'active'`. `hasAccess` rewritten with explicit branches: paid → (trialing AND isTrialActive) → (isBetaActive) → false.
  - `middleware.ts` — both access-check blocks expanded to select `is_beta, beta_expires_at`; both `hasAccess()` calls pass all 4 args.
  - `src/components/layout/PublicLayout.tsx` — profile select expanded to include `trial_ends_at`; boolean check updated.
  - `src/hooks/useUser.ts` — migrated from inline logic to shared `hasAccess()` and `isTrialActive()`; profile select expanded.
  - `tests/e2e/12-trial-expiry-regression.spec.ts` — new `@regression` test asserting expired-trial user cannot reach `/tutor`.
- **What's NOT fixed (still pending when resumed):**
  - **`src/app/(public)/login/page.tsx`** — Priority 2 (`hasSubscriptionAccess()` at ~line 258) will now return false for trialing users, routing legitimate trial users to `/checkout`. Needs expanded profile select + trial/beta check. Priority 1 (`if (hasStripeSubscription)` block) is an independent pre-existing issue granting lifetime access to anyone with a `stripe_subscription_id`.
  - **`src/app/auth/callback/route.ts`** — direct `hasSubscriptionAccess()` call that inherits the same issue. Profile select doesn't pull `trial_ends_at`, `is_beta`, or `beta_expires_at`.
  - **`src/app/api/subscription/status/route.ts`** — deferred as I-005.
- **Open product design question for next session (MUST ANSWER FIRST):**
  What should Priority 1 in the login page do? Current "any stripe_subscription_id = full access" is overscoped. Options: (a) narrow to valid status list, (b) narrow to recent creation, (c) remove entirely since `/api/stripe/sync-subscription` already handles webhook lag.
- **Stashed state:** `git stash stash@{0}` — "WIP: trial expiry fix — login page + auth callback pending". Pop with `git stash pop`.
- **Verification harness:** 5-gate pattern (smoke + L-001 regression + ADPIE + welcome email + 12-trial-expiry regression) against `http://localhost:3000`.
- **Priority next session:** HIGH. 45-60 minutes estimated.

---

## ⚠️ DEFERRED FEATURES (not bugs — missing functionality)

### D-001: Password reset page
- **Discovered:** April 2026 during auth flows test setup
- **Description:** `/reset-password` route does not exist. The Playwright test for password reset is correctly skipped via `test.skip()`.
- **Impact:** Users who forget their password have no self-service recovery. Must email support@forgenursing.com.
- **Priority:** Post-15-paying-users. Trust/security flow worth adding before major marketing push.

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

### I-005: subscription/status/route.ts has independent inline broken access logic
- **Discovered:** April 13, 2026 during trial expiry audit
- **Description:** `src/app/api/subscription/status/route.ts` defines its own `HAS_ACCESS_STATUSES = ['trialing', 'active']` constant and computes `hasAccess` inline without checking `trial_ends_at`. This is a debug/status endpoint, not an access gate, so it doesn't block users — but it returns incorrect `hasAccess: true` for expired-trial users in its JSON response.
- **Impact:** Low. Any client consuming this endpoint's `hasAccess` field would get a false positive for expired trials. No known client currently gates on this field.
- **Priority:** DEFERRED. Fix when the trial expiry fix (L-003) is committed — align this endpoint with the shared `hasAccess()` function.

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
