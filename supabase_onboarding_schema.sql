-- Migration: Add onboarding tracking fields to profiles table
-- Purpose: Track user progress through 3-step onboarding flow
-- Date: 2026-02-01

-- Add onboarding fields to profiles table
DO $$ 
BEGIN
  -- Add onboarding_completed field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
    ON profiles(onboarding_completed);
    
    RAISE NOTICE 'Added onboarding_completed column to profiles table';
  ELSE
    RAISE NOTICE 'onboarding_completed column already exists';
  END IF;

  -- Add onboarding_step field (1 = upload, 2 = ask, 3 = complete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_step INTEGER DEFAULT 0;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step 
    ON profiles(onboarding_step);
    
    RAISE NOTICE 'Added onboarding_step column to profiles table';
  ELSE
    RAISE NOTICE 'onboarding_step column already exists';
  END IF;

  -- Add onboarding_completed_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed_at 
    ON profiles(onboarding_completed_at);
    
    RAISE NOTICE 'Added onboarding_completed_at column to profiles table';
  ELSE
    RAISE NOTICE 'onboarding_completed_at column already exists';
  END IF;

  -- Add onboarding_skipped field (for users who skip onboarding)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_skipped'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_skipped BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Added onboarding_skipped column to profiles table';
  ELSE
    RAISE NOTICE 'onboarding_skipped column already exists';
  END IF;
END $$;

-- Update existing users to mark onboarding as completed (they're already using the app)
-- This prevents existing users from being forced through onboarding
UPDATE profiles 
SET onboarding_completed = TRUE, 
    onboarding_step = 3,
    onboarding_completed_at = NOW()
WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;

-- Add comment to table
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the 3-step onboarding flow';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current onboarding step: 0=not started, 1=upload, 2=ask, 3=complete';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding';
COMMENT ON COLUMN profiles.onboarding_skipped IS 'Whether user skipped onboarding (power users)';
