# Trial Expiration Emails - Day 6 & Day 7 Implementation

## 🎯 Overview

Automated email sequence to convert trial users to paid subscribers by emphasizing saved progress and creating urgency.

## 📧 Email Sequence

### Day 6: The "Urgency" Nudge
**Trigger:** 24 hours before `trial_ends_at`  
**Subject:** ⏳ 24 Hours Left: Your NCLEX progress is on the line  
**Goal:** Create urgency, emphasize value already gained

**Key Elements:**
- Countdown urgency (expires tomorrow)
- Progress reinforcement (X questions answered)
- Loss aversion (don't lose your streak)
- Clear CTA (Upgrade to Pro & Keep My Progress)

### Day 7: The "Locked" Notice
**Trigger:** When `NOW() > trial_ends_at`  
**Subject:** Your trial has expired. Your data is safe.  
**Goal:** Reassure data is saved, provide clear path to unlock

**Key Elements:**
- Status update (account moved to read-only)
- Reassurance (data is safely stored)
- 2026 NCLEX positioning
- Clear CTA (Choose a Plan & Unlock Now)

## 🔧 Technical Implementation

### Architecture

```
Daily Cron Job (12pm UTC)
    ↓
/api/emails/process-trial-expiration
    ↓
1. Find users expiring in 24h → Queue Day 6 emails
2. Find users expired today → Queue Day 7 emails
3. Process queue → Send via Resend
4. Mark as sent/failed
```

### Database Schema

**Table:** `trial_expiration_emails`
- Tracks Day 6 and Day 7 emails
- Prevents duplicate sends
- Retry logic (max 3 attempts)
- Status tracking (pending, sent, failed, skipped)

**Functions:**
- `get_users_for_day_6_reminder()` - Find users expiring in 24h
- `get_users_for_day_7_expiration()` - Find users expired today
- `queue_trial_expiration_email()` - Add email to queue
- `get_pending_trial_expiration_emails()` - Get emails to send
- `mark_trial_expiration_email_sent()` - Update status

### Safety Features

✅ **Automatic Skip:** Users with `subscription_status = 'active'` are automatically skipped  
✅ **Duplicate Prevention:** One email of each type per user (unique constraint)  
✅ **Retry Logic:** Failed emails retry up to 3 times  
✅ **Time Window:** Day 7 only sends within 24h of expiration (prevents re-sending)

## 🚀 Setup Instructions

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor:
-- Run supabase_trial_expiration_emails.sql
```

This creates:
- `trial_expiration_emails` table
- Helper functions for querying and queueing
- Indexes for performance
- RLS policies

### 2. Verify Cron Job

The cron job is already configured in `vercel.json`:

```json
{
  "path": "/api/emails/process-trial-expiration",
  "schedule": "0 12 * * *"
}
```

This runs daily at 12pm UTC (7am EST / 4am PST).

**To change the time:**
- Edit `vercel.json`
- Use cron syntax: `minute hour day month dayofweek`
- Example: `0 14 * * *` = 2pm UTC daily

### 3. Set Environment Variables

Already configured from Day 0 setup:
```bash
RESEND_API_KEY=re_xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
CRON_SECRET=xxx (optional)
```

### 4. Deploy

```bash
git add .
git commit -m "Add Day 6 and Day 7 trial expiration emails"
git push
```

Vercel will automatically deploy and enable the cron job.

## 🧪 Testing

### Test Day 6 Email (24h before expiration)

```sql
-- 1. Set a user's trial to expire in 24 hours
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '24 hours'
WHERE id = '<user-id>';

-- 2. Check if they appear in the query
SELECT * FROM get_users_for_day_6_reminder();

-- 3. Manually trigger the cron job
-- POST /api/emails/process-trial-expiration
-- With header: Authorization: Bearer <service-role-key>

-- 4. Check if email was queued
SELECT * FROM trial_expiration_emails 
WHERE user_id = '<user-id>' 
AND email_type = 'day_6_reminder';

-- 5. Check your email inbox
```

### Test Day 7 Email (trial expired)

```sql
-- 1. Set a user's trial to expired (1 hour ago)
UPDATE profiles 
SET trial_ends_at = NOW() - INTERVAL '1 hour'
WHERE id = '<user-id>';

-- 2. Check if they appear in the query
SELECT * FROM get_users_for_day_7_expiration();

-- 3. Manually trigger the cron job
-- POST /api/emails/process-trial-expiration

-- 4. Check if email was queued
SELECT * FROM trial_expiration_emails 
WHERE user_id = '<user-id>' 
AND email_type = 'day_7_expiration';

-- 5. Check your email inbox
```

### Manual Trigger (for testing)

```bash
curl -X POST https://forgenursing.com/api/emails/process-trial-expiration \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📊 Monitoring

### Check Queue Status

```sql
-- Pending emails
SELECT email_type, COUNT(*) 
FROM trial_expiration_emails 
WHERE status = 'pending'
GROUP BY email_type;

-- Sent today
SELECT email_type, COUNT(*) 
FROM trial_expiration_emails 
WHERE sent_at::date = CURRENT_DATE
GROUP BY email_type;

-- Failed emails
SELECT * FROM trial_expiration_emails 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Daily Stats

```sql
-- Daily email stats
SELECT 
  DATE(created_at) as date,
  email_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM trial_expiration_emails
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), email_type
ORDER BY date DESC, email_type;
```

### Conversion Tracking

```sql
-- Users who upgraded after Day 6 email
SELECT COUNT(*) as upgraded_after_day_6
FROM trial_expiration_emails e
JOIN profiles p ON p.id = e.user_id
WHERE e.email_type = 'day_6_reminder'
AND e.sent_at IS NOT NULL
AND p.subscription_status = 'active'
AND p.updated_at > e.sent_at;

-- Users who upgraded after Day 7 email
SELECT COUNT(*) as upgraded_after_day_7
FROM trial_expiration_emails e
JOIN profiles p ON p.id = e.user_id
WHERE e.email_type = 'day_7_expiration'
AND e.sent_at IS NOT NULL
AND p.subscription_status = 'active'
AND p.updated_at > e.sent_at;
```

## 🎯 Success Metrics

### Email Performance
- **Day 6 Open Rate:** Target 50%+ (urgency subject line)
- **Day 6 Click Rate:** Target 30%+ (strong CTA)
- **Day 7 Open Rate:** Target 45%+
- **Day 7 Click Rate:** Target 25%+

### Conversion Metrics
- **Day 6 Conversion:** Target 15% upgrade within 24h
- **Day 7 Conversion:** Target 10% upgrade within 7 days
- **Combined:** Target 20-25% of trial users convert

### Tracking
- Use `?source=day6` and `?source=day7` in CTAs
- Track in Stripe metadata or analytics
- Monitor via Resend dashboard

## 🔍 Troubleshooting

### Emails not sending?

1. **Check cron job is running:**
   - Go to Vercel Dashboard → Project → Cron Jobs
   - Verify last run time
   - Check logs for errors

2. **Check queue:**
   ```sql
   SELECT * FROM trial_expiration_emails WHERE status = 'pending';
   ```

3. **Manually trigger:**
   ```bash
   curl -X POST https://forgenursing.com/api/emails/process-trial-expiration \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

4. **Check Resend dashboard:**
   - Go to https://resend.com/emails
   - Look for delivery failures
   - Check bounce/spam reports

### Users not appearing in queries?

1. **Check trial_ends_at is set:**
   ```sql
   SELECT id, trial_ends_at, subscription_status 
   FROM profiles 
   WHERE trial_ends_at IS NOT NULL;
   ```

2. **Check subscription_status:**
   - Users with `subscription_status = 'active'` are skipped
   - This is intentional (already subscribed)

3. **Check if email already sent:**
   ```sql
   SELECT * FROM trial_expiration_emails 
   WHERE user_id = '<user-id>';
   ```

### Duplicate emails?

- Unique constraint prevents duplicates
- One Day 6 and one Day 7 per user
- If you need to resend, delete the row:
  ```sql
  DELETE FROM trial_expiration_emails 
  WHERE user_id = '<user-id>' 
  AND email_type = 'day_6_reminder';
  ```

## 📝 Email Copy Details

### Day 6 Email

**Tone:** Urgent but not panicky  
**Focus:** Loss aversion (don't lose progress)  
**CTA:** "Upgrade to Pro & Keep My Progress"

**Personalization:**
- Day of week trial expires
- Number of questions answered
- Emphasizes "your" progress

**Design:**
- Red/orange gradient header (urgency)
- ⏳ emoji for visual urgency
- Prominent CTA button
- List of what they'll keep

### Day 7 Email

**Tone:** Informative, reassuring  
**Focus:** Data is safe, easy to unlock  
**CTA:** "Choose a Plan & Unlock Now"

**Personalization:**
- Number of questions answered
- Emphasizes data is saved

**Design:**
- Gray gradient header (locked state)
- 🔒 emoji for locked status
- Green reassurance box
- List of what's waiting

## 🔮 Future Enhancements

### Phase 2: Additional Touchpoints
- **Day 3:** Mid-trial check-in
- **Day 10:** Post-expiration follow-up
- **Day 30:** Win-back campaign

### Phase 3: Personalization
- Segment by engagement level
- Different copy for high vs. low usage
- Personalized quiz recommendations

### Phase 4: A/B Testing
- Test different subject lines
- Test urgency vs. value messaging
- Test CTA copy variations

## 📋 Files Created

1. **supabase_trial_expiration_emails.sql** - Database schema and functions
2. **src/app/api/emails/process-trial-expiration/route.ts** - API endpoint
3. **vercel.json** - Updated with cron job
4. **TRIAL_EXPIRATION_EMAILS_GUIDE.md** - This guide

## ✅ Deployment Checklist

- [ ] Run `supabase_trial_expiration_emails.sql` in Supabase
- [ ] Verify cron job in `vercel.json`
- [ ] Deploy to Vercel
- [ ] Test Day 6 email with test user
- [ ] Test Day 7 email with test user
- [ ] Verify emails received
- [ ] Check Resend dashboard
- [ ] Monitor for 1 week
- [ ] Track conversion rates

## 🎉 Ready to Deploy!

The system is complete and ready for production. The cron job will run automatically once deployed to Vercel.

---

**Status:** ✅ Complete and Ready for Production  
**Cron Schedule:** Daily at 12pm UTC  
**Expected Impact:** 20-25% trial to paid conversion
