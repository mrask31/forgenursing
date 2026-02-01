-- ROLLBACK: Remove onboarding fields from profiles table
-- Run this to undo the onboarding migration if needed

-- Remove indexes
DROP INDEX IF EXISTS idx_profiles_onboarding_completed;
DROP INDEX IF EXISTS idx_profiles_onboarding_step;
DROP INDEX IF EXISTS idx_profiles_onboarding_completed_at;

-- Remove columns
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_completed;
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_step;
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_completed_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_skipped;
