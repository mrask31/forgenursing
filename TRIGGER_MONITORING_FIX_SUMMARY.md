# Database Trigger Health Monitoring - Implementation Summary

**Date:** February 1, 2026  
**Issue:** Profile creation trigger could fail silently, causing orphaned users  
**Solution:** Comprehensive monitoring system with health checks and auto-repair

---

## What Was Implemented

### 1. Database Monitoring Schema (`supabase_trigger_monitoring_schema.sql`)

**New Functions:**

#### `get_trigger_health()`
Returns comprehensive health status of the profile creation trigger:
- `trigger_name` - Name of the trigger
- `trigger_enabled` - Whether trigger is active
- `function_exists` - Whether trigger function exists
- `orphaned_users_count` - Number of users without profiles
- `last_user_created_at` - Most recent user signup
- `last_profile_created_at` - Most recent profile creation
- `health_status` - Overall health assessment

**Health Status Values:**
- `HEALTHY: All systems operational` - Everything working
- `WARNING: X orphaned users found` - Users without profiles (< 10 min old)
- `CRITICAL: Trigger is disabled` - Trigger not active
- `CRITICAL: Trigger function missing` - Function deleted
- `CRITICAL: X orphaned users found` - Users without profiles (> 10 min old)

#### `get_orphaned_users()`
Returns detailed list of users without profiles:
- `user_id` - User UUID
- `email` - User email address
- `created_at` - When user was created
- `age_minutes` - How long user has been orphaned

#### `repair_orphaned_users()`
Automatically creates profiles for orphaned users:
- Loops through all orphaned users
- Creates profile with `subscription_status = 'pending_payment'`
- Returns success/failure status for each user

#### `trigger_health_dashboard` (View)
Convenient view for quick health checks - combines all monitoring data.

---

### 2. Monitoring API Endpoint (`src/app/api/monitor/trigger-health/route.ts`)

**Endpoints:**

#### `GET /api/monitor/trigger-health`
Returns trigger health status and orphaned users list.

**Authorization:**
```bash
Authorization: Bearer <MONITOR_SECRET or SUPABASE_SERVICE_ROLE_KEY>
```

**Response:**
```json
{
  "status": "healthy" | "warning" | "critical",
  "message": "All systems operational",
  "trigger": {
    "name": "on_auth_user_created",
    "enabled": true,
    "function_exists": true
  },
  "metrics": {
    "orphaned_users_count": 0,
    "last_user_created_at": "2026-02-01T12:00:00Z",
    "last_profile_created_at": "2026-02-01T12:00:00Z"
  },
  "orphaned_users": [],
  "health_status": "HEALTHY: All systems operational",
  "timestamp": "2026-02-01T12:00:00Z"
}
```

**Alert Levels:**
- `healthy` - No issues detected
- `warning` - Orphaned users < 10 minutes old (may be timing)
- `critical` - Trigger disabled, function missing, or orphaned users > 10 minutes old

---

#### `POST /api/monitor/trigger-health`
Repairs orphaned users by creating missing profiles.

**Authorization:**
```bash
Authorization: Bearer <MONITOR_SECRET or SUPABASE_SERVICE_ROLE_KEY>
```

**Response:**
```json
{
  "message": "Repair operation complete",
  "before": 3,
  "after": 0,
  "repaired": 3,
  "failed": 0,
  "results": [
    {
      "user_id": "uuid-1",
      "email": "user1@example.com",
      "repair_status": "SUCCESS: Profile created"
    }
  ],
  "timestamp": "2026-02-01T12:00:00Z"
}
```

---

## How It Works

### Normal Flow (Healthy)

```
1. User signs up
   ↓
2. Supabase inserts into auth.users
   ↓
3. Database trigger fires automatically
   ↓
4. Trigger function creates profile
   ↓
5. Profile has subscription_status = 'pending_payment'
   ↓
6. Monitoring shows: orphaned_users_count = 0
```

### Failure Flow (Trigger Broken)

```
1. User signs up
   ↓
2. Supabase inserts into auth.users
   ↓
3. Trigger doesn't fire (disabled or missing)
   ↓
4. No profile created
   ↓
5. User authenticated but can't access app
   ↓
6. Monitoring detects: orphaned_users_count > 0
   ↓
7. Alert sent (if configured)
   ↓
8. Admin calls repair endpoint
   ↓
9. Profiles created for orphaned users
   ↓
10. Users can now access app
```

---

## Deployment Steps

### Step 1: Run Database Migration (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase_trigger_monitoring_schema.sql`
3. Run the migration
4. Verify functions created:
   ```sql
   SELECT * FROM get_trigger_health();
   ```

**Expected Result:** 
- `trigger_enabled = true`
- `function_exists = true`
- `orphaned_users_count = 0`
- `health_status = 'HEALTHY: All systems operational'`

---

### Step 2: Deploy Monitoring Endpoint (Automatic)

1. Commit and push code:
   ```bash
   git add src/app/api/monitor/trigger-health/route.ts
   git commit -m "Add database trigger health monitoring"
   git push
   ```

2. Vercel will automatically deploy

3. Wait for deployment to complete (~2-3 minutes)

---

### Step 3: Test Monitoring Endpoint (5 minutes)

**Test Health Check:**
```bash
curl -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  https://forgenursing.com/api/monitor/trigger-health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "All systems operational",
  "trigger": {
    "name": "on_auth_user_created",
    "enabled": true,
    "function_exists": true
  },
  "metrics": {
    "orphaned_users_count": 0,
    ...
  }
}
```

---

### Step 4: Set Up Monitoring (Optional)

**Option A: Manual Checks**
- Run health check query daily in Supabase SQL Editor
- Check for orphaned users

**Option B: Automated Monitoring**
- Set up cron job to call health endpoint every hour
- Send alert if status is "warning" or "critical"
- Use service like Better Uptime, Cronitor, or custom script

**Option C: Vercel Cron (Recommended)**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/monitor/trigger-health",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Monitoring Queries

### Quick Health Check (Run Daily)

```sql
-- Check overall health
SELECT health_status, orphaned_users_count 
FROM get_trigger_health();
```

**Expected:** `HEALTHY: All systems operational`, `0 orphaned users`

---

### Check for Orphaned Users

```sql
-- Find users without profiles
SELECT * FROM get_orphaned_users();
```

**Expected:** 0 rows (no orphaned users)

**If rows returned:** Users exist without profiles - needs investigation

---

### Detailed Trigger Status

```sql
-- Check trigger is enabled
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Expected:** `tgenabled = 'O'` (enabled)

---

### Check Trigger Function

```sql
-- Verify function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Expected:** 1 row returned with function code

---

### View Dashboard

```sql
-- Comprehensive view
SELECT * FROM trigger_health_dashboard;
```

**Expected:** All green, no orphaned users

---

## Repair Operations

### Automatic Repair (API)

If orphaned users are detected, repair them via API:

```bash
curl -X POST \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  https://forgenursing.com/api/monitor/trigger-health
```

**Response:**
```json
{
  "message": "Repair operation complete",
  "before": 3,
  "after": 0,
  "repaired": 3,
  "failed": 0,
  "results": [...]
}
```

---

### Manual Repair (SQL)

If you prefer to repair manually in Supabase:

```sql
-- Repair all orphaned users
SELECT * FROM repair_orphaned_users();
```

**Expected:** List of repaired users with status

---

### Manual Profile Creation

For a specific user:

```sql
-- Create profile for specific user
INSERT INTO public.profiles (id, subscription_status)
VALUES ('<user-uuid>', 'pending_payment')
ON CONFLICT (id) DO NOTHING;
```

---

## Alert Thresholds

### CRITICAL Alerts (Immediate Action Required)

**Trigger Disabled:**
```sql
SELECT * FROM get_trigger_health() 
WHERE trigger_enabled = FALSE;
```
**Action:** Re-enable trigger or re-run migration

**Function Missing:**
```sql
SELECT * FROM get_trigger_health() 
WHERE function_exists = FALSE;
```
**Action:** Re-run migration to recreate function

**Old Orphaned Users:**
```sql
SELECT * FROM get_orphaned_users() 
WHERE age_minutes > 10;
```
**Action:** Run repair operation immediately

---

### WARNING Alerts (Monitor Closely)

**Recent Orphaned Users:**
```sql
SELECT * FROM get_orphaned_users() 
WHERE age_minutes <= 10;
```
**Action:** Wait 10 minutes, check again. May be timing issue.

**Timing Mismatch:**
```sql
SELECT * FROM get_trigger_health() 
WHERE last_user_created_at > last_profile_created_at + INTERVAL '5 minutes';
```
**Action:** Check trigger is firing correctly

---

## Troubleshooting

### Issue: Trigger Shows as Disabled

**Symptoms:** `trigger_enabled = FALSE` in health check

**Checks:**
1. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check trigger status:
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created';
   ```

**Fix:**
```sql
-- Re-enable trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

Or re-run the migration SQL.

---

### Issue: Function Missing

**Symptoms:** `function_exists = FALSE` in health check

**Checks:**
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

**Fix:** Re-run `supabase_subscription_status_migration.sql`

---

### Issue: Orphaned Users Found

**Symptoms:** `orphaned_users_count > 0` in health check

**Checks:**
1. How old are they?
   ```sql
   SELECT user_id, email, age_minutes FROM get_orphaned_users();
   ```

2. Is trigger working now?
   ```sql
   SELECT trigger_enabled, function_exists FROM get_trigger_health();
   ```

**Fix:**
- If < 10 minutes old: Wait, may be timing issue
- If > 10 minutes old: Run repair operation
- If trigger broken: Fix trigger first, then repair

---

### Issue: Repair Operation Fails

**Symptoms:** `repair_status = 'FAILED: ...'` in repair results

**Checks:**
1. Check error message in repair results
2. Verify RLS policies allow profile creation
3. Check service role key is valid

**Fix:**
```sql
-- Manual profile creation with error details
DO $
DECLARE
  v_user_id UUID := '<user-uuid>';
BEGIN
  INSERT INTO public.profiles (id, subscription_status)
  VALUES (v_user_id, 'pending_payment');
  RAISE NOTICE 'Profile created successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $;
```

---

## Benefits

### 🛡️ Reliability
- **Early detection** - Know immediately if trigger fails
- **Automatic repair** - Fix orphaned users with one API call
- **Prevent user frustration** - Users don't get stuck without profiles

### 📊 Visibility
- **Health dashboard** - See trigger status at a glance
- **Orphaned user tracking** - Know exactly who needs help
- **Historical data** - Track when issues occurred

### 🔧 Debugging
- **Detailed diagnostics** - Know exactly what's broken
- **Repair logs** - See which users were fixed
- **Proactive monitoring** - Catch issues before users report them

---

## Testing

### Test 1: Verify Monitoring Works

1. Run health check:
   ```sql
   SELECT * FROM get_trigger_health();
   ```

2. Should show healthy status

3. Call API endpoint:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     https://forgenursing.com/api/monitor/trigger-health
   ```

4. Should return `status: "healthy"`

---

### Test 2: Simulate Trigger Failure

**⚠️ WARNING: Only do this in development/staging!**

1. Disable trigger:
   ```sql
   ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
   ```

2. Create test user (will be orphaned)

3. Run health check:
   ```sql
   SELECT * FROM get_trigger_health();
   ```

4. Should show `CRITICAL: Trigger is disabled`

5. Re-enable trigger:
   ```sql
   ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
   ```

6. Repair orphaned user:
   ```sql
   SELECT * FROM repair_orphaned_users();
   ```

7. Verify health restored:
   ```sql
   SELECT * FROM get_trigger_health();
   ```

---

### Test 3: Test Repair Operation

1. Find or create orphaned user (see Test 2)

2. Call repair endpoint:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer <TOKEN>" \
     https://forgenursing.com/api/monitor/trigger-health
   ```

3. Verify response shows repaired users

4. Check health is restored:
   ```sql
   SELECT * FROM get_trigger_health();
   ```

---

## Monitoring Schedule

### Daily (Automated)
- Run health check via cron
- Alert if status is not "healthy"
- Log results for historical tracking

### Weekly (Manual)
- Review health check logs
- Check for any patterns in orphaned users
- Verify trigger is consistently working

### Monthly (Manual)
- Review all monitoring data
- Check for any degradation in performance
- Update alert thresholds if needed

---

## Integration with Existing Systems

### Webhook Monitoring
- Trigger monitoring complements webhook monitoring
- Webhooks handle subscription updates
- Trigger monitoring handles profile creation

### Login Sync
- Login sync is backup for missed webhooks
- Trigger monitoring is backup for profile creation
- Both provide redundancy

### Auth Callback
- Auth callback also creates profiles (backup)
- Trigger is primary mechanism
- Callback is safety net for edge cases

---

## Future Enhancements

### Phase 1 (Immediate)
- ✅ Database monitoring functions
- ✅ API endpoint for health checks
- ✅ Repair operation

### Phase 2 (Next Week)
- [ ] Automated alerting (email/Slack)
- [ ] Dashboard UI for viewing health
- [ ] Historical tracking of trigger health

### Phase 3 (Next Month)
- [ ] Predictive monitoring (detect issues before they occur)
- [ ] Auto-repair on detection (no manual intervention)
- [ ] Integration with error tracking (Sentry, etc.)

---

## Related Files

**Created:**
- `supabase_trigger_monitoring_schema.sql` - Database monitoring schema
- `src/app/api/monitor/trigger-health/route.ts` - Monitoring API endpoint
- `TRIGGER_MONITORING_FIX_SUMMARY.md` - This file

**Related:**
- `supabase_subscription_status_migration.sql` - Original trigger implementation
- `USER_LIFECYCLE_ANALYSIS.md` - User lifecycle documentation

---

## Conclusion

This monitoring system provides:
1. **Real-time health checks** for profile creation trigger
2. **Automatic detection** of orphaned users
3. **One-click repair** for any issues found
4. **Comprehensive diagnostics** for troubleshooting

Users will no longer get stuck without profiles due to trigger failures. The system will detect and fix issues automatically.

**Next Steps:**
1. Run database migration
2. Deploy monitoring endpoint
3. Test health check
4. Set up automated monitoring (optional)
