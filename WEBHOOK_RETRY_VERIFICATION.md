# Webhook Retry - Post-Deployment Verification

**Deployment Date:** February 1, 2026  
**Status:** ✅ Code Deployed - Awaiting Verification

---

## Deployment Summary

### ✅ Completed Steps

1. **Database Migration** - `webhook_events` table created in Supabase
2. **Code Deployed** - Pushed to GitHub, Vercel auto-deployed
3. **Cron Job Configured** - `vercel.json` added (runs every 5 minutes)

### Files Deployed

- `src/app/api/stripe/webhook/route.ts` - Enhanced webhook handler
- `src/app/api/stripe/webhook-retry/route.ts` - Retry endpoint
- `src/types/database.ts` - Type definitions
- `vercel.json` - Cron job configuration

---

## Verification Steps

### 1. Check Vercel Deployment (2 minutes)

**Action:** Go to Vercel Dashboard

**Verify:**
- Latest deployment shows "Ready" status
- No build errors
- Cron Jobs tab shows webhook-retry job (may take a few minutes to appear)

**Expected:** Green checkmark, deployment successful

---

### 2. Test Webhook Logging (15 minutes)

**Action:** Complete a test Stripe checkout

**Steps:**
1. Go to your app's checkout page
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete checkout
4. Wait 10 seconds for webhook to process

**Verify in Supabase:**
```sql
SELECT 
  stripe_event_id,
  event_type,
  status,
  user_id,
  customer_id,
  subscription_id,
  created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
- New row with `event_type = 'checkout.session.completed'`
- `status = 'succeeded'`
- `user_id`, `customer_id`, `subscription_id` all populated
- `created_at` is recent (within last few minutes)

**If No Rows:**
- Check Vercel logs for webhook endpoint
- Verify Stripe webhook is configured and pointing to your domain
- Check for any errors in logs

---

### 3. Test Stats Endpoint (5 minutes)

**Action:** Call the webhook stats endpoint

**Command:**
```bash
# Replace <TOKEN> with SUPABASE_SERVICE_ROLE_KEY from .env
curl -H "Authorization: Bearer <TOKEN>" \
  https://forgenursing.com/api/stripe/webhook-retry
```

**Expected Response:**
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

**If 401 Unauthorized:**
- Verify Authorization header format: `Bearer <token>`
- Check token is correct (use SUPABASE_SERVICE_ROLE_KEY)

**If 500 Error:**
- Check Vercel logs for error details
- Verify database function `get_webhook_stats` exists

---

### 4. Verify Cron Job (Wait 5-10 minutes)

**Action:** Check Vercel logs for cron execution

**Steps:**
1. Go to Vercel Dashboard → Logs
2. Filter by: `/api/stripe/webhook-retry`
3. Look for recent executions (every 5 minutes)

**Expected Log Output:**
```
[Webhook Retry] No webhooks to retry
processed: 0
```

**If No Logs:**
- Wait up to 10 minutes (cron may take time to activate)
- Check Vercel Dashboard → Cron Jobs → Status
- Verify `vercel.json` was deployed

---

## Success Criteria

✅ **All Systems Operational When:**

1. Vercel deployment shows "Ready"
2. Test checkout creates `webhook_events` row with status "succeeded"
3. Stats endpoint returns valid JSON with correct counts
4. Cron job executes every 5 minutes (visible in logs)
5. No errors in Vercel logs

---

## Troubleshooting

### Issue: Webhooks Not Logging

**Symptoms:** No rows in `webhook_events` table after checkout

**Checks:**
1. Verify Stripe webhook is configured:
   - Go to Stripe Dashboard → Webhooks
   - Check endpoint URL: `https://forgenursing.com/api/stripe/webhook`
   - Verify webhook secret matches `STRIPE_WEBHOOK_SECRET` env var

2. Check Vercel logs for webhook endpoint:
   - Look for `[Webhook]` log entries
   - Check for any errors

3. Test webhook manually in Stripe:
   - Stripe Dashboard → Webhooks → Send test webhook
   - Check if it appears in database

**Fix:** Update Stripe webhook configuration or environment variables

---

### Issue: Cron Job Not Running

**Symptoms:** No logs for `/api/stripe/webhook-retry` after 10 minutes

**Checks:**
1. Verify `vercel.json` exists in repository root
2. Check Vercel Dashboard → Cron Jobs
3. Verify latest deployment included `vercel.json`

**Fix:** 
- Redeploy if `vercel.json` wasn't included
- Or use external cron service (cron-job.org) as backup

---

### Issue: Stats Endpoint Returns 401

**Symptoms:** `curl` command returns "Unauthorized"

**Checks:**
1. Verify Authorization header format: `Authorization: Bearer <token>`
2. Check token value matches `SUPABASE_SERVICE_ROLE_KEY`
3. Ensure no extra spaces or quotes in token

**Fix:** Copy exact token from Vercel env vars or `.env.local`

---

## Monitoring Queries

### Check Recent Webhooks
```sql
SELECT 
  stripe_event_id,
  event_type,
  status,
  attempt_count,
  last_error,
  created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

### Find Failed Webhooks
```sql
SELECT 
  stripe_event_id,
  event_type,
  status,
  attempt_count,
  last_error,
  created_at
FROM webhook_events
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check Webhook Stats (Last 24 Hours)
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(attempt_count) as avg_attempts
FROM webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;
```

---

## Next Steps

### After Successful Verification

1. **Monitor for 24 hours** - Check stats daily
2. **Test failure scenario** - Temporarily break code, verify retry works
3. **Set up alerts** - Email/Slack for failed webhooks
4. **Document any issues** - Update troubleshooting guide

### Week 1 Tasks

- [ ] Verify cron runs consistently (check logs daily)
- [ ] Confirm no failed webhooks accumulating
- [ ] Test with real user signups
- [ ] Monitor Vercel function execution time

### Future Enhancements

- Build admin dashboard for webhook stats
- Add manual retry button in UI
- Implement email alerts for persistent failures
- Add exponential backoff for retries

---

## Support

**Documentation:**
- `WEBHOOK_RETRY_FIX_SUMMARY.md` - Technical details
- `WEBHOOK_RETRY_DEPLOYMENT.md` - Deployment guide
- `USER_LIFECYCLE_ANALYSIS.md` - User flow analysis

**Logs:**
- Vercel Dashboard → Logs
- Supabase Dashboard → SQL Editor

**Database:**
- Table: `webhook_events`
- Functions: `get_webhooks_for_retry()`, `get_webhook_stats()`
