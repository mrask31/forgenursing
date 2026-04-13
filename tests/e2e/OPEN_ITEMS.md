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

---

## ✅ RESOLVED

_(empty — move items here when fixed, with date and commit SHA)_
