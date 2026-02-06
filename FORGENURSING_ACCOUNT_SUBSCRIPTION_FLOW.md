# ForgeNursing Account Creation & Subscription Flow

**Complete Technical Documentation**

This document provides a comprehensive overview of how ForgeNursing handles user account creation, authentication, subscription management, and access control. Use this as a reference for replicating the flow in other applications.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [User Journey Flow](#user-journey-flow)
6. [Detailed Component Breakdown](#detailed-component-breakdown)
7. [Subscription Access Logic](#subscription-access-logic)
8. [Webhook Processing](#webhook-processing)
9. [Security & Error Handling](#security--error-handling)
10. [Key Implementation Files](#key-implementation-files)

---

## System Architecture Overview

ForgeNursing uses a **serverless Next.js architecture** with:
- **Supabase** for authentication and database
- **Stripe** for payment processing and subscription management
- **Vercel** for hosting and deployment
- **Middleware** for route protection and session management

### High-Level Flow

```
Landing Page → Signup → Auth Callback → Checkout → Stripe Payment → 
Webhook → Profile Update → Onboarding → Protected App
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | React framework with server components |
| **Authentication** | Supabase Auth | User authentication and session management |
| **Database** | Supabase (PostgreSQL) | User profiles, subscription status, app data |
| **Payments** | Stripe | Subscription billing and payment processing |
| **Email** | Resend | Transactional emails (feedback notifications) |
| **Hosting** | Vercel | Serverless deployment |
| **Caching** | Redis | Rate limiting and caching |

---

## Environment Variables

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # For bypassing RLS

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_[key]
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_[id]
NEXT_PUBLIC_STRIPE_PRICE_SEMESTER=price_[id]
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_[id]

# Application URLs
NEXT_PUBLIC_APP_URL=https://www.forgenursing.com

# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-[key]

# Redis (for rate limiting)
REDIS_URL=redis://[connection-string]

# Email (Resend)
RESEND_API_KEY=re_[key]
FEEDBACK_NOTIFICATION_EMAIL=support@forgenursing.com
```

### Environment Variable Usage

- **NEXT_PUBLIC_*** variables are exposed to the browser
- **Service role key** is used server-side to bypass Row Level Security (RLS) when needed
- **Stripe price IDs** correspond to subscription plans in Stripe dashboard
- **NEXT_PUBLIC_APP_URL** is used for consistent redirects across environments

---

## Database Schema

### Profiles Table

The `profiles` table stores user subscription and onboarding state:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status TEXT,  -- 'pending_payment', 'trialing', 'active', 'past_due', 'canceled'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields:**
- `subscription_status`: Controls access to protected routes
- `stripe_customer_id`: Links to Stripe customer
- `stripe_subscription_id`: Links to active Stripe subscription
- `onboarding_completed`: Tracks if user finished onboarding flow
- `onboarding_step`: Current step in onboarding (1-3)

### Webhook Events Table

Tracks Stripe webhook processing for reliability:

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,  -- 'pending', 'processing', 'succeeded', 'failed', 'retrying'
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  succeeded_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  customer_id TEXT,
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Ensures webhook events are processed reliably with retry logic.

---

## User Journey Flow

### 1. Landing Page (`/`)

**File:** `src/app/(public)/page.tsx`

- User arrives at landing page
- Sees hero section, features, pricing
- Clicks "Try it free for 7 days" CTA
- Redirected to `/signup`

**Key Features:**
- Conversion-optimized copy
- Clear value proposition
- Multiple CTAs throughout page
- No authentication required

---

### 2. Signup Page (`/signup`)

**File:** `src/app/(public)/signup/page.tsx`

**Flow:**
1. User enters email and password
2. Client-side validation (email format, password strength)
3. Anti-bot measures (honeypot field, timing checks)
4. Google Analytics event tracking (`sign_up_attempt`)
5. Supabase signup via `supabase.auth.signUp()`
6. Email confirmation sent (if enabled)
7. Redirect to auth callback with plan parameter

**Key Implementation Details:**

```typescript
// Signup with email confirmation
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?plan=${plan}`,
  },
})
```

**Anti-Bot Measures:**
- Honeypot field (hidden input that bots fill)
- Timing check (submission must take > 2 seconds)
- Client-side validation before submission

**Error Handling:**
- Duplicate email detection
- Weak password rejection
- Network error handling
- User-friendly error messages

---

### 3. Auth Callback (`/auth/callback`)

**File:** `src/app/auth/callback/route.ts`

**Purpose:** Exchange auth code for session and set up user profile

**Flow:**
1. Receive auth code from Supabase
2. Exchange code for session (`exchangeCodeForSession`)
3. Create or update user profile in database
4. Set initial subscription status to `pending_payment`
5. Sync subscription from Stripe (if customer exists)
6. Redirect based on subscription status and plan parameter

**Key Logic:**

```typescript
// Exchange code for session
const { error } = await supabase.auth.exchangeCodeForSession(code)

// Create profile with pending_payment status
await profileClient.from('profiles').insert({
  id: user.id,
  subscription_status: 'pending_payment',
  onboarding_completed: false,
  onboarding_step: 0,
})

// Sync from Stripe if customer exists
if (stripe && customerId) {
  const { data: subs } = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  })
  // Update profile with latest subscription status
}

// Redirect logic
if (plan) {
  return NextResponse.redirect(`${appUrl}/checkout?plan=${plan}`)
}
if (!hasSubscriptionAccess(subscriptionStatus)) {
  return NextResponse.redirect(`${appUrl}/checkout`)
}
```

**Redirect Rules:**
- If `plan` parameter exists → `/checkout?plan={plan}`
- If no subscription access → `/checkout`
- If has subscription access → `/tutor`

---

### 4. Checkout Page (`/checkout`)

**File:** `src/app/(public)/checkout/page.tsx`

**Purpose:** Plan selection and Stripe checkout initiation

**Flow:**
1. User selects plan (monthly, semester, annual)
2. Plan details displayed with pricing
3. User clicks "Start 7-Day Free Trial"
4. Client calls `/api/stripe/checkout` to create session
5. Redirect to Stripe Checkout hosted page

**Plan Options:**
- **Monthly:** $29.99/month after 7-day trial
- **Semester:** $119.99 for 4 months (save 33%)
- **Annual:** $239.99/year (save 33%)

**Key Implementation:**

```typescript
// Create Stripe checkout session
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: selectedPriceId,
    successUrl: `${window.location.origin}/billing/success`,
    cancelUrl: `${window.location.origin}/billing/cancel`,
  }),
})

const { sessionId } = await response.json()

// Redirect to Stripe Checkout
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
await stripe.redirectToCheckout({ sessionId })
```

---

### 5. Stripe Checkout API (`/api/stripe/checkout`)

**File:** `src/app/api/stripe/checkout/route.ts`

**Purpose:** Create Stripe checkout session with 7-day trial

**Flow:**
1. Verify user authentication
2. Get or create Stripe customer
3. Create checkout session with trial period
4. Return session ID to client

**Key Configuration:**

```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{
    price: priceId,
    quantity: 1,
  }],
  subscription_data: {
    trial_period_days: 7,  // 7-day free trial
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',  // Cancel if no payment method
      },
    },
  },
  success_url: successUrl,
  cancel_url: cancelUrl,
  allow_promotion_codes: true,  // Allow coupon codes
})
```

**Important Details:**
- Trial period: 7 days
- Requires payment method upfront
- Subscription auto-starts after trial
- Supports promotion codes
- Customer ID stored in profile

---

### 6. Stripe Payment & Subscription Creation

**External Process (Stripe Hosted)**

1. User enters payment information on Stripe Checkout page
2. Stripe validates payment method
3. Stripe creates subscription in `trialing` status
4. Stripe redirects to success URL
5. Stripe sends webhook events to `/api/stripe/webhook`

**Webhook Events Sent:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `checkout.session.completed`
- `invoice.payment_succeeded` (after trial)
- `customer.subscription.trial_will_end` (3 days before)

---

### 7. Stripe Webhook Handler (`/api/stripe/webhook`)

**File:** `src/app/api/stripe/webhook/route.ts`

**Purpose:** Process Stripe events and update user profiles

**Flow:**
1. Verify webhook signature
2. Parse event type
3. Log event to `webhook_events` table
4. Process event based on type
5. Update user profile with subscription status
6. Mark webhook as succeeded/failed

**Handled Events:**

```typescript
switch (event.type) {
  case 'customer.subscription.created':
  case 'customer.subscription.updated':
    // Update subscription status (trialing, active, past_due, canceled)
    await supabase.from('profiles').update({
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
    }).eq('stripe_customer_id', subscription.customer)
    break
    
  case 'customer.subscription.deleted':
    // Mark subscription as canceled
    await supabase.from('profiles').update({
      subscription_status: 'canceled',
    }).eq('stripe_subscription_id', subscription.id)
    break
    
  case 'invoice.payment_failed':
    // Mark subscription as past_due
    await supabase.from('profiles').update({
      subscription_status: 'past_due',
    }).eq('stripe_customer_id', invoice.customer)
    break
}
```

**Webhook Reliability:**
- All events logged to `webhook_events` table
- Retry logic for failed events
- Idempotency using `stripe_event_id`
- Status tracking (pending, processing, succeeded, failed)

---

### 8. Billing Success Page (`/billing/success`)

**File:** `src/app/(app)/billing/success/page.tsx`

**Purpose:** Confirm payment and redirect to onboarding

**Flow:**
1. Display success message
2. Wait 2 seconds for webhook processing
3. Auto-redirect to `/onboarding`

**Key Features:**
- Celebrates successful subscription
- Automatic redirect (no user action needed)
- Handles webhook delay gracefully

---

### 9. Onboarding Flow (`/onboarding`)

**File:** `src/app/(app)/onboarding/page.tsx`

**Purpose:** Guide new users through first-time setup

**Flow:**
1. Check onboarding status via `/api/onboarding/status`
2. Display current step (1-3)
3. Progress through steps:
   - **Step 1:** Upload first material (textbook, notes)
   - **Step 2:** Ask first question and see AI response
   - **Step 3:** See the magic (feature overview)
4. Mark onboarding as completed
5. Redirect to `/tutor`

**Step Details:**

**Step 1: Upload Material**
- User uploads PDF, DOCX, or TXT file
- File processed and stored in Supabase storage
- Vector embeddings created for RAG
- Progress saved to database

**Step 2: Ask Question**
- User asks a sample question
- AI generates personalized response using uploaded material
- Demonstrates core value proposition
- Response saved for Step 3

**Step 3: Feature Overview**
- Shows AI response from Step 2
- Highlights key features
- Recommended first action: "Go to Clinical Tutor"
- Completion button redirects to app

**Skippable:**
- User can skip onboarding at any time
- "Skip for now" button on each step
- Redirects to `/tutor` (or `/checkout` if no subscription)

---

### 10. Protected App Access

**Middleware:** `middleware.ts`

**Purpose:** Protect routes and enforce subscription access

**Flow:**
1. Check if route is public or protected
2. Verify user authentication
3. Check subscription status from database
4. Allow/deny access based on status
5. Redirect to appropriate page if denied

**Route Categories:**

**Public Routes (No Auth Required):**
- `/` (landing page)
- `/login`
- `/signup`
- `/auth/callback`
- `/privacy`
- `/terms`
- `/checkout`
- `/billing/payment-required`

**Protected Routes (Auth + Subscription Required):**
- `/tutor` (main app)
- `/clinical-desk`
- `/binder`
- `/readiness`
- `/settings`
- `/classes`
- `/help`
- `/onboarding`

**Access Control Logic:**

```typescript
// Check subscription status
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_status')
  .eq('id', user.id)
  .single()

const hasAccess = hasSubscriptionAccess(profile.subscription_status)

// Redirect if no access
if (isProtectedRoute && !hasAccess) {
  return NextResponse.redirect(new URL('/checkout', request.url))
}
```

**Subscription Status Values:**
- `pending_payment` → No access (redirect to checkout)
- `trialing` → Full access (7-day trial)
- `active` → Full access (paid subscription)
- `past_due` → No access (payment failed)
- `canceled` → No access (subscription ended)

---

## Subscription Access Logic

### Access Rules

**File:** `src/lib/subscription-access.ts`

```typescript
export const HAS_ACCESS_STATUSES = ['trialing', 'active'] as const

export function hasSubscriptionAccess(status: string | null | undefined): boolean {
  return status != null && HAS_ACCESS_STATUSES.includes(status)
}
```

**Access Granted:**
- `trialing` - User in 7-day free trial
- `active` - User has paid subscription

**Access Denied:**
- `pending_payment` - No payment method added
- `past_due` - Payment failed
- `canceled` - Subscription ended
- `null` / `undefined` - No subscription

### Entitlement Checking

**File:** `src/lib/entitlement.ts`

Server-side utility for checking user entitlement:

```typescript
export async function getEntitlementForUser(userId: string) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single()

  return {
    userId,
    status: profile.subscription_status,
    hasAccess: hasSubscriptionAccess(profile.subscription_status),
    stripe_customer_id: profile.stripe_customer_id,
    stripe_subscription_id: profile.stripe_subscription_id,
  }
}
```

**Usage in API Routes:**

```typescript
const { data: { user } } = await supabase.auth.getUser()
const entitlement = await getEntitlementForUser(user?.id)

if (!entitlement.hasAccess) {
  return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
}
```

---

## Webhook Processing

### Webhook Event Lifecycle

1. **Receive:** Stripe sends webhook to `/api/stripe/webhook`
2. **Verify:** Validate webhook signature
3. **Log:** Insert event into `webhook_events` table
4. **Process:** Update user profile based on event type
5. **Mark:** Update webhook status (succeeded/failed)
6. **Retry:** Failed webhooks retried automatically

### Webhook Retry Logic

**File:** `src/app/api/stripe/webhook-retry/route.ts`

```typescript
// Get failed webhooks for retry
const { data: webhooks } = await supabase.rpc('get_webhooks_for_retry', {
  max_attempts: 5,
  retry_delay_minutes: 5,
})

// Retry each webhook
for (const webhook of webhooks) {
  await processWebhookEvent(webhook)
}
```

**Retry Rules:**
- Max 5 attempts per webhook
- 5-minute delay between retries
- Exponential backoff (optional)
- Manual retry endpoint available

### Webhook Monitoring

**File:** `src/app/api/monitor/trigger-health/route.ts`

Health check endpoint for monitoring webhook processing:

```typescript
const { data: stats } = await supabase.rpc('get_webhook_stats')

return NextResponse.json({
  total_events: stats.total_events,
  succeeded: stats.succeeded,
  failed: stats.failed,
  success_rate: (stats.succeeded / stats.total_events) * 100,
})
```

---

## Security & Error Handling

### Authentication Security

1. **Session Management:**
   - Supabase handles JWT tokens
   - Tokens stored in HTTP-only cookies
   - Auto-refresh on expiration
   - Middleware validates on every request

2. **Row Level Security (RLS):**
   - Database policies enforce user isolation
   - Users can only access their own data
   - Service role key bypasses RLS when needed (admin operations)

3. **Anti-Bot Measures:**
   - Honeypot fields on signup
   - Timing checks (min 2 seconds)
   - Rate limiting via Redis
   - Google Analytics tracking

### Payment Security

1. **Stripe Integration:**
   - PCI-compliant hosted checkout
   - No card data touches our servers
   - Webhook signature verification
   - Idempotent event processing

2. **Subscription Validation:**
   - Server-side status checks
   - Middleware enforcement
   - API route protection
   - Client-side status polling

### Error Handling

1. **Middleware Resilience:**
   - Try-catch wrapper around entire middleware
   - Graceful degradation on errors
   - Public routes always accessible
   - Detailed error logging

2. **Webhook Reliability:**
   - All events logged to database
   - Automatic retry on failure
   - Manual retry endpoint
   - Status monitoring dashboard

3. **User Experience:**
   - Friendly error messages
   - Automatic redirects on auth errors
   - Loading states during async operations
   - Fallback UI for failed states

---

## Key Implementation Files

### Authentication & Auth Flow
- `src/app/(public)/signup/page.tsx` - Signup form
- `src/app/(public)/login/page.tsx` - Login form
- `src/app/auth/callback/route.ts` - Auth callback handler
- `middleware.ts` - Route protection and session management

### Subscription & Payments
- `src/app/(public)/checkout/page.tsx` - Plan selection
- `src/app/api/stripe/checkout/route.ts` - Create checkout session
- `src/app/api/stripe/webhook/route.ts` - Process Stripe webhooks
- `src/app/api/stripe/webhook-retry/route.ts` - Retry failed webhooks
- `src/app/api/subscription/status/route.ts` - Check subscription status
- `src/lib/stripeClient.ts` - Client-side Stripe integration

### Subscription Access Control
- `src/lib/subscription-access.ts` - Access rules
- `src/lib/entitlement.ts` - Server-side entitlement checking

### Onboarding
- `src/app/(app)/onboarding/page.tsx` - Onboarding orchestrator
- `src/components/onboarding/Step1Upload.tsx` - Upload material
- `src/components/onboarding/Step2Ask.tsx` - Ask question
- `src/components/onboarding/Step3Magic.tsx` - Feature overview
- `src/app/api/onboarding/status/route.ts` - Onboarding status API

### Post-Payment
- `src/app/(app)/billing/success/page.tsx` - Payment success
- `src/app/(app)/billing/cancel/page.tsx` - Payment canceled
- `src/app/(app)/billing/payment-required/page.tsx` - No subscription

### Database & Types
- `src/types/database.ts` - TypeScript types for database
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server Supabase client

---

## Complete User Journey Summary

### New User Flow (Happy Path)

1. **Discovery:** User lands on `/` from marketing
2. **Signup:** User creates account at `/signup`
3. **Auth:** Callback creates profile with `pending_payment` status
4. **Checkout:** User selects plan at `/checkout`
5. **Payment:** User enters payment on Stripe Checkout
6. **Webhook:** Stripe updates profile to `trialing` status
7. **Success:** User sees success page at `/billing/success`
8. **Onboarding:** User completes 3-step onboarding
9. **App Access:** User accesses `/tutor` with full features
10. **Trial End:** After 7 days, subscription auto-converts to `active`

### Returning User Flow

1. **Login:** User logs in at `/login`
2. **Auth Check:** Middleware validates session
3. **Status Sync:** Auth callback syncs subscription from Stripe
4. **Access:** User redirected to `/tutor` if has access
5. **Checkout:** User redirected to `/checkout` if no access

### Subscription Lifecycle

```
pending_payment → trialing (7 days) → active (paid) → past_due (failed) → canceled
                     ↓                      ↓
                  [Full Access]        [Full Access]
```

---

## Replication Checklist

To replicate this flow in another application:

### 1. Setup Infrastructure
- [ ] Create Supabase project
- [ ] Create Stripe account
- [ ] Set up Vercel project
- [ ] Configure environment variables

### 2. Database Setup
- [ ] Create `profiles` table with subscription fields
- [ ] Create `webhook_events` table for reliability
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database functions for webhook retry

### 3. Authentication
- [ ] Implement signup page with validation
- [ ] Implement login page
- [ ] Create auth callback handler
- [ ] Set up middleware for route protection

### 4. Subscription Flow
- [ ] Create checkout page with plan selection
- [ ] Implement Stripe checkout session creation
- [ ] Set up webhook endpoint with signature verification
- [ ] Implement webhook event processing
- [ ] Create subscription status checking API

### 5. Access Control
- [ ] Define subscription access rules
- [ ] Implement middleware subscription checks
- [ ] Create entitlement checking utilities
- [ ] Protect API routes with subscription validation

### 6. User Experience
- [ ] Create onboarding flow (optional)
- [ ] Implement success/cancel pages
- [ ] Add payment required page
- [ ] Create subscription management UI

### 7. Monitoring & Reliability
- [ ] Set up webhook retry logic
- [ ] Create health check endpoints
- [ ] Implement error logging
- [ ] Add analytics tracking

### 8. Testing
- [ ] Test signup → checkout → payment flow
- [ ] Test webhook processing
- [ ] Test subscription access control
- [ ] Test trial → paid conversion
- [ ] Test payment failure handling
- [ ] Test subscription cancellation

---

## Additional Notes

### Stripe Configuration

**Required Stripe Setup:**
1. Create products and prices in Stripe dashboard
2. Set up webhook endpoint in Stripe dashboard
3. Configure webhook events to send:
   - `customer.subscription.*`
   - `invoice.*`
   - `checkout.session.completed`
4. Copy webhook signing secret to environment variables
5. Enable customer portal for self-service management

### Supabase Configuration

**Required Supabase Setup:**
1. Enable email authentication
2. Configure email templates (optional)
3. Set up RLS policies on `profiles` table
4. Create service role key for admin operations
5. Configure CORS for production domain

### Production Considerations

1. **Rate Limiting:** Implement rate limiting on signup/login
2. **Email Verification:** Enable email confirmation for signups
3. **Monitoring:** Set up error tracking (Sentry, LogRocket)
4. **Analytics:** Track conversion funnel (Google Analytics, Mixpanel)
5. **Customer Support:** Integrate support chat (Intercom, Crisp)
6. **Compliance:** Add privacy policy and terms of service
7. **Backup:** Regular database backups
8. **Scaling:** Monitor Supabase and Stripe usage limits

---

## Conclusion

This documentation provides a complete reference for ForgeNursing's account creation and subscription flow. The system is designed for:

- **Reliability:** Webhook retry logic ensures no missed payments
- **Security:** RLS, middleware protection, and Stripe PCI compliance
- **User Experience:** Smooth onboarding and clear subscription status
- **Maintainability:** Clean separation of concerns and typed interfaces

Use this as a blueprint for implementing similar subscription-based SaaS applications.
