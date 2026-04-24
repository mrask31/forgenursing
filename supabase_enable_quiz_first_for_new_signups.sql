-- ============================================================================
-- ForgeNursing — Enable quiz_first_enabled for NEW signups only
-- Status: NOT APPLIED — Run manually via Supabase SQL Editor
-- Date: 2026-04-24
-- 
-- This modifies the handle_new_user() trigger function so that new profiles
-- created from this point forward have quiz_first_enabled = true.
-- 
-- DOES NOT modify any existing profiles. No mass UPDATE.
-- ============================================================================

-- Verify current state: should return 0
-- SELECT COUNT(*) FROM profiles WHERE quiz_first_enabled = true;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.profiles (id, subscription_status, quiz_first_enabled)
  VALUES (NEW.id, 'pending_payment', true)
  ON CONFLICT (id) DO UPDATE SET
    subscription_status = COALESCE(profiles.subscription_status, 'pending_payment');
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify after: should STILL return 0 (no existing profiles changed)
-- SELECT COUNT(*) FROM profiles WHERE quiz_first_enabled = true;

-- ============================================================================
-- End of migration. DO NOT apply automatically.
-- Run via Supabase SQL Editor after review.
-- ============================================================================
