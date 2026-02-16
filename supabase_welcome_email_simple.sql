-- ============================================
-- SIMPLE WELCOME EMAIL SETUP (RECOMMENDED)
-- ============================================
-- This is a simpler approach that logs new trials
-- and lets your app send emails via a cron job or manual trigger
-- ============================================

-- 1. Create table to track users who need welcome emails
CREATE TABLE IF NOT EXISTS public.welcome_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  email_id TEXT, -- Resend email ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_welcome_queue_status ON public.welcome_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_welcome_queue_user_id ON public.welcome_email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_welcome_queue_created_at ON public.welcome_email_queue(created_at);

-- Add RLS policies
ALTER TABLE public.welcome_email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage
CREATE POLICY "Service role can manage welcome queue"
  ON public.welcome_email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Function to queue welcome email
CREATE OR REPLACE FUNCTION queue_welcome_email()
RETURNS TRIGGER AS $
DECLARE
  v_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Only queue if user has trial_ends_at and not already queued
  IF NEW.trial_ends_at IS NOT NULL THEN
    INSERT INTO public.welcome_email_queue (user_id, email, trial_ends_at, status)
    VALUES (NEW.id, v_email, NEW.trial_ends_at, 'pending')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Welcome email queued for user % (email: %)', NEW.id, v_email;
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
DROP TRIGGER IF EXISTS on_profile_trial_queue_email ON public.profiles;
CREATE TRIGGER on_profile_trial_queue_email
  AFTER INSERT OR UPDATE OF trial_ends_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.trial_ends_at IS NOT NULL)
  EXECUTE FUNCTION queue_welcome_email();

-- 4. Create function to process welcome email queue (called by API)
CREATE OR REPLACE FUNCTION get_pending_welcome_emails(batch_size INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.user_id,
    q.email,
    q.trial_ends_at,
    q.created_at
  FROM public.welcome_email_queue q
  WHERE q.status = 'pending'
  AND q.attempts < 3 -- Max 3 attempts
  ORDER BY q.created_at ASC
  LIMIT batch_size;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_welcome_email_sent(
  p_queue_id UUID,
  p_email_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $
BEGIN
  IF p_success THEN
    UPDATE public.welcome_email_queue
    SET 
      status = 'sent',
      sent_at = NOW(),
      email_id = p_email_id
    WHERE id = p_queue_id;
  ELSE
    UPDATE public.welcome_email_queue
    SET 
      status = CASE WHEN attempts >= 2 THEN 'failed' ELSE 'pending' END,
      attempts = attempts + 1,
      error_message = p_error_message
    WHERE id = p_queue_id;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
--
-- This approach queues welcome emails in the database.
-- You need to create an API endpoint to process the queue.
--
-- Example API endpoint: /api/emails/process-welcome-queue
-- 
-- The endpoint should:
-- 1. Call get_pending_welcome_emails() to get pending emails
-- 2. Send each email via Resend
-- 3. Call mark_welcome_email_sent() for each email
--
-- You can trigger this endpoint:
-- - Via a cron job (Vercel Cron or external service)
-- - Manually after user signup
-- - Via a webhook from Supabase
--
-- ============================================
-- TESTING
-- ============================================
--
-- 1. Set trial for a user:
-- UPDATE profiles 
-- SET trial_ends_at = NOW() + INTERVAL '7 days'
-- WHERE id = '<user-id>';
--
-- 2. Check queue:
-- SELECT * FROM welcome_email_queue WHERE status = 'pending';
--
-- 3. Get pending emails (as your API would):
-- SELECT * FROM get_pending_welcome_emails(10);
--
-- 4. Mark as sent (after sending):
-- SELECT mark_welcome_email_sent('<queue-id>', 're_email_id', true, NULL);
--
-- ============================================

COMMENT ON TABLE public.welcome_email_queue IS 'Queue of welcome emails to be sent to new trial users';
COMMENT ON FUNCTION queue_welcome_email() IS 'Queues welcome email when user starts trial';
COMMENT ON FUNCTION get_pending_welcome_emails(INT) IS 'Gets pending welcome emails for processing';
COMMENT ON FUNCTION mark_welcome_email_sent(UUID, TEXT, BOOLEAN, TEXT) IS 'Marks welcome email as sent or failed';
