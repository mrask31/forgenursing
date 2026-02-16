-- ============================================
-- TRIAL EXPIRATION EMAIL SYSTEM
-- ============================================
-- Day 6: Reminder (24h before expiration)
-- Day 7: Expiration notice (when trial ends)
-- ============================================

-- 1. Create table to track trial expiration emails
CREATE TABLE IF NOT EXISTS public.trial_expiration_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'day_6_reminder' or 'day_7_expiration'
  trial_ends_at TIMESTAMPTZ NOT NULL,
  questions_answered INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  email_id TEXT, -- Resend email ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, email_type) -- One of each type per user
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trial_expiration_status ON public.trial_expiration_emails(status);
CREATE INDEX IF NOT EXISTS idx_trial_expiration_user_id ON public.trial_expiration_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_expiration_type ON public.trial_expiration_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_trial_expiration_created_at ON public.trial_expiration_emails(created_at);

-- Add RLS policies
ALTER TABLE public.trial_expiration_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage trial expiration emails"
  ON public.trial_expiration_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Function to get users needing Day 6 reminder (24h before expiration)
CREATE OR REPLACE FUNCTION get_users_for_day_6_reminder()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  trial_ends_at TIMESTAMPTZ,
  questions_answered INT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    u.email,
    p.trial_ends_at,
    COALESCE(
      (SELECT COUNT(*)::INT FROM user_quiz_history WHERE user_id = p.id),
      0
    ) as questions_answered
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE 
    -- Trial ends in 24-25 hours
    p.trial_ends_at > NOW() 
    AND p.trial_ends_at <= NOW() + INTERVAL '25 hours'
    -- Not already subscribed
    AND (p.subscription_status IS NULL OR p.subscription_status NOT IN ('active', 'trialing'))
    -- Haven't sent Day 6 email yet
    AND NOT EXISTS (
      SELECT 1 FROM public.trial_expiration_emails 
      WHERE user_id = p.id 
      AND email_type = 'day_6_reminder'
      AND status IN ('sent', 'pending')
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get users needing Day 7 expiration notice (trial expired)
CREATE OR REPLACE FUNCTION get_users_for_day_7_expiration()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  trial_ends_at TIMESTAMPTZ,
  questions_answered INT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    u.email,
    p.trial_ends_at,
    COALESCE(
      (SELECT COUNT(*)::INT FROM user_quiz_history WHERE user_id = p.id),
      0
    ) as questions_answered
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE 
    -- Trial has expired (within last 24 hours to avoid re-sending)
    p.trial_ends_at <= NOW()
    AND p.trial_ends_at > NOW() - INTERVAL '24 hours'
    -- Not already subscribed
    AND (p.subscription_status IS NULL OR p.subscription_status NOT IN ('active', 'trialing'))
    -- Haven't sent Day 7 email yet
    AND NOT EXISTS (
      SELECT 1 FROM public.trial_expiration_emails 
      WHERE user_id = p.id 
      AND email_type = 'day_7_expiration'
      AND status IN ('sent', 'pending')
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to queue trial expiration email
CREATE OR REPLACE FUNCTION queue_trial_expiration_email(
  p_user_id UUID,
  p_email TEXT,
  p_email_type TEXT,
  p_trial_ends_at TIMESTAMPTZ,
  p_questions_answered INT DEFAULT 0
)
RETURNS UUID AS $
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO public.trial_expiration_emails (
    user_id,
    email,
    email_type,
    trial_ends_at,
    questions_answered,
    status
  )
  VALUES (
    p_user_id,
    p_email,
    p_email_type,
    p_trial_ends_at,
    p_questions_answered,
    'pending'
  )
  ON CONFLICT (user_id, email_type) DO NOTHING
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to get pending trial expiration emails
CREATE OR REPLACE FUNCTION get_pending_trial_expiration_emails(batch_size INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  email_type TEXT,
  trial_ends_at TIMESTAMPTZ,
  questions_answered INT,
  created_at TIMESTAMPTZ
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.user_id,
    e.email,
    e.email_type,
    e.trial_ends_at,
    e.questions_answered,
    e.created_at
  FROM public.trial_expiration_emails e
  WHERE e.status = 'pending'
  AND e.attempts < 3 -- Max 3 attempts
  ORDER BY e.created_at ASC
  LIMIT batch_size;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to mark trial expiration email as sent
CREATE OR REPLACE FUNCTION mark_trial_expiration_email_sent(
  p_email_id UUID,
  p_resend_email_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $
BEGIN
  IF p_success THEN
    UPDATE public.trial_expiration_emails
    SET 
      status = 'sent',
      sent_at = NOW(),
      email_id = p_resend_email_id
    WHERE id = p_email_id;
  ELSE
    UPDATE public.trial_expiration_emails
    SET 
      status = CASE WHEN attempts >= 2 THEN 'failed' ELSE 'pending' END,
      attempts = attempts + 1,
      error_message = p_error_message
    WHERE id = p_email_id;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
--
-- This system requires a daily cron job to:
-- 1. Find users needing Day 6 reminder
-- 2. Find users needing Day 7 expiration notice
-- 3. Queue emails for both
-- 4. Process the queue via API
--
-- The API endpoint should:
-- 1. Call get_users_for_day_6_reminder()
-- 2. Call get_users_for_day_7_expiration()
-- 3. Queue emails using queue_trial_expiration_email()
-- 4. Process queue using get_pending_trial_expiration_emails()
-- 5. Send via Resend
-- 6. Mark as sent using mark_trial_expiration_email_sent()
--
-- ============================================
-- TESTING
-- ============================================
--
-- 1. Test Day 6 query (users expiring tomorrow):
-- SELECT * FROM get_users_for_day_6_reminder();
--
-- 2. Test Day 7 query (users expired today):
-- SELECT * FROM get_users_for_day_7_expiration();
--
-- 3. Manually set trial to expire tomorrow for testing:
-- UPDATE profiles 
-- SET trial_ends_at = NOW() + INTERVAL '24 hours'
-- WHERE id = '<user-id>';
--
-- 4. Manually set trial to expired for testing:
-- UPDATE profiles 
-- SET trial_ends_at = NOW() - INTERVAL '1 hour'
-- WHERE id = '<user-id>';
--
-- 5. Check queued emails:
-- SELECT * FROM trial_expiration_emails WHERE status = 'pending';
--
-- ============================================

COMMENT ON TABLE public.trial_expiration_emails IS 'Tracks Day 6 and Day 7 trial expiration emails';
COMMENT ON FUNCTION get_users_for_day_6_reminder() IS 'Gets users needing Day 6 reminder (24h before expiration)';
COMMENT ON FUNCTION get_users_for_day_7_expiration() IS 'Gets users needing Day 7 expiration notice (trial expired)';
COMMENT ON FUNCTION queue_trial_expiration_email(UUID, TEXT, TEXT, TIMESTAMPTZ, INT) IS 'Queues a trial expiration email';
COMMENT ON FUNCTION get_pending_trial_expiration_emails(INT) IS 'Gets pending trial expiration emails for processing';
COMMENT ON FUNCTION mark_trial_expiration_email_sent(UUID, TEXT, BOOLEAN, TEXT) IS 'Marks trial expiration email as sent or failed';
