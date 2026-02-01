-- FIX: Reset onboarding status for the new user who just signed up
-- This ensures they see the onboarding flow when code deploys

-- Option 1: If you know the user's email, reset just that user
-- UPDATE profiles 
-- SET onboarding_completed = FALSE, 
--     onboarding_step = 0,
--     onboarding_completed_at = NULL
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'NEW_USER_EMAIL_HERE');

-- Option 2: Reset ALL users who signed up in the last hour (safer)
UPDATE profiles 
SET onboarding_completed = FALSE, 
    onboarding_step = 0,
    onboarding_completed_at = NULL
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE created_at > NOW() - INTERVAL '1 hour'
);

-- Option 3: Reset ALL users who signed up today
-- UPDATE profiles 
-- SET onboarding_completed = FALSE, 
--     onboarding_step = 0,
--     onboarding_completed_at = NULL
-- WHERE id IN (
--   SELECT id FROM auth.users 
--   WHERE created_at > CURRENT_DATE
-- );
