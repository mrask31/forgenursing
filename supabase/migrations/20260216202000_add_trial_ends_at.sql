-- Add trial_ends_at column to profiles table
-- This allows users to have access during their trial period

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add index for efficient trial expiration queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at 
ON public.profiles(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Timestamp when the user trial period ends. User has access if current time is before this date, regardless of subscription_status.';
