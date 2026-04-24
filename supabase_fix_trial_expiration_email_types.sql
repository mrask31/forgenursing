-- Fix: Clean up invalid email_type values in trial_expiration_emails
-- Then add CHECK constraint to prevent future bad inserts

-- Step 1: Mark invalid rows so they won't be processed
UPDATE trial_expiration_emails
SET status = 'invalid_type_legacy'
WHERE email_type NOT IN ('day_6_reminder', 'day_7_expiration')
  AND status = 'pending';

-- Step 2: Add CHECK constraint (will fail if pending invalid rows still exist)
ALTER TABLE trial_expiration_emails
  ADD CONSTRAINT email_type_valid
  CHECK (email_type IN ('day_6_reminder', 'day_7_expiration')
    OR status = 'invalid_type_legacy');
