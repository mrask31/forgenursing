# Auth/Login Issue Analysis

## Problem Statement
User reports login issues that were initially attributed to Supabase maintenance (Jan 26 - Feb 2, 2026), but user's other Supabase app works fine, suggesting a ForgeNursing-specific issue.

## Investigation Findings

### 1. **Aggressive Storage Clearing on Login Page**

**Location**: `src/app/(public)/login/page.tsx`

**Issue**: The login page aggressively clears ALL Supabase storage and cookies on EVERY page load:

```typescript
useEffect(() => {
  // CRITICAL: Clear ALL Supabase cookies and storage IMMEDIATELY on page load
  if (typeof window !== 'undefined') {
    clearSupabaseStorage()
    // ... adds cache-busting meta tags
  }
}, [])
```

**Problem**: This happens BEFORE any authentication check, which means:
- If a user has a valid session and navigates to `/login`, their session is immediately destroyed
- The middleware redirects authenticated users to `/login` in some error cases, which then clears their session
- This creates a loop where valid sessions get destroyed

**Impact**: HIGH - This could be causing legitimate users to get logged out unexpectedly

---

### 2. **12-Second Timeout on Login**

**Location**: `src/app/(public)/login/page.tsx` - `handleLogin` function

**Issue**: Login has a hard 12-second timeout:

```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('TIMEOUT'))
  }, 12000)
})

const { data, error } = await Promise.race([
  signInPromise,
  timeoutPromise,
])
```

**Problem**: 
- If Supabase auth takes longer than 12 seconds, login fails with timeout error
- This is very aggressive - most APIs have 30-60 second timeouts
- Could be causing false failures during normal network latency

**Impact**: MEDIUM - May cause intermittent login failures

---

### 3. **Middleware RLS Issues**

**Location**: `middleware.ts`

**Issue**: Middleware tries to check subscription status but may be blocked by RLS:

```typescript
// Fallback to anon key (may be blocked by RLS)
const { data: profile, error } = await supabase
  .from('profiles')
  .select('subscription_status')
  .eq('id', user.id)
  .single()
```

**Problem**:
- If service role key is not set, middleware falls back to anon key
- RLS policies may block anon key from reading profiles table
- This causes middleware to fail secure and redirect to `/billing/payment-required`
- User gets stuck in a redirect loop

**Impact**: HIGH - Could prevent legitimate users from accessing the app

---

### 4. **Middleware Redirects Authenticated Users to Login**

**Location**: `middleware.ts`

**Issue**: When subscription check fails, middleware redirects to `/login`:

```typescript
if ((pathname === '/login' || pathname === '/signup') && user && supabase) {
  // ... subscription check ...
  if (profileError || subscriptionStatus === undefined) {
    console.warn('[Middleware] Could not determine subscription status, blocking access')
    return NextResponse.redirect(new URL('/billing/payment-required', request.url))
  }
}
```

**Problem**:
- If user is on `/login` with valid session but subscription check fails, they get redirected to `/billing/payment-required`
- But if they try to access a protected route and subscription check fails, they might get redirected to `/login`
- This creates potential redirect loops

**Impact**: MEDIUM - Could cause confusion and redirect loops

---

### 5. **Session Refresh Not Happening Properly**

**Location**: `middleware.ts` and `src/app/(public)/login/page.tsx`

**Issue**: Session refresh may not be working correctly:

```typescript
// In middleware:
const { data: { user: authUser } } = await supabase.auth.getUser()
// Note: getUser() automatically refreshes the session if needed
```

**Problem**:
- `getUser()` should refresh expired tokens automatically
- But if the refresh fails (network issue, Supabase issue), user gets logged out
- No retry logic or graceful degradation
- Login page clears storage immediately, preventing any recovery

**Impact**: HIGH - Could be the root cause of login issues

---

### 6. **Excessive Retry Logic on Login**

**Location**: `src/app/(public)/login/page.tsx` - `handleLogin` function

**Issue**: Login has complex retry logic that may be causing issues:

```typescript
const handleLogin = async (e: React.FormEvent, retryCount = 0) => {
  // ... sign in logic ...
  
  if (error) {
    // If it's a session error and we haven't retried yet, clear storage and retry
    if (isSessionError(error) && retryCount === 0) {
      clearSupabaseStorage()
      await new Promise(resolve => setTimeout(resolve, 200))
      return handleLogin(e, 1) // Retry once
    }
  }
}
```

**Problem**:
- Retries on session errors, but only once
- Clears storage before retry, which may not help
- No exponential backoff or proper error handling
- May be masking the real issue

**Impact**: LOW - Retry logic is reasonable, but may hide root cause

---

## Root Cause Analysis

### Most Likely Culprits (in order):

1. **Aggressive Storage Clearing** (HIGH PRIORITY)
   - Login page clears storage on every load
   - This destroys valid sessions
   - Creates logout loops when middleware redirects to login

2. **Middleware RLS Blocking** (HIGH PRIORITY)
   - If service role key is missing, middleware can't read profiles
   - Users get stuck in redirect loops
   - Legitimate users can't access the app

3. **Session Refresh Failures** (MEDIUM PRIORITY)
   - If Supabase session refresh fails, user gets logged out
   - No graceful recovery
   - Combined with aggressive storage clearing, this is catastrophic

4. **12-Second Timeout** (LOW PRIORITY)
   - May cause false failures during network latency
   - But unlikely to be the main issue

---

## Recommended Fixes

### Fix 1: Remove Aggressive Storage Clearing (CRITICAL)

**Change**: Only clear storage when explicitly needed, not on every page load

```typescript
// BEFORE (in login page useEffect):
useEffect(() => {
  clearSupabaseStorage() // ❌ Clears on EVERY page load
}, [])

// AFTER:
useEffect(() => {
  // Only clear if there's an error parameter in URL
  const params = new URLSearchParams(window.location.search)
  if (params.get('error') === 'auth-code-error') {
    clearSupabaseStorage()
  }
}, [])
```

**Impact**: Prevents valid sessions from being destroyed

---

### Fix 2: Ensure Service Role Key is Set (CRITICAL)

**Change**: Verify `SUPABASE_SERVICE_ROLE_KEY` environment variable is set in Vercel

**Steps**:
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Check if `SUPABASE_SERVICE_ROLE_KEY` is set
3. If not, add it with the service role key from Supabase dashboard
4. Redeploy

**Impact**: Allows middleware to bypass RLS and check subscription status

---

### Fix 3: Increase Login Timeout (LOW PRIORITY)

**Change**: Increase timeout from 12 seconds to 30 seconds

```typescript
// BEFORE:
setTimeout(() => reject(new Error('TIMEOUT')), 12000) // 12 seconds

// AFTER:
setTimeout(() => reject(new Error('TIMEOUT')), 30000) // 30 seconds
```

**Impact**: Reduces false timeout failures

---

### Fix 4: Add Better Error Handling in Middleware (MEDIUM PRIORITY)

**Change**: Add fallback logic when subscription check fails

```typescript
// If subscription check fails, allow access but log warning
if (profileError) {
  console.warn('[Middleware] Subscription check failed, allowing access temporarily')
  // Allow access but add header to trigger client-side check
  response.headers.set('X-Subscription-Check-Failed', 'true')
  return response
}
```

**Impact**: Prevents users from getting stuck in redirect loops

---

## Testing Plan

1. **Test with valid session**:
   - Log in successfully
   - Navigate to `/login` directly
   - Should redirect to `/tutor`, not clear session

2. **Test with expired session**:
   - Let session expire (or manually expire token)
   - Try to access protected route
   - Should redirect to login and allow re-authentication

3. **Test without service role key**:
   - Temporarily remove service role key
   - Try to log in
   - Should see subscription check failures in logs

4. **Test with slow network**:
   - Throttle network to 3G
   - Try to log in
   - Should not timeout before 30 seconds

---

## Next Steps

1. **Immediate**: Remove aggressive storage clearing from login page
2. **Immediate**: Verify service role key is set in Vercel
3. **Short-term**: Increase login timeout to 30 seconds
4. **Short-term**: Add better error handling in middleware
5. **Long-term**: Add comprehensive logging and monitoring for auth flows
