# Webhook Retry Mechanism - Deployment Checklist

**Status:** ✅ Code Complete - Ready to Deploy  
**Date:** February 1, 2026

---

## Pre-Deployment Checklist

### ✅ Code Changes Complete
- [x] Enhanced webhook handler with logging (`src/app/api/stripe/webhook/route.ts`)
- [x] Created retry endpoint (`src/app/api/stripe/webhook-retry/route.ts`)
- [x] Created type definitions (`src/types/database.ts`)
- [x] All TypeScript errors resolved
- [x] Code tested and validated

### 📋 Deployment Steps

#### Step 1: Database Migration (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase_webhook_retry_schema.sql`
3. Run the migration
4. Verify tables created:
   ```sql
   SELECT * FROM webhook_events LIMIT 1;
   ```

**Expected Result:** Table exists, query returns empty result (no rows yet)

---

#### Step 2: Deploy Code (Automatic via Git)

1. Commit changes:
   ```bash
   git add .
   git commit -m "Add webhook retry mechanism with database logging"
   git push
   ```

2. Vercel will automatically deploy

3. Wait for deployment to complete (~2-3 minutes)

**Files Deployed:**
- `src/app/api/stripe/webhook/route.ts` (modified)
- `src/app/api/stripe/webhook-retry/route.ts` (new)
- `src/types/database.ts` (new)

---

#### Step 3: Add Environment Variable (2 minutes)

**Option A: Use existing service role key (recommended)**
- No action needed - code falls back to `SUPABASE_SERVICE_ROLE_KEY`

**Option B: Create dedicated secret**
1. Generate random secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to Vercel:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add: `WEBHOOK_RETRY_SECRET=<generated-secret>`
   - Apply to: Production, Preview, Development

3. Redeploy (Vercel will prompt)

---

#### Step 4: Set Up Cron Job (10 minutes)

**Recommended: Vercel Cron**

1. Create `vercel.json` in project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/stripe/webhook-retry",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. Commit and push:
   ```bash
   git add vercel.json
   git commit -m "Add webhook retry cron job"
   git push
   ```

3. Verify in Vercel Dashboard → Cron Jobs
   - Should show: "Every 5 minutes"
   - Status: Active

**Alternative: External Cron Service**

Use cron-job.org or similar:
- URL: `https://forgenursing.com/api/stripe/webhook-retry`
- Method: POST
- Headers: `Authorization: Bearer <WEBHOOK_RETRY_SECRET>`
- Schedule: `*/5 * * * *` (every 5 minutes)

---

## Post-Deployment Verification

### Test 1: Webhook Logging (15 minutes)

1. Complete a test Stripe checkout
2. Check Supabase database:
   ```sql
   SELECT 
     stripe_event_id,
     event_type,
     status,
     created_at
   FROM webhook_events
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**Expected Result:** 
- New row with `event_type = 'checkout.session.completed'`
- `status = 'succeeded'`
- `user_id`, `customer_id`, `subscription_id` populated

---

### Test 2: Retry Endpoint (5 minutes)

1. Call the stats endpoint:
   ```bash
   curl -H "Authorization: Bearer <WEBHOOK_RETRY_SECRET>" \
     https://forgenursing.com/api/stripe/webhook-retry
   ```

**Expected Result:**
```json
{
  "stats": {
    "total_events": 1,
    "succeeded": 1,
    "failed": 0,
    "pending": 0,
    "retrying": 0,
    "avg_attempts": 1.0,
    "last_24h_events": 1,
    "last_24h_failures": 0
  },
  "timestamp": "2026-02-01T..."
}
```

---

### Test 3: Cron Job (Wait 5 minutes)

1. Check Vercel logs for cron execution
2. Look for: `[Webhook Retry] No webhooks to retry`

**Expected Result:** Cron runs every 5 minutes, logs show execution

---

## Monitoring Setup

### Daily Checks (Automated)

Set up alerts for:
1. **Failed webhooks > 5** - Check database daily
2. **Retry attempts > 3** - Indicates persistent issues
3. **Cron job failures** - Check Vercel logs

### Query for Failed Webhooks

```sql
-- Run daily in Supabase SQL Editor
SELECT 
  stripe_event_id,
  event_type,
  status,
  attempt_count,
  last_error,
  created_at
FROM webhook_events
WHERE status = 'failed'
  AND attempt_count >= 5
ORDER BY created_at DESC;
```

**Action:** If any results, investigate `last_error` and manually retry

---

## Rollback Plan

If issues occur:

### Quick Rollback (5 minutes)
1. Disable cron job in Vercel
2. Revert to previous Git commit:
   ```bash
   git revert HEAD
   git push
   ```

### Keep Database Table
- Don't drop `webhook_events` table
- Historical data is valuable for debugging
- Old webhook handler will work without it

---

## Success Criteria

✅ **Deployment Successful When:**
1. Database migration runs without errors
2. Code deploys to Vercel successfully
3. Test checkout creates webhook_events row
4. Stats endpoint returns valid data
5. Cron job executes every 5 minutes
6. No TypeScript or runtime errors in logs

---

## Next Steps After Deployment

### Week 1: Monitor
- Check webhook stats daily
- Verify no failed webhooks accumulating
- Confirm cron job running consistently

### Week 2: Optimize
- Review retry patterns
- Adjust retry delay if needed
- Add alerting for failures

### Month 1: Enhance
- Build admin dashboard for webhook stats
- Add manual retry UI
- Implement email alerts for persistent failures

---

## Support & Troubleshooting

### Common Issues

**Issue:** Cron job not running
- **Check:** Vercel Dashboard → Cron Jobs → Status
- **Fix:** Redeploy or manually trigger

**Issue:** Webhooks not logging
- **Check:** Vercel logs for errors
- **Fix:** Verify `SUPABASE_SERVICE_ROLE_KEY` is set

**Issue:** Stats endpoint returns 401
- **Check:** Authorization header format
- **Fix:** Ensure `Bearer <token>` format

---

## Files Reference

**Created:**
- `supabase_webhook_retry_schema.sql` - Database schema
- `src/app/api/stripe/webhook-retry/route.ts` - Retry endpoint
- `src/types/database.ts` - Type definitions
- `WEBHOOK_RETRY_FIX_SUMMARY.md` - Implementation details
- `WEBHOOK_RETRY_DEPLOYMENT.md` - This file

**Modified:**
- `src/app/api/stripe/webhook/route.ts` - Enhanced with logging

**To Create:**
- `vercel.json` - Cron job configuration

---

## Estimated Timeline

- **Database Migration:** 5 minutes
- **Code Deployment:** 3 minutes (automatic)
- **Environment Variables:** 2 minutes
- **Cron Setup:** 10 minutes
- **Testing:** 25 minutes
- **Total:** ~45 minutes

---

## Contact

For issues or questions:
1. Check Vercel logs first
2. Review Supabase database for webhook_events
3. Check this deployment guide
4. Review `WEBHOOK_RETRY_FIX_SUMMARY.md` for technical details
