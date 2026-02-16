# Deployment Checklist - 7-Day Trial & Welcome Email

## Pre-Deployment

### Code Review
- [x] ✅ All TypeScript files compile without errors
- [x] ✅ No console errors in development
- [x] ✅ All API routes have proper error handling
- [x] ✅ Database migrations are idempotent (safe to re-run)
- [x] ✅ Environment variables documented

### Testing
- [ ] ⏳ Test signup flow end-to-end
- [ ] ⏳ Test welcome email delivery
- [ ] ⏳ Test trial access logic
- [ ] ⏳ Test upgrade modal display
- [ ] ⏳ Test email on mobile devices
- [ ] ⏳ Test email in different email clients

## Database Setup

### Supabase Configuration
- [ ] ⏳ Run `supabase_trial_ends_at_migration.sql`
- [ ] ⏳ Run `supabase_welcome_email_simple.sql`
- [ ] ⏳ Verify tables created successfully
- [ ] ⏳ Verify triggers created successfully
- [ ] ⏳ Verify RLS policies are correct

### Verification Queries
```sql
-- Check trial_ends_at column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'trial_ends_at';

-- Check welcome_email_queue table exists
SELECT * FROM welcome_email_queue LIMIT 1;

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN ('on_profile_trial_queue_email');
```

## Environment Variables

### Development (.env.local)
- [ ] ⏳ `RESEND_API_KEY` set
- [ ] ⏳ `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] ⏳ `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] ⏳ `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] ⏳ `NEXT_PUBLIC_APP_URL` set (optional for dev)

### Production (Vercel)
- [ ] ⏳ `RESEND_API_KEY` set in Vercel
- [ ] ⏳ `SUPABASE_SERVICE_ROLE_KEY` set in Vercel
- [ ] ⏳ `NEXT_PUBLIC_SUPABASE_URL` set in Vercel
- [ ] ⏳ `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] ⏳ `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] ⏳ `CRON_SECRET` set (if using cron)

## Resend Configuration

### Account Setup
- [ ] ⏳ Resend account created
- [ ] ⏳ API key generated
- [ ] ⏳ Domain added (forgenursing.com)
- [ ] ⏳ DNS records configured
- [ ] ⏳ Domain verified (green checkmark)
- [ ] ⏳ Test email sent successfully

### Email Settings
- [ ] ⏳ From address: `welcome@forgenursing.com`
- [ ] ⏳ Reply-to configured (optional)
- [ ] ⏳ Webhooks configured (optional)

## Testing Checklist

### Unit Tests
- [ ] ⏳ Test `isTrialActive()` function
- [ ] ⏳ Test `hasAccess()` function
- [ ] ⏳ Test `useUser` hook
- [ ] ⏳ Test email HTML rendering

### Integration Tests
- [ ] ⏳ Test signup → trial set → email queued
- [ ] ⏳ Test queue processing
- [ ] ⏳ Test email delivery
- [ ] ⏳ Test access control in middleware

### End-to-End Tests
- [ ] ⏳ Complete signup flow
- [ ] ⏳ Receive welcome email
- [ ] ⏳ Click CTA in email
- [ ] ⏳ Access protected routes
- [ ] ⏳ See trial banner
- [ ] ⏳ See upgrade modal when trial expires

### Email Testing
- [ ] ⏳ Test in Gmail
- [ ] ⏳ Test in Outlook
- [ ] ⏳ Test in Apple Mail
- [ ] ⏳ Test on iPhone
- [ ] ⏳ Test on Android
- [ ] ⏳ Check spam folder placement
- [ ] ⏳ Verify links work
- [ ] ⏳ Verify images load

## Deployment Steps

### 1. Commit Code
```bash
git add .
git commit -m "Add 7-day trial and welcome email system"
git push origin main
```

### 2. Deploy to Vercel
- [ ] ⏳ Push triggers automatic deployment
- [ ] ⏳ Deployment succeeds
- [ ] ⏳ No build errors
- [ ] ⏳ Environment variables loaded

### 3. Run Database Migrations
- [ ] ⏳ Open Supabase SQL Editor
- [ ] ⏳ Run `supabase_trial_ends_at_migration.sql`
- [ ] ⏳ Run `supabase_welcome_email_simple.sql`
- [ ] ⏳ Verify no errors

### 4. Smoke Test Production
- [ ] ⏳ Visit production signup page
- [ ] ⏳ Create test account
- [ ] ⏳ Verify trial set in database
- [ ] ⏳ Verify email queued
- [ ] ⏳ Verify email received
- [ ] ⏳ Verify CTA works
- [ ] ⏳ Verify access granted

## Post-Deployment

### Monitoring Setup
- [ ] ⏳ Set up Resend webhook (optional)
- [ ] ⏳ Set up error alerting
- [ ] ⏳ Set up queue monitoring
- [ ] ⏳ Set up conversion tracking

### Documentation
- [ ] ⏳ Update team wiki
- [ ] ⏳ Share setup guide with team
- [ ] ⏳ Document monitoring queries
- [ ] ⏳ Document troubleshooting steps

### Analytics
- [ ] ⏳ Set up email open tracking
- [ ] ⏳ Set up click tracking
- [ ] ⏳ Set up conversion tracking
- [ ] ⏳ Set up dashboard for metrics

## Rollback Plan

### If Issues Occur

**Email Issues:**
1. Check Resend dashboard for errors
2. Check `welcome_email_queue` for failed emails
3. Manually process queue: `POST /api/emails/process-welcome-queue`
4. If critical: Disable trigger temporarily

**Access Issues:**
1. Check middleware logs
2. Verify trial_ends_at is set correctly
3. Verify subscription_status is correct
4. If critical: Revert middleware changes

**Database Issues:**
1. Check Supabase logs
2. Verify migrations ran successfully
3. If critical: Run rollback migration

### Rollback Commands
```sql
-- Remove trial_ends_at column (if needed)
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_ends_at;

-- Disable email trigger (if needed)
DROP TRIGGER IF EXISTS on_profile_trial_queue_email ON profiles;

-- Clear email queue (if needed)
TRUNCATE TABLE welcome_email_queue;
```

## Success Metrics

### Week 1 Targets
- [ ] ⏳ Email delivery rate >95%
- [ ] ⏳ Email open rate >30%
- [ ] ⏳ Email click rate >15%
- [ ] ⏳ Zero critical errors
- [ ] ⏳ Queue processing <5 minutes

### Week 2 Targets
- [ ] ⏳ Email delivery rate >99%
- [ ] ⏳ Email open rate >40%
- [ ] ⏳ Email click rate >20%
- [ ] ⏳ Quiz completion rate >20%
- [ ] ⏳ Queue processing <2 minutes

### Month 1 Targets
- [ ] ⏳ Trial to paid conversion >10%
- [ ] ⏳ Quiz completion rate >30%
- [ ] ⏳ Email engagement stable
- [ ] ⏳ Zero email bounces
- [ ] ⏳ System running smoothly

## Monitoring Queries

### Daily Health Check
```sql
-- Email queue status
SELECT status, COUNT(*) FROM welcome_email_queue GROUP BY status;

-- Emails sent today
SELECT COUNT(*) FROM welcome_email_queue 
WHERE sent_at::date = CURRENT_DATE;

-- Failed emails today
SELECT * FROM welcome_email_queue 
WHERE status = 'failed' AND created_at::date = CURRENT_DATE;

-- Average time to send
SELECT AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) / 60 as avg_minutes
FROM welcome_email_queue 
WHERE sent_at::date = CURRENT_DATE;
```

### Weekly Report
```sql
-- Weekly stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / COUNT(*), 2) as success_rate
FROM welcome_email_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Support Contacts

### Internal
- **Engineering Lead:** [Name]
- **Product Manager:** [Name]
- **On-Call Engineer:** [Name]

### External
- **Resend Support:** support@resend.com
- **Supabase Support:** support@supabase.com
- **Vercel Support:** support@vercel.com

## Emergency Procedures

### Email System Down
1. Check Resend status page
2. Check API logs in Vercel
3. Check Supabase logs
4. Manually process queue if needed
5. Contact Resend support if persistent

### Database Issues
1. Check Supabase status page
2. Check connection strings
3. Verify service role key
4. Check RLS policies
5. Contact Supabase support if needed

### Access Control Issues
1. Check middleware logs
2. Verify environment variables
3. Test with known good user
4. Check database values
5. Revert middleware if critical

---

## Sign-Off

### Development Team
- [ ] ⏳ Code reviewed and approved
- [ ] ⏳ Tests passing
- [ ] ⏳ Documentation complete

### Product Team
- [ ] ⏳ Feature tested and approved
- [ ] ⏳ Email copy approved
- [ ] ⏳ User flow validated

### Operations Team
- [ ] ⏳ Monitoring configured
- [ ] ⏳ Alerts set up
- [ ] ⏳ Runbook created

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Approved By:** _______________

**Status:** 🟡 Ready for Deployment
