# Welcome Email - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration (2 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase_welcome_email_simple.sql`
3. Paste and click "Run"

### Step 2: Verify Environment Variables (1 minute)

Check your `.env.local` has:
```bash
RESEND_API_KEY=re_your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

### Step 3: Test It (2 minutes)

**Option A: Test Email Only**
```bash
chmod +x test-welcome-email.sh
./test-welcome-email.sh your-email@example.com
```

**Option B: Full Signup Flow**
1. Go to `/signup`
2. Create new account
3. Check email inbox

## ✅ Success Checklist

- [ ] Database migration ran without errors
- [ ] Environment variables are set
- [ ] Test email received in inbox
- [ ] Email looks good on mobile and desktop
- [ ] "Start Your First Quiz" button works
- [ ] New signups receive email automatically

## 📊 Monitor It

```sql
-- Check queue status
SELECT status, COUNT(*) 
FROM welcome_email_queue 
GROUP BY status;

-- See recent emails
SELECT email, status, sent_at 
FROM welcome_email_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🐛 Troubleshooting

**Email not received?**
- Check spam folder
- Verify RESEND_API_KEY is set
- Check Resend dashboard: https://resend.com/emails

**Email stuck in queue?**
```bash
curl -X POST https://forgenursing.com/api/emails/process-welcome-queue \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Need help?**
See `WELCOME_EMAIL_SETUP_GUIDE.md` for detailed docs.

## 📈 What to Track

1. **Delivery Rate**: Should be >99%
2. **Open Rate**: Target >40%
3. **Click Rate**: Target >20%
4. **Quiz Completion**: Target 30% within 24h

Check Resend dashboard for email metrics.

## 🎯 The Goal

Drive new users to complete their first 10-question practice quiz within the first session. This is the "Quick Win" that activates users and shows the value of ForgeNursing.

---

**Need more details?** See `WELCOME_EMAIL_SETUP_GUIDE.md`
**Implementation summary?** See `DAY_0_WELCOME_EMAIL_COMPLETE.md`
