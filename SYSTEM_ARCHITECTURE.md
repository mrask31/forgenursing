# System Architecture - 7-Day Trial & Welcome Email

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. SIGNUP              2. TRIAL SET           3. EMAIL SENT        4. ACTIVATION
   ↓                      ↓                      ↓                    ↓
[/signup]  →  [/api/auth/set-trial]  →  [Email Queue]  →  [First Quiz]
   │                      │                      │                    │
   │                      │                      │                    │
Creates                Sets                  Sends                Completes
Account              trial_ends_at          Welcome Email         10 Questions
                     = NOW() + 7d
```

## Detailed Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  /signup (page.tsx)                                                      │
│  ├─ User fills form                                                      │
│  ├─ Calls supabase.auth.signUp()                                        │
│  └─ Calls /api/auth/set-trial                                           │
│                                                                           │
│  useUser Hook (hooks/useUser.ts)                                        │
│  ├─ Fetches user + profile data                                         │
│  ├─ Calculates isTrialActive                                            │
│  ├─ Calculates hasAccess                                                │
│  └─ Returns trialDaysRemaining                                          │
│                                                                           │
│  Components                                                              │
│  ├─ UpgradeModal (shows when trial expires)                             │
│  ├─ TrialBanner (shows days remaining)                                  │
│  └─ Protected Routes (check hasAccess)                                  │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  /api/auth/set-trial                                                     │
│  ├─ Receives userId                                                      │
│  ├─ Sets trial_ends_at = NOW() + 7 days                                │
│  └─ Triggers /api/emails/process-welcome-queue                          │
│                                                                           │
│  /api/emails/process-welcome-queue                                      │
│  ├─ Calls get_pending_welcome_emails()                                  │
│  ├─ Sends each email via Resend                                         │
│  └─ Calls mark_welcome_email_sent()                                     │
│                                                                           │
│  /api/emails/send-test-welcome                                          │
│  └─ Test endpoint for development                                        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (Supabase)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  auth.users                                                              │
│  ├─ id (UUID)                                                            │
│  ├─ email                                                                │
│  └─ created_at                                                           │
│                                                                           │
│  profiles                                                                │
│  ├─ id (UUID) → auth.users.id                                           │
│  ├─ subscription_status ('pending_payment', 'trialing', 'active')       │
│  ├─ trial_ends_at (TIMESTAMPTZ) ← NEW!                                 │
│  ├─ stripe_customer_id                                                   │
│  └─ stripe_subscription_id                                               │
│                                                                           │
│  welcome_email_queue ← NEW!                                             │
│  ├─ id (UUID)                                                            │
│  ├─ user_id → auth.users.id                                             │
│  ├─ email                                                                │
│  ├─ trial_ends_at                                                        │
│  ├─ status ('pending', 'sent', 'failed')                                │
│  ├─ sent_at                                                              │
│  ├─ email_id (Resend ID)                                                │
│  └─ attempts                                                             │
│                                                                           │
│  Database Triggers                                                       │
│  ├─ on_auth_user_created → creates profile                              │
│  └─ on_profile_trial_queue_email → queues welcome email                 │
│                                                                           │
│  Database Functions                                                      │
│  ├─ queue_welcome_email() → adds to queue                               │
│  ├─ get_pending_welcome_emails() → returns pending                      │
│  └─ mark_welcome_email_sent() → updates status                          │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Resend (Email Service)                                                  │
│  ├─ Receives email via API                                              │
│  ├─ Delivers to user inbox                                              │
│  ├─ Tracks opens, clicks, bounces                                       │
│  └─ Returns email_id for tracking                                       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS DECISION TREE                          │
└─────────────────────────────────────────────────────────────────┘

User requests protected route
         ↓
    middleware.ts
         ↓
Fetch: subscription_status, trial_ends_at
         ↓
    ┌────────────────────────────────────┐
    │  hasAccess(status, trial_ends_at)  │
    └────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────────┐
    │                                          │
    ↓                                          ↓
subscription_status                    trial_ends_at
= 'active' or 'trialing'?             > NOW()?
    │                                          │
    ↓                                          ↓
   YES ──────────→ GRANT ACCESS ←────────── YES
    │                    ↑                     │
   NO                    │                    NO
    │                    │                     │
    └────────────────────┴─────────────────────┘
                         ↓
                   DENY ACCESS
                         ↓
              Redirect to /checkout
```

## Email Queue Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL QUEUE FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Profile Updated
(trial_ends_at set)
         ↓
Database Trigger Fires
         ↓
queue_welcome_email()
         ↓
INSERT INTO welcome_email_queue
(status = 'pending')
         ↓
    ┌──────────────────────────────────┐
    │  Queue Processing (3 options)    │
    └──────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │                                         │
    ↓                    ↓                    ↓
Immediate           Cron Job            Manual Trigger
(after signup)      (every 5 min)       (API call)
    │                    │                    │
    └────────────────────┴────────────────────┘
                         ↓
         /api/emails/process-welcome-queue
                         ↓
         get_pending_welcome_emails(10)
                         ↓
              ┌──────────────────┐
              │  For each email  │
              └──────────────────┘
                         ↓
              Send via Resend API
                         ↓
                    Success?
                    ↓      ↓
                  YES     NO
                   ↓       ↓
    mark_welcome_email_sent()
    (status = 'sent')  (status = 'failed', attempts++)
                   ↓       ↓
                   └───────┘
                       ↓
              Retry if attempts < 3
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
└─────────────────────────────────────────────────────────────────┘

User Signs Up
     ↓
[email, password]
     ↓
supabase.auth.signUp()
     ↓
auth.users table
     ↓
Trigger: on_auth_user_created
     ↓
profiles table
(subscription_status = 'pending_payment')
     ↓
/api/auth/set-trial
     ↓
UPDATE profiles
SET trial_ends_at = NOW() + INTERVAL '7 days'
     ↓
Trigger: on_profile_trial_queue_email
     ↓
welcome_email_queue table
(status = 'pending')
     ↓
/api/emails/process-welcome-queue
     ↓
Resend API
     ↓
User's Email Inbox
     ↓
User Clicks CTA
     ↓
/tutor?action=start-quiz
     ↓
User Completes Quiz
     ↓
ACTIVATED! 🎉
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

App
├─ AppShell
│  ├─ Sidebar
│  ├─ MobileNav
│  └─ Main Content
│     ├─ useUser() ← Provides access state
│     ├─ UpgradeModal (if !hasAccess)
│     ├─ TrialBanner (if isTrialActive)
│     └─ Protected Content (if hasAccess)
│
├─ Signup Page
│  ├─ Form
│  ├─ supabase.auth.signUp()
│  └─ fetch('/api/auth/set-trial')
│
└─ Middleware
   ├─ Check session
   ├─ Fetch profile
   ├─ hasAccess(status, trial_ends_at)
   └─ Allow/Deny route
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Middleware
├─ Checks every request
├─ Validates session
├─ Checks subscription + trial
└─ Redirects if no access

Layer 2: API Routes
├─ Verify service role key
├─ Validate request body
├─ Use service role for DB access
└─ Error handling

Layer 3: Database (RLS)
├─ Row Level Security enabled
├─ Service role bypasses RLS
├─ Anon key restricted
└─ User can only see own data

Layer 4: Client-Side
├─ useUser hook checks access
├─ Components conditionally render
├─ Upgrade modal for expired trials
└─ Graceful degradation
```

## Monitoring Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING POINTS                             │
└─────────────────────────────────────────────────────────────────┘

1. Signup Success Rate
   └─ Track: signups / signup attempts

2. Trial Set Success Rate
   └─ Track: profiles with trial_ends_at / signups

3. Email Queue Health
   └─ Track: pending count, failed count, avg time to send

4. Email Delivery Rate
   └─ Track: sent / queued (via Resend dashboard)

5. Email Engagement
   └─ Track: opens, clicks (via Resend dashboard)

6. Quiz Completion Rate
   └─ Track: first quiz completed / emails sent

7. Trial Conversion Rate
   └─ Track: paid subscriptions / trials started

8. Access Denials
   └─ Track: middleware redirects to /checkout
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Error Occurs
     ↓
┌────────────────────────────────────┐
│  Where did it happen?              │
└────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────────┐
│                                                  │
↓                    ↓                             ↓
Signup              Trial Set                  Email Send
     ↓                    ↓                          ↓
Show error          Log error                  Mark failed
to user             Continue signup            Retry later
Don't create        (non-blocking)             (attempts < 3)
account                  ↓                          ↓
                    User still                 Alert if
                    gets access                all retries fail
```

---

## Key Design Decisions

### 1. Queue-Based Email System
**Why:** Reliability, retry logic, monitoring
**Alternative:** Direct webhook (less reliable)

### 2. Trial in Database
**Why:** Single source of truth, easy to query
**Alternative:** Calculate from created_at (less flexible)

### 3. Middleware Access Check
**Why:** Centralized, runs on every request
**Alternative:** Check in each component (error-prone)

### 4. Non-Blocking Email
**Why:** Don't fail signup if email fails
**Alternative:** Block signup (bad UX)

### 5. Service Role for APIs
**Why:** Bypass RLS, full database access
**Alternative:** User token (limited access)

---

**This architecture is:**
- ✅ Scalable (queue-based)
- ✅ Reliable (retry logic)
- ✅ Secure (multiple layers)
- ✅ Monitorable (tracking points)
- ✅ Maintainable (clear separation)
