# Welcome Email Automation - Setup Guide

## Overview

This system automatically sends a welcome email to new users when they sign up and start their 7-day trial. The email drives them to complete their first practice quiz (the "Quick Win").

## Architecture

```
User Signs Up
    ↓
Signup Page calls /api/auth/set-trial
    ↓
Sets trial_ends_at = NOW() + 7 days
    ↓
Database Trigger queues welcome email
    ↓
API processes queue and sends via Resend
    ↓
User receives welcome email with CTA
```

## Setup Steps

### 1. Run Database Migration

Execute `supabase_welcome_email_simple.sql` in your Supabase SQL Editor:

```bash
# Copy the contents of supabase_welcome_email_simple.sql
# Paste into Supabase Dashboard → SQL Editor → New Query
# Click "Run"
```

This creates:
- `welcome_email_queue` table to track emails
- Database trigger to queue emails when trial starts
- Helper functions to process the queue

### 2. Configure Environment Variables

Add to your `.env.local` (already configured):

```bash
# Resend (already set up)
RESEND_API_KEY=re_your_key_here

# Service Role Key (for API authentication)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Cron secret for scheduled processing
CRON_SECRET=your_random_secret_here

# App URL (for production)
NEXT_PUBLIC_APP_URL=https://forgenursing.com
```

### 3. Verify Resend Domain

In Resend Dashboard:
1. Go to Domains
2. Add `forgenursing.com`
3. Add DNS records to your domain provider
4. Wait for verification (usually 5-10 minutes)

For testing, you can use your verified email address.

### 4. Test the Flow

#### Manual Test:

```sql
-- 1. Create a test user (or use existing)
-- 2. Set their trial period
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE id = '<user-id>';

-- 3. Check if email was queued
SELECT * FROM welcome_email_queue WHERE user_id = '<user-id>';

-- 4. Process the queue manually
-- Call: POST /api/emails/process-welcome-queue
-- With header: Authorization: Bearer <service-role-key>
```

#### Signup Test:

1. Go to `/signup`
2. Create a new account
3. Check the `welcome_email_queue` table
4. Email should be sent automatically

### 5. Set Up Automated Processing (Optional)

You have three options for processing the email queue:

#### Option A: Vercel Cron (Recommended for Production)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/emails/process-welcome-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes. Add to your API route:

```typescript
// In process-welcome-queue/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

#### Option B: External Cron Service

Use a service like cron-job.org or EasyCron:

```bash
URL: https://forgenursing.com/api/emails/process-welcome-queue
Method: POST
Headers: 
  - Authorization: Bearer <service-role-key>
  - Content-Type: application/json
Schedule: Every 5 minutes
```

#### Option C: Immediate Processing (Current Setup)

The signup flow already calls the queue processor immediately after setting the trial. This is the simplest approach and works well for low-volume signups.

## Email Content

The welcome email includes:

1. **Hero Section**: Welcome message with trial activation
2. **Trial Details**: Shows trial end date (7 days from signup)
3. **Quick Win CTA**: "Start Your First Quiz" button
4. **3-Step Guide**: 
   - Click button
   - Answer 10 questions
   - See explanations
5. **Features List**: What's included in trial
6. **Support**: Reply-to for help

## Monitoring

### Check Queue Status

```sql
-- Pending emails
SELECT COUNT(*) FROM welcome_email_queue WHERE status = 'pending';

-- Sent emails (last 24 hours)
SELECT COUNT(*) FROM welcome_email_queue 
WHERE status = 'sent' 
AND sent_at > NOW() - INTERVAL '24 hours';

-- Failed emails
SELECT * FROM welcome_email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Check Resend Dashboard

1. Go to https://resend.com/emails
2. View delivery status, opens, clicks
3. Check for bounces or spam reports

## Troubleshooting

### Email not sent?

1. Check queue: `SELECT * FROM welcome_email_queue WHERE user_id = '<user-id>'`
2. Check status: Should be 'sent', not 'pending' or 'failed'
3. Check Resend dashboard for delivery status
4. Verify RESEND_API_KEY is set correctly
5. Check spam folder

### Email queued but not sent?

1. Manually trigger processing:
   ```bash
   curl -X POST https://forgenursing.com/api/emails/process-welcome-queue \
     -H "Authorization: Bearer <service-role-key>"
   ```
2. Check API logs for errors
3. Verify Resend domain is verified

### Trial not set?

1. Check if `/api/auth/set-trial` was called
2. Check browser console for errors
3. Verify SUPABASE_SERVICE_ROLE_KEY is set
4. Check Supabase logs

## Files Created

### API Routes
- `/api/emails/welcome/route.ts` - Direct email sending (alternative approach)
- `/api/emails/process-welcome-queue/route.ts` - Queue processor (recommended)
- `/api/auth/set-trial/route.ts` - Sets trial period after signup

### Database Migrations
- `supabase_welcome_email_simple.sql` - Queue-based approach (recommended)
- `supabase_welcome_email_trigger.sql` - Direct webhook approach (alternative)

### Documentation
- `WELCOME_EMAIL_SETUP_GUIDE.md` - This file
- `TRIAL_ACCESS_IMPLEMENTATION.md` - Trial access logic

## Next Steps

1. ✅ Run `supabase_welcome_email_simple.sql`
2. ✅ Verify environment variables
3. ✅ Test with a new signup
4. ✅ Verify email received
5. ⏳ Set up cron job (optional)
6. ⏳ Monitor queue and delivery rates

## Success Metrics

Track these to measure effectiveness:

1. **Email Delivery Rate**: % of queued emails successfully sent
2. **Open Rate**: % of users who open the email (via Resend)
3. **Click Rate**: % who click "Start Your First Quiz"
4. **Quiz Completion**: % who complete first quiz within 24h
5. **Trial Conversion**: % who convert to paid after trial

## Email Best Practices

- ✅ Clear, action-oriented subject line
- ✅ Single primary CTA (Start Quiz)
- ✅ Mobile-responsive design
- ✅ Shows trial end date
- ✅ Sets expectations (what happens next)
- ✅ Provides support contact
- ✅ No credit card required messaging

## Future Enhancements

Consider adding:
- Day 3 reminder email ("You're halfway through your trial")
- Day 6 expiration warning ("1 day left in your trial")
- Post-trial conversion email
- Drip campaign for inactive users
- Personalization based on program track
