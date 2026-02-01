# ForgeNursing User Lifecycle Analysis
## Complete State Flow Mapping & Failure Points

**Date:** February 1, 2026  
**Purpose:** Map exact user lifecycle from signup → verification → session → subscription → app access  
**Goal:** Identify where state can break or become inconsistent

---

## Executive Summary

**⚠️ CRITICAL: Email verification is DISABLED in Supabase. Users get immediate session on signup.**

The ForgeNursing auth/subscription flow has **5 critical state transitions** where failures can occur:

1. **Signup → Immediate Session Creation** (no email verification required)
2. **Session Creation → Profile Provisioning** (RLS policies, service role access)
3. **Profile → Subscription Attachment** (Stripe checkout, webhook timing)
4. **Subscription → Access Grant** (status sync, middleware checks)
5. **Login → Session Refresh** (stale tokens, Edge browser caching)

**OBSOLETE CODE PATHS:**
- ❌ Email verification polling (dead code)
- ❌ Auth callback for signup (only used for password reset now)
- ❌ Cross-device verification logic (not needed)
- ❌ Resend email button (not needed for signup)

---

## Phase 1: Signup & Immediate Session Creation

### Entry Point: `/signup` page

**⚠️ EMAIL VERIFICATION IS DISABLED - Users get immediate session on signup**

**User Actions:**
- Enters email, password
- Accepts terms
- Clicks "Create Account"

**System Flow:**

```typescript
// File: src/app/(public)/signup/page.tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: callbackUrl, // NOT USED - verification disabled
  },
})

// With verification disabled, Supabase returns:
// - data.user (authenticated user)
// - data.session (active session immediately)

// Code then checks for session:
const { data: sessionData } = await supabase.auth.getSession()

if (sessionData?.session) {
  // User has immediate session, redirect to checkout
  router.push('/checkout')
  return
}
```

**What Actually Happens:**
1. Supabase creates user account **with immediate session**
2. No email sent (verification disabled)
3. Returns `data.user` AND `data.session` (both present)
4. Frontend should redirect to `/checkout` immediately
5. **BUG:** Frontend may show "Check your email" screen (obsolete code path)

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Duplicate signup** | "Already registered" error | User exists, Supabase returns no user |
| **Session not detected** | Shows verification screen instead of redirecting | Code checks for session but doesn't redirect |
| **Plan parameter lost** | User redirected without plan | localStorage cleared or URL param missing |
| **Obsolete verification UI** | User sees "waiting for email" screen | Dead code path still executes |
| **needsContinue state** | User sees "Click Continue" button | Fallback for missing session (shouldn't happen) |

**Current Issues:**
- ❌ Verification polling code is dead code (wastes resources)
- ❌ "Check your email" screen should never show
- ❌ Resend email button is useless (no email sent)
- ❌ Auth state change listener not needed for signup
- ⚠️ Code has two paths: immediate session vs verification (only first is used)

---

## Phase 2: Profile Provisioning (Database Trigger)

**⚠️ Auth callback is NOT used for signup flow (verification disabled)**

### Profile Creation: Database Trigger (Automatic)

**How it works:**
```sql
-- File: supabase_subscription_status_migration.sql

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.profiles (id, subscription_status)
  VALUES (NEW.id, 'pending_payment')
  ON CONFLICT (id) DO UPDATE SET subscription_status = COALESCE(profiles.subscription_status, 'pending_payment');
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**What Happens:**
1. User signs up via `supabase.auth.signUp()`
2. Supabase inserts row into `auth.users` table
3. **Database trigger fires automatically**
4. Trigger inserts row into `profiles` table with:
   - `id` = user.id
   - `subscription_status` = 'pending_payment'
5. All happens in same transaction (atomic)

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Trigger not installed** | User authenticated but no profile | Migration not run, trigger dropped |
| **Trigger fails silently** | User authenticated but no profile | Function error, permissions issue |
| **Race condition** | Checkout API can't find profile | Query happens before trigger completes (unlikely) |
| **ON CONFLICT logic** | Existing profile not updated | User deleted and recreated, status preserved |

**Current Mitigations:**
- ✅ Trigger uses SECURITY DEFINER (bypasses RLS)
- ✅ ON CONFLICT prevents duplicate key errors
- ✅ COALESCE preserves existing status if profile exists
- ✅ Atomic transaction (user + profile created together)
- ⚠️ No monitoring for trigger failures
- ⚠️ No fallback if trigger doesn't exist

**Auth Callback Still Used For:**
- Password reset flows
- Magic link logins (if enabled)
- OAuth providers (if enabled)
- **NOT used for normal signup** (verification disabled)

---

## Phase 2b: Auth Callback (Password Reset Only)

```typescript
// File: src/app/auth/callback/route.ts

// 1. Exchange code for session
const { error } = await supabase.auth.exchangeCodeForSession(code)

// 2. Get authenticated user
const { data: { user } } = await supabase.auth.getUser()

// 3. Check/create profile (using service role key to bypass RLS)
const { data: profile } = await profileClient
  .from('profiles')
  .select('id, subscription_status, stripe_customer_id')
  .eq('id', user.id)
  .single()

// 4. If no profile, create with pending_payment status
if (!profile) {
  await profileClient.from('profiles').insert({
    id: user.id,
    subscription_status: 'pending_payment',
  })
}

// 5. Sync subscription from Stripe (if customer exists)
if (stripe && customerId) {
  const { data: subs } = await stripe.subscriptions.list({ customer: customerId })
  const sub = subs.find(s => s.status === 'trialing' || s.status === 'active')
  if (sub) {
    await profileClient.from('profiles').update({
      subscription_status: sub.status === 'trialing' ? 'trialing' : 'active',
      stripe_subscription_id: sub.id
    }).eq('id', user.id)
  }
}

// 6. Redirect based on subscription status
if (plan) {
  return NextResponse.redirect(`${appUrl}/checkout?plan=${plan}`)
}
if (!hasSubscriptionAccess(subscriptionStatus)) {
  return NextResponse.redirect(`${appUrl}/checkout`)
}
return NextResponse.redirect(`${appUrl}/tutor`)
```

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Code exchange fails** | Redirect to login with error | Invalid/expired code, network timeout |
| **Profile creation fails** | User authenticated but no profile | RLS policy blocks insert, service role key missing |
| **RLS blocks profile read** | Can't determine subscription status | Anon key used instead of service role |
| **Stripe sync fails** | User has subscription but shows pending | Webhook delayed, API timeout, wrong customer ID |
| **Redirect loop** | Bounces between login/callback | Session not persisted in cookies |
| **Plan parameter lost** | User sent to checkout without plan | URL parsing fails, plan not passed through |

**Current Mitigations:**
- ✅ Service role key used for profile operations (bypasses RLS)
- ✅ Fallback to anon key if service role missing
- ✅ Best-effort Stripe sync on callback
- ✅ Plan parameter preserved through redirect chain
- ⚠️ No retry on profile creation failure
- ⚠️ Silent failure if Stripe sync fails

---

## Phase 3: Profile Provisioning & RLS

### Database Schema: `profiles` table

**Required Fields:**
- `id` (UUID, references auth.users)
- `subscription_status` (text: 'pending_payment' | 'trialing' | 'active' | 'canceled')
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)

**RLS Policies:**

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role can insert profiles (for new user provisioning)
-- This is why service role key is critical in auth callback
```

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Profile not created** | User authenticated but can't access app | RLS blocks insert, service role key missing |
| **Profile read fails** | Middleware can't check subscription | RLS policy too restrictive, anon key used |
| **Orphaned auth user** | User in auth.users but not profiles | Profile creation failed silently |
| **Status not updated** | User paid but still shows pending | Webhook failed, RLS blocks update |

**Current Mitigations:**
- ✅ Service role key used in auth callback for profile creation
- ✅ Fallback to anon key if service role missing
- ✅ Middleware uses service role for subscription checks
- ⚠️ No automated cleanup for orphaned users
- ⚠️ No monitoring for profile creation failures

---

## Phase 4: Checkout & Subscription Creation

### Entry Point: `/checkout` page

**User Actions:**
- Selects plan (monthly/semester/annual)
- Clicks "Continue to Checkout"

**System Flow:**

```typescript
// File: src/lib/stripeClient.ts
const res = await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({ priceId }),
})
const { url } = await res.json()
window.location.href = url // Redirect to Stripe Checkout

// File: src/app/api/stripe/checkout/route.ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: { trial_period_days: 7 },
  payment_method_collection: 'always', // Require card even during trial
  allow_promotion_codes: true,
  success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${appUrl}/billing/cancel`,
  customer_email: user.email,
  client_reference_id: user.id, // CRITICAL: Links session to user
})
```

**Stripe Checkout Flow:**
1. User enters payment info on Stripe-hosted page
2. Stripe creates subscription with 7-day trial
3. Stripe fires `checkout.session.completed` webhook
4. User redirected to `/billing/success`

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **401 Unauthorized** | Checkout fails, redirect to signup | Session expired, cookies cleared |
| **Missing price ID** | Alert shown, checkout aborted | Env var not set, wrong plan name |
| **Duplicate price IDs** | Wrong plan created | Env vars misconfigured |
| **Webhook never fires** | User paid but no access | Webhook URL wrong, secret mismatch |
| **Webhook fires before profile exists** | Can't update profile | Race condition, profile not created yet |
| **client_reference_id missing** | Can't link subscription to user | Session created without user ID |
| **Webhook fails silently** | User paid but status not updated | RLS blocks update, service role missing |

**Current Mitigations:**
- ✅ Price ID validation before checkout
- ✅ Duplicate price ID detection
- ✅ client_reference_id set to user.id
- ✅ Webhook uses service role key (bypasses RLS)
- ✅ Fallback: lookup user by stripe_customer_id if client_reference_id missing
- ⚠️ No retry mechanism for failed webhooks
- ⚠️ No monitoring for webhook delivery

---

## Phase 5: Webhook Processing & Status Update

### Entry Point: Stripe webhook fires

**Webhook Events:**
- `checkout.session.completed` - User completed checkout
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled

**System Flow:**

```typescript
// File: src/app/api/stripe/webhook/route.ts

// 1. Verify webhook signature
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

// 2. Handle checkout.session.completed
const session = event.data.object
const userId = session.client_reference_id // From checkout creation
const customerId = session.customer
const subscriptionId = session.subscription

// 3. Get subscription details
const subscription = await stripe.subscriptions.retrieve(subscriptionId)
const status = subscription.status === 'trialing' ? 'trialing' : 'active'

// 4. Update profile (using service role key)
await supabase.from('profiles').update({
  subscription_status: status,
  stripe_customer_id: customerId,
  stripe_subscription_id: subscriptionId,
}).eq('id', userId)
```

**Status Mapping:**
```typescript
// Stripe Status → ForgeNursing Status
'trialing' → 'trialing'     // ✅ Has access
'active' → 'active'          // ✅ Has access
'past_due' → 'canceled'      // ❌ No access
'unpaid' → 'canceled'        // ❌ No access
'canceled' → 'canceled'      // ❌ No access
'incomplete_expired' → 'canceled' // ❌ No access
```

**Access Rule:**
```typescript
// File: src/lib/subscription-access.ts
const HAS_ACCESS_STATUSES = ['trialing', 'active']
function hasSubscriptionAccess(status) {
  return status != null && HAS_ACCESS_STATUSES.includes(status)
}
```

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Webhook signature invalid** | 400 error, status not updated | Wrong webhook secret, replay attack |
| **User ID not found** | Can't update profile | client_reference_id missing, lookup fails |
| **Profile update fails** | User paid but no access | RLS blocks update, service role missing |
| **Webhook delayed** | User sees "pending" for minutes | Stripe delivery delay, network issues |
| **Webhook never arrives** | User paid but never gets access | Webhook URL wrong, endpoint down |
| **Status mapping wrong** | User has wrong access level | Logic error in status conversion |

**Current Mitigations:**
- ✅ Webhook signature verification
- ✅ Service role key used (bypasses RLS)
- ✅ Fallback: lookup by stripe_customer_id if client_reference_id missing
- ✅ Detailed logging for debugging
- ✅ Login sync as backup (see Phase 6)
- ⚠️ No webhook retry mechanism
- ⚠️ No alerting for webhook failures

---

## Phase 6: Login & Session Management

### Entry Point: `/login` page

**User Actions:**
- Enters email, password
- Clicks "Sign In"

**System Flow:**

```typescript
// File: src/app/(public)/login/page.tsx

// 1. Clear all Supabase storage on page load (CRITICAL)
useEffect(() => {
  clearSupabaseStorage() // Clears localStorage, sessionStorage, cookies
}, [])

// 2. Sign out any existing session
const { data: { user: existingUser } } = await supabase.auth.getUser()
if (existingUser) {
  await supabase.auth.signOut()
  clearSupabaseStorage()
}

// 3. Sign in with password
const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
})

// 4. Sync subscription from Stripe (CRITICAL BACKUP)
await fetch('/api/stripe/sync-subscription', { method: 'POST' })

// 5. Check subscription status
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_status, stripe_subscription_id')
  .eq('id', data.user.id)
  .single()

// 6. Redirect based on access
if (profile?.stripe_subscription_id) {
  // Has Stripe subscription = allow access (webhook may be delayed)
  window.location.replace('/tutor')
} else if (hasSubscriptionAccess(profile?.subscription_status)) {
  window.location.replace('/tutor')
} else {
  window.location.replace('/checkout')
}
```

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Button spins forever** | Login hangs, no redirect | Network timeout, session not created |
| **Edge browser caching** | Stale session, wrong user | Browser cache not cleared, cookies persist |
| **Session error retry loop** | Multiple login attempts | isSessionError() triggers retry, fails again |
| **Sync timeout** | User waits 5+ seconds | Stripe API slow, network issues |
| **Profile read fails** | Can't determine access | RLS blocks read, anon key used |
| **Wrong redirect** | User with access sent to checkout | Status check logic error, null handling |
| **Redirect loop** | Bounces between login/tutor | Middleware blocks access, session not persisted |

**Current Mitigations:**
- ✅ Aggressive storage clearing on page load
- ✅ Sign out existing session before login
- ✅ 12-second timeout on login
- ✅ Retry once on session errors
- ✅ Stripe sync as backup for missed webhooks
- ✅ Priority check: stripe_subscription_id > subscription_status
- ✅ Cache-control headers prevent browser caching
- ⚠️ No exponential backoff on retries
- ⚠️ Sync timeout only 5 seconds (may be too short)

---

## Phase 7: Middleware & Route Protection

### Entry Point: Every page request

**Middleware Flow:**

```typescript
// File: middleware.ts

// 1. Add cache-control headers for login/signup (prevent Edge caching)
if (pathname === '/login' || pathname === '/signup') {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
}

// 2. Create Supabase client with cookie handlers
const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: { get, set, remove }
})

// 3. Get authenticated user (auto-refreshes session)
const { data: { user } } = await supabase.auth.getUser()

// 4. For login/signup: redirect if already authenticated
if ((pathname === '/login' || pathname === '/signup') && user) {
  // Check subscription status using service role key
  const { data: profile } = await adminClient
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()
  
  if (hasSubscriptionAccess(profile?.subscription_status)) {
    return NextResponse.redirect('/tutor')
  } else {
    return NextResponse.redirect('/billing/payment-required')
  }
}

// 5. For protected routes: require authentication
const protectedRoutes = ['/tutor', '/binder', '/readiness', '/settings', '/classes']
if (protectedRoutes.some(route => pathname.startsWith(route))) {
  if (!user) {
    return NextResponse.redirect('/login?redirect=' + pathname)
  }
  // Note: Subscription check happens in page components, not middleware
}
```

**Failure Points:**

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| **Middleware crashes** | Entire site down | Unhandled exception, missing env vars |
| **Supabase client fails** | All routes blocked | Missing env vars, network timeout |
| **getUser() fails** | User logged out unexpectedly | Token expired, session corrupted |
| **Profile read fails** | Can't check subscription | RLS blocks read, service role missing |
| **Redirect loop** | Bounces between pages | Logic error, session not persisted |
| **Edge caching** | Stale user data | Cache headers not set, browser caching |
| **Session not refreshed** | Token expires mid-session | Cookie handlers not working |

**Current Mitigations:**
- ✅ Entire middleware wrapped in try/catch (prevents site crash)
- ✅ Graceful fallback if Supabase not configured
- ✅ Service role key used for subscription checks
- ✅ Aggressive cache-control headers
- ✅ Cookie handlers auto-refresh session
- ✅ Public routes allowed even if middleware fails
- ⚠️ No monitoring for middleware errors
- ⚠️ Subscription check in middleware may be redundant (also in pages)

---

## Critical State Breakage Scenarios

### Scenario 1: Orphaned Auth User (UNLIKELY with trigger)
**Sequence:**
1. User signs up successfully
2. Database trigger should create profile automatically
3. **IF trigger fails or doesn't exist:** User authenticated but no profile
4. Middleware can't check subscription status
5. User stuck in redirect loop

**Detection:**
```sql
-- Find users without profiles (should be ZERO with trigger)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Fix:**
- ✅ Database trigger should prevent this (already implemented)
- Verify trigger is installed: Run migration SQL
- Add monitoring query to alert if orphaned users found
- Auth callback provides backup (creates profile if missing)

---

### Scenario 2: Paid User Without Access
**Sequence:**
1. User completes Stripe checkout
2. Webhook fails or is delayed
3. User redirected to /billing/success
4. Profile still shows 'pending_payment'
5. User can't access app despite paying

**Detection:**
```sql
-- Find users with Stripe subscription but wrong status
SELECT p.id, p.subscription_status, p.stripe_subscription_id
FROM profiles p
WHERE p.stripe_subscription_id IS NOT NULL
  AND p.subscription_status NOT IN ('trialing', 'active');
```

**Fix:**
- Login sync catches this (fetches from Stripe on login)
- Add manual sync button on billing/success page
- Add monitoring for webhook delivery failures

---

### Scenario 3: Stale Session in Edge Browser
**Sequence:**
1. User logs in on Edge with Tracking Prevention enabled
2. Session stored in cookies
3. User closes browser
4. Browser caches login page
5. User returns, sees cached page with old session
6. Login button spins forever (session expired but cached)

**Detection:**
- User reports "button spinning" on login
- Browser: Microsoft Edge with InPrivate or Tracking Prevention

**Fix:**
- ✅ Already implemented: aggressive cache-control headers
- ✅ Already implemented: clear storage on page load
- ✅ Already implemented: sign out existing session before login
- Consider: Add session health check before login attempt

---

### Scenario 4: Obsolete Verification UI Shows (NEW BUG)
**Sequence:**
1. User signs up (email verification disabled)
2. Supabase returns immediate session
3. **BUG:** Code doesn't detect session, shows "Check your email" screen
4. User confused, waits for email that never comes
5. Polling code runs forever (dead code)

**Detection:**
- User reports "waiting for verification email"
- No email sent (verification disabled)
- User has active session but sees verification screen

**Fix:**
- **CRITICAL:** Remove verification UI code path from signup
- Detect session immediately after signup
- Redirect to /checkout if session exists
- Remove polling, resend button, verification screen

---

### Scenario 5: Cross-Device Verification Delay (NO LONGER RELEVANT)
**This scenario doesn't apply - email verification is disabled.**

---

## Recommendations

### CRITICAL Priority (Fix Immediately - Affects User Experience)

**1. Remove Obsolete Verification UI from Signup**
   - Email verification is disabled but UI still shows "Check your email"
   - Users get confused waiting for email that never comes
   - Remove: verification screen, polling code, resend button, auth state listener
   - Keep: immediate redirect to /checkout when session detected

**2. Add Webhook Retry Mechanism**
   - Stripe webhooks can fail silently
   - Add retry logic with exponential backoff
   - Store failed webhooks in database for manual processing

**3. Monitor Database Trigger Health**
   - Alert if trigger is dropped or disabled
   - Query for orphaned users (should be zero)
   - Dashboard to view trigger status

### High Priority (Fix Soon)

4. **Add Subscription Sync Button**
   - On /billing/success page
   - On /settings page
   - Allows users to manually trigger Stripe sync

5. **Improve Error Messages**
   - "Button spinning" → "Login taking longer than expected. Check connection."
   - "Already registered" → "This email is already registered. Sign in instead."
   - Add error codes for debugging

6. **Add Session Health Check**
   - Before login attempt, check if session is valid
   - Clear storage if session is corrupted
   - Reduce "button spinning" issues

### Medium Priority (Fix When Possible)

7. **Clean Up Auth Callback Code**
   - Auth callback is not used for signup (verification disabled)
   - Profile creation logic in callback is redundant (trigger handles it)
   - Keep as safety net but document that it's backup only

8. **Add Webhook Monitoring**
   - Track webhook delivery success/failure
   - Alert on repeated failures
   - Dashboard to view webhook history

9. **Improve RLS Policies**
   - Ensure service role key is always used for critical operations
   - Add fallback logic if service role missing
   - Document which operations require service role

### Low Priority (Nice to Have)

10. **Add User State Dashboard**
    - View user's current state (auth, profile, subscription)
    - Manual override for stuck users
    - Audit log of state changes

11. **Add E2E Tests**
    - Test full signup → checkout → access flow
    - Test webhook failure scenarios
    - Test trigger failure scenarios

12. **Add Telemetry**
    - Track time spent in each state
    - Identify bottlenecks
    - Monitor conversion rates

---

## State Diagram (Updated for No Email Verification)

```
┌─────────────┐
│   Visitor   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Signup    │ ◄─── Failure: Email already exists
└──────┬──────┘
       │
       ▼ (IMMEDIATE - no email verification)
┌─────────────┐
│   Session   │ ◄─── Failure: Session not created
│   Created   │
└──────┬──────┘
       │
       ▼ (AUTOMATIC - database trigger)
┌─────────────┐
│   Profile   │ ◄─── Failure: Trigger not installed
│  Creation   │ ◄─── Failure: Trigger fails
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Checkout   │ ◄─── Failure: Session expired
│   Page      │ ◄─── Failure: Price ID missing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stripe    │ ◄─── Failure: Payment fails
│  Checkout   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Webhook   │ ◄─── Failure: Webhook never fires
│  Processing │ ◄─── Failure: Profile update fails
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │ ◄─── Failure: Status not synced
│Subscription │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  App Access │ ◄─── Failure: Middleware blocks
│   Granted   │
└─────────────┘

OBSOLETE PATHS (Dead Code):
❌ Email Verification
❌ Cross-Device Polling
❌ Resend Email
❌ Auth Callback for Signup
```

---

## Conclusion

**CRITICAL FINDING:** Email verification is disabled, but the signup page still has verification UI code. This is causing user confusion.

The ForgeNursing user lifecycle has **5 critical state transitions** (down from 7 after removing email verification):

1. **Signup → Immediate Session** ⚠️ Verification UI is dead code
2. **Session → Profile** ✅ Database trigger handles this automatically
3. **Profile → Subscription** ⚠️ Webhook failures are silent
4. **Subscription → Access** ✅ Login sync provides backup
5. **Login → Session Refresh** ⚠️ Edge browser caching issues

**Most Critical Issues:**

1. **Obsolete Verification UI** - Users see "Check your email" screen even though verification is disabled. This is confusing and wastes time.

2. **Webhook Reliability** - No retry mechanism. If webhook fails, users pay but don't get access (login sync provides backup but isn't foolproof).

3. **Database Trigger Monitoring** - No way to detect if trigger is dropped or failing. Could lead to orphaned users.

**Good News:**
- ✅ Database trigger prevents orphaned users (better than manual creation)
- ✅ Login sync catches missed webhooks
- ✅ Aggressive cache clearing helps Edge browser issues
- ✅ Service role key used where needed

**Next Steps:**
1. **IMMEDIATE:** Remove verification UI from signup page
2. **HIGH:** Implement webhook retry mechanism
3. **HIGH:** Add database trigger health monitoring
4. **MEDIUM:** Add manual subscription sync button

This analysis provides a complete map of the simplified lifecycle (no email verification) and identifies the most critical issues to fix.
