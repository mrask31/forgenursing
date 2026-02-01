-- ============================================
-- DATABASE TRIGGER HEALTH MONITORING
-- ============================================
-- This migration adds monitoring capabilities for the profile
-- creation trigger to detect and alert on failures
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Create function to check trigger health
CREATE OR REPLACE FUNCTION get_trigger_health()
RETURNS TABLE (
  trigger_name TEXT,
  trigger_enabled BOOLEAN,
  function_exists BOOLEAN,
  orphaned_users_count BIGINT,
  last_user_created_at TIMESTAMPTZ,
  last_profile_created_at TIMESTAMPTZ,
  health_status TEXT
) AS $$
DECLARE
  v_trigger_enabled BOOLEAN;
  v_function_exists BOOLEAN;
  v_orphaned_count BIGINT;
  v_last_user_created TIMESTAMPTZ;
  v_last_profile_created TIMESTAMPTZ;
  v_health_status TEXT;
BEGIN
  -- Check if trigger exists and is enabled
  SELECT tgenabled = 'O' INTO v_trigger_enabled
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created'
  AND tgrelid = 'auth.users'::regclass;
  
  -- If trigger doesn't exist, set to false
  IF v_trigger_enabled IS NULL THEN
    v_trigger_enabled := FALSE;
  END IF;
  
  -- Check if trigger function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) INTO v_function_exists;
  
  -- Count orphaned users (users without profiles)
  SELECT COUNT(*) INTO v_orphaned_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  -- Get last user creation time
  SELECT MAX(created_at) INTO v_last_user_created
  FROM auth.users;
  
  -- Get last profile creation time
  SELECT MAX(created_at) INTO v_last_profile_created
  FROM public.profiles;
  
  -- Determine health status
  IF NOT v_trigger_enabled THEN
    v_health_status := 'CRITICAL: Trigger is disabled';
  ELSIF NOT v_function_exists THEN
    v_health_status := 'CRITICAL: Trigger function missing';
  ELSIF v_orphaned_count > 0 THEN
    v_health_status := 'WARNING: ' || v_orphaned_count || ' orphaned users found';
  ELSE
    v_health_status := 'HEALTHY: All systems operational';
  END IF;
  
  -- Return results
  RETURN QUERY SELECT
    'on_auth_user_created'::TEXT,
    v_trigger_enabled,
    v_function_exists,
    v_orphaned_count,
    v_last_user_created,
    v_last_profile_created,
    v_health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to get orphaned users details
CREATE OR REPLACE FUNCTION get_orphaned_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  age_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 60 AS age_minutes
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to repair orphaned users
CREATE OR REPLACE FUNCTION repair_orphaned_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  repair_status TEXT
) AS $$
DECLARE
  v_user RECORD;
  v_repair_status TEXT;
BEGIN
  -- Loop through orphaned users
  FOR v_user IN 
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      -- Create profile for orphaned user
      INSERT INTO public.profiles (id, subscription_status)
      VALUES (v_user.id, 'pending_payment')
      ON CONFLICT (id) DO NOTHING;
      
      v_repair_status := 'SUCCESS: Profile created';
      
    EXCEPTION WHEN OTHERS THEN
      v_repair_status := 'FAILED: ' || SQLERRM;
    END;
    
    -- Return result for this user
    RETURN QUERY SELECT v_user.id, v_user.email, v_repair_status;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create view for easy monitoring
CREATE OR REPLACE VIEW trigger_health_dashboard AS
SELECT 
  (SELECT trigger_name FROM get_trigger_health()) AS trigger_name,
  (SELECT trigger_enabled FROM get_trigger_health()) AS trigger_enabled,
  (SELECT function_exists FROM get_trigger_health()) AS function_exists,
  (SELECT orphaned_users_count FROM get_trigger_health()) AS orphaned_users,
  (SELECT last_user_created_at FROM get_trigger_health()) AS last_user_created,
  (SELECT last_profile_created_at FROM get_trigger_health()) AS last_profile_created,
  (SELECT health_status FROM get_trigger_health()) AS health_status,
  NOW() AS checked_at;

-- 5. Grant execute permissions to authenticated users (for API access)
GRANT EXECUTE ON FUNCTION get_trigger_health() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orphaned_users() TO authenticated;
GRANT EXECUTE ON FUNCTION repair_orphaned_users() TO authenticated;

-- 6. Create RLS policy for the view (service role only)
-- Note: Views don't have RLS, but we'll document that this should be accessed via service role

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration and check health:

-- Check trigger health (should show HEALTHY)
-- SELECT * FROM get_trigger_health();

-- Check for orphaned users (should return 0 rows)
-- SELECT * FROM get_orphaned_users();

-- View dashboard
-- SELECT * FROM trigger_health_dashboard;

-- If orphaned users found, repair them:
-- SELECT * FROM repair_orphaned_users();

-- ============================================
-- MONITORING QUERIES FOR DAILY USE
-- ============================================

-- Quick health check (run daily)
-- SELECT health_status, orphaned_users_count 
-- FROM get_trigger_health();

-- Detailed orphaned users (if any found)
-- SELECT user_id, email, age_minutes 
-- FROM get_orphaned_users() 
-- WHERE age_minutes > 5; -- Only show users older than 5 minutes

-- Check trigger is enabled
-- SELECT tgname, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname = 'on_auth_user_created';
-- Expected: tgenabled = 'O' (enabled)

-- Check function exists
-- SELECT proname, prosrc 
-- FROM pg_proc 
-- WHERE proname = 'handle_new_user';
-- Expected: 1 row returned

-- ============================================
-- ALERTING THRESHOLDS
-- ============================================
-- Set up alerts based on these conditions:
--
-- CRITICAL:
-- - trigger_enabled = FALSE
-- - function_exists = FALSE
-- - orphaned_users_count > 0 AND age > 10 minutes
--
-- WARNING:
-- - orphaned_users_count > 0 AND age < 10 minutes
-- - last_user_created > last_profile_created (timing mismatch)
--
-- HEALTHY:
-- - trigger_enabled = TRUE
-- - function_exists = TRUE
-- - orphaned_users_count = 0
-- ============================================
