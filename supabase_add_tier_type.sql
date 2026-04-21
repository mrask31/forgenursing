-- Migration: Add tier_type column to profiles table
-- Tracks which plan the user is on: monthly, semester, annual, free_trial, beta, solo

-- Add column if it doesn't exist (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'tier_type'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN tier_type TEXT DEFAULT NULL;
  END IF;
END $$;

-- Backfill existing users based on current state
-- Beta users → 'beta'
UPDATE public.profiles
SET tier_type = 'beta'
WHERE is_beta = true AND (tier_type IS NULL OR tier_type = '');

-- Trialing non-beta users → 'free_trial'
UPDATE public.profiles
SET tier_type = 'free_trial'
WHERE is_beta = false
  AND subscription_status = 'trialing'
  AND (tier_type IS NULL OR tier_type = '');

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.tier_type IS 'Plan type: monthly, semester, annual, free_trial, beta, solo';
