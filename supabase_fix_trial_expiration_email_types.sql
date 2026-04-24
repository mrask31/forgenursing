-- Fix: Clean up invalid email_type values in trial_expiration_emails
-- Then add CHECK constraint to prevent future bad inserts
-- APPLIED IN PRODUCTION: April 24, 2026

-- Step 1: Mark sent bad rows (preserves the 'sent' audit trail with a new distinguishable status)
UPDATE trial_expiration_emails
SET status = 'sent_invalid_type_legacy'
WHERE email_type NOT IN ('day_6_reminder', 'day_7_expiration')
  AND status = 'sent';

-- Step 2: Handle any pending rows (none existed, but kept for safety)
UPDATE trial_expiration_emails
SET status = 'invalid_type_legacy'
WHERE email_type NOT IN ('day_6_reminder', 'day_7_expiration')
  AND status = 'pending';

-- Step 3: CHECK constraint (updated to allow both legacy status markers)
ALTER TABLE trial_expiration_emails
  ADD CONSTRAINT email_type_valid
  CHECK (
    email_type IN ('day_6_reminder', 'day_7_expiration')
    OR status IN ('invalid_type_legacy', 'sent_invalid_type_legacy')
  );
