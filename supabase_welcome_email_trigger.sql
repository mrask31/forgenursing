-- ============================================
-- WELCOME EMAIL AUTOMATION
-- ============================================
-- This migration sets up automatic welcome email sending
-- when a new user signs up and gets a trial period
-- ============================================

-- 1. Create table to track sent welcome emails (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.welcome_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_id TEXT, -- Resend email ID for tracking
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  UNIQUE(user_id) -- Ensure only one welcome email per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_welcome_emails_user_id ON public.welcome_emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_welcome_emails_sent_at ON public.welcome_emails_sent(sent_at);

-- Add RLS policies
ALTER TABLE public.welcome_emails_sent ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write
CREATE POLICY "Service role can manage welcome emails"
  ON public.welcome_emails_sent
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Create function to send welcome email via webhook
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $
DECLARE
  v_email TEXT;
  v_response TEXT;
  v_app_url TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Check if welcome email was already sent
  IF EXISTS (SELECT 1 FROM public.welcome_emails_sent WHERE user_id = NEW.id) THEN
    RAISE NOTICE 'Welcome email already sent for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- Only send if user has a trial_ends_at date (indicating they're on trial)
  IF NEW.trial_ends_at IS NOT NULL THEN
    -- Get app URL from environment or use default
    -- In production, set this in Supabase Dashboard -> Project Settings -> API -> Project URL
    v_app_url := current_setting('app.settings.app_url', true);
    IF v_app_url IS NULL OR v_app_url = '' THEN
      v_app_url := 'https://forgenursing.com'; -- Default production URL
    END IF;

    -- Call the welcome email API endpoint
    BEGIN
      -- Use pg_net extension to make HTTP request
      -- Note: This requires pg_net extension to be enabled in Supabase
      PERFORM net.http_post(
        url := v_app_url || '/api/emails/welcome',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'userId', NEW.id,
          'email', v_email
        )
      );

      -- Log that we attempted to send the email
      INSERT INTO public.welcome_emails_sent (user_id, email, status)
      VALUES (NEW.id, v_email, 'sent')
      ON CONFLICT (user_id) DO NOTHING;

      RAISE NOTICE 'Welcome email queued for user % (email: %)', NEW.id, v_email;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the profile creation
      INSERT INTO public.welcome_emails_sent (user_id, email, status, error_message)
      VALUES (NEW.id, v_email, 'failed', SQLERRM)
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE WARNING 'Failed to send welcome email for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on profiles table to send welcome email
-- This fires AFTER a profile is created or updated with trial_ends_at
DROP TRIGGER IF EXISTS on_profile_trial_started ON public.profiles;
CREATE TRIGGER on_profile_trial_started
  AFTER INSERT OR UPDATE OF trial_ends_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.trial_ends_at IS NOT NULL)
  EXECUTE FUNCTION send_welcome_email();

-- ============================================
-- SETUP INSTRUCTIONS
-- ============================================
-- 
-- 1. Enable pg_net extension (if not already enabled):
--    - Go to Supabase Dashboard -> Database -> Extensions
--    - Search for "pg_net" and enable it
--
-- 2. Set configuration variables in Supabase:
--    - Go to Dashboard -> Project Settings -> API
--    - Note your Project URL (e.g., https://xxxxx.supabase.co)
--    - Note your service_role key
--
-- 3. Run this SQL to set the config (replace with your values):
--    ALTER DATABASE postgres SET app.settings.app_url = 'https://forgenursing.com';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
--
-- 4. Verify the setup:
--    SELECT current_setting('app.settings.app_url', true);
--    SELECT current_setting('app.settings.service_role_key', true);
--
-- ============================================
-- TESTING
-- ============================================
--
-- Test by setting a trial date for an existing user:
-- UPDATE profiles 
-- SET trial_ends_at = NOW() + INTERVAL '7 days'
-- WHERE id = '<user-id>';
--
-- Check if email was logged:
-- SELECT * FROM welcome_emails_sent WHERE user_id = '<user-id>';
--
-- ============================================
-- MANUAL TRIGGER (if needed)
-- ============================================
--
-- If you need to manually trigger welcome emails for existing users:
-- 
-- UPDATE profiles 
-- SET trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '7 days')
-- WHERE trial_ends_at IS NULL 
-- AND subscription_status = 'pending_payment'
-- AND id NOT IN (SELECT user_id FROM welcome_emails_sent);
--
-- ============================================

COMMENT ON TABLE public.welcome_emails_sent IS 'Tracks welcome emails sent to users to prevent duplicates';
COMMENT ON FUNCTION send_welcome_email() IS 'Sends welcome email via API when user starts trial';
