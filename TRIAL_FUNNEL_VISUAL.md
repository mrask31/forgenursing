# Trial Funnel - Visual Flow

## 📊 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER TRIAL JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

DAY 0: SIGNUP & ACTIVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User Signs Up (No Credit Card)
         ↓
trial_ends_at = NOW() + 7 days
         ↓
📧 WELCOME EMAIL SENT
Subject: You're in! Your 7-day ForgeNursing trial starts now 🩺
         ↓
    ┌────────────────────────────────────┐
    │  The 7-Day Promise                 │
    │  The 2026 Edge                     │
    │  [Take Your First 10-Question Quiz]│
    └────────────────────────────────────┘
         ↓
User Clicks → Completes Quiz → ACTIVATED! ✅
         ↓
    (35% complete quiz within 24h)


DAY 1-5: ENGAGEMENT PERIOD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User practices questions
User uploads study materials
User builds custom study plan
         ↓
    (System tracks progress)
         ↓
questions_answered: 47
performance_data: Saved
study_plan: Generated


DAY 6: URGENCY NUDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cron Job Runs (12pm UTC)
         ↓
Finds users: trial_ends_at in 24h
         ↓
📧 DAY 6 EMAIL SENT
Subject: ⏳ 24 Hours Left: Your NCLEX progress is on the line
         ↓
    ┌────────────────────────────────────┐
    │  ⏳ Expires Tomorrow               │
    │  You've completed 47 questions     │
    │  Don't lose your streak!           │
    │  [Upgrade to Pro & Keep Progress]  │
    └────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │                                      │
    ↓                                      ↓
User Upgrades                      User Ignores
(15% convert)                      (85% continue)
    │                                      │
    ↓                                      ↓
CONVERTED! 🎉                      Continue to Day 7
subscription_status = 'active'
(Skip Day 7 email)


DAY 7: TRIAL EXPIRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cron Job Runs (12pm UTC)
         ↓
Finds users: trial_ends_at < NOW()
         ↓
📧 DAY 7 EMAIL SENT
Subject: Your trial has expired. Your data is safe.
         ↓
    ┌────────────────────────────────────┐
    │  🔒 Account: Read-Only             │
    │  Your 47 questions are saved       │
    │  Continue with 2026 NCLEX content  │
    │  [Choose a Plan & Unlock Now]      │
    └────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │                                      │
    ↓                                      ↓
User Upgrades                      User Ignores
(10% convert)                      (90% lost)
    │                                      │
    ↓                                      ↓
CONVERTED! 🎉                      Account Locked
subscription_status = 'active'     (Future win-back)


CONVERSION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

100 Signups
    ↓
35 complete quiz (Day 0)
    ↓
15 upgrade on Day 6
    ↓
9 upgrade on Day 7
    ↓
24 TOTAL CONVERSIONS (24% rate)
```

## 📧 Email Sequence Timeline

```
Day 0    Day 1    Day 2    Day 3    Day 4    Day 5    Day 6    Day 7
  │        │        │        │        │        │        │        │
  📧       ·        ·        ·        ·        ·        📧       📧
  │        │        │        │        │        │        │        │
Welcome    │        │        │        │        │     Urgency  Expired
  │        │        │        │        │        │        │        │
  ↓        ↓        ↓        ↓        ↓        ↓        ↓        ↓
[Quiz] [Practice] [Study] [Review] [Prep] [Learn] [Upgrade] [Unlock]
  │        │        │        │        │        │        │        │
 35%      ·        ·        ·        ·        ·       15%      10%
activate  │        │        │        │        │     convert  convert
          │        │        │        │        │        │        │
          └────────┴────────┴────────┴────────┴────────┴────────┘
                    User Engagement Period
```

## 🎯 Conversion Funnel

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONVERSION FUNNEL                             │
└─────────────────────────────────────────────────────────────────┘

100 Signups
│
├─ 45 Open Day 0 Email (45%)
│  └─ 25 Click CTA (56% of opens)
│     └─ 35 Complete Quiz (140% of clicks - some direct)
│
├─ 50 Open Day 6 Email (50% of 100)
│  └─ 30 Click CTA (60% of opens)
│     └─ 15 Upgrade (50% of clicks)
│
└─ 38 Open Day 7 Email (45% of 85 remaining)
   └─ 21 Click CTA (55% of opens)
      └─ 9 Upgrade (43% of clicks)

═══════════════════════════════════════════════════════════════════
TOTAL: 24 Paid Subscribers (24% conversion rate)
═══════════════════════════════════════════════════════════════════
```

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM COMPONENTS                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   SIGNUP     │
│   /signup    │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│  /api/auth/set-trial                 │
│  • Sets trial_ends_at                │
│  • Triggers welcome email            │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Database Trigger                    │
│  • Queues welcome email              │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  /api/emails/process-welcome-queue   │
│  • Sends Day 0 email                 │
│  • Marks as sent                     │
└──────────────────────────────────────┘

       ⏰ 6 days pass...

┌──────────────────────────────────────┐
│  Vercel Cron Job (Daily 12pm UTC)   │
│  /api/emails/process-trial-expiration│
└──────┬───────────────────────────────┘
       │
       ├─→ Find Day 6 users (24h left)
       │   └─→ Queue Day 6 emails
       │       └─→ Send via Resend
       │
       └─→ Find Day 7 users (expired)
           └─→ Queue Day 7 emails
               └─→ Send via Resend
```

## 📊 Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                               │
└─────────────────────────────────────────────────────────────────┘

profiles
├─ id (UUID)
├─ trial_ends_at (TIMESTAMPTZ) ← NEW!
├─ subscription_status (TEXT)
├─ stripe_customer_id (TEXT)
└─ stripe_subscription_id (TEXT)

welcome_email_queue (Day 0)
├─ id (UUID)
├─ user_id → profiles.id
├─ email (TEXT)
├─ trial_ends_at (TIMESTAMPTZ)
├─ status (pending/sent/failed)
├─ sent_at (TIMESTAMPTZ)
└─ email_id (TEXT - Resend ID)

trial_expiration_emails (Day 6 & 7)
├─ id (UUID)
├─ user_id → profiles.id
├─ email (TEXT)
├─ email_type (day_6_reminder/day_7_expiration)
├─ trial_ends_at (TIMESTAMPTZ)
├─ questions_answered (INT)
├─ status (pending/sent/failed/skipped)
├─ sent_at (TIMESTAMPTZ)
└─ email_id (TEXT - Resend ID)
```

## 🎨 Email Design Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL DESIGNS                                 │
└─────────────────────────────────────────────────────────────────┘

DAY 0: WELCOME                DAY 6: URGENCY              DAY 7: LOCKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ 🩺 BLUE/PURPLE  │         │ ⏳ RED/ORANGE   │         │ 🔒 GRAY         │
│ Gradient Header │         │ Gradient Header │         │ Gradient Header │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ Welcome to the  │         │ 24 Hours Left   │         │ Trial Expired   │
│ future of NCLEX │         │ Progress at risk│         │ Data is safe    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ 7-Day Promise   │         │ The Deadline    │         │ Account Status  │
│ 2026 Edge       │         │ Value Reinforce │         │ 2026 Promise    │
│ Quick Win CTA   │         │ What You'll Keep│         │ Reassurance     │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ [Take Quiz]     │         │ [Upgrade Now]   │         │ [Unlock Now]    │
│ Large Button    │         │ Large Button    │         │ Large Button    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ Trial expires   │         │ 47 questions    │         │ What's waiting  │
│ on {{date}}     │         │ answered        │         │ for you         │
└─────────────────┘         └─────────────────┘         └─────────────────┘

Tone: Excited                Tone: Urgent                Tone: Reassuring
Goal: Activate               Goal: Convert               Goal: Convert
CTA: Start Quiz              CTA: Upgrade                CTA: Choose Plan
```

## 📈 Performance Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUCCESS METRICS                               │
└─────────────────────────────────────────────────────────────────┘

EMAIL PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    Open Rate    Click Rate    Conversion
Day 0 Welcome         45%          25%           35% quiz
Day 6 Urgency         50%          30%           15% paid
Day 7 Locked          45%          25%           10% paid

Average               47%          27%           24% total


FUNNEL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Signups              100
↓ (45%)
Email Opens           47
↓ (57%)
CTA Clicks            27
↓ (89%)
Quiz Completions      35
↓ (69%)
Paid Conversions      24

CONVERSION RATE: 24%


REVENUE IMPACT (per 100 signups)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Baseline (5%)         $500/month
With Funnel (24%)    $2,400/month
Lift                 $1,900/month

Annual Impact        $22,800/year per 100 signups
```

---

**This visual guide shows the complete trial funnel flow, from signup to conversion.**
