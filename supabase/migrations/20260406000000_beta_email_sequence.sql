-- ============================================
-- BETA USER EMAIL SEQUENCE
-- Sends Day 3, Day 30, and Day 76 follow-ups
-- to users where is_beta = true
-- ============================================

-- 1. Create table to track beta sequence emails
CREATE TABLE IF NOT EXISTS public.beta_email_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('day_3', 'day_30', 'day_76')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  email_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_beta_email_seq_status ON public.beta_email_sequence(status);
CREATE INDEX IF NOT EXISTS idx_beta_email_seq_user_id ON public.beta_email_sequence(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_email_seq_type ON public.beta_email_sequence(email_type);
CREATE INDEX IF NOT EXISTS idx_beta_email_seq_created_at ON public.beta_email_sequence(created_at);

ALTER TABLE public.beta_email_sequence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage beta email sequence"
  ON public.beta_email_sequence
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Function to find beta users eligible for Day 3 email
CREATE OR REPLACE FUNCTION get_beta_users_for_day_3()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  beta_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    u.email,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE
    p.is_beta = TRUE
    AND u.created_at <= NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_email_sequence
      WHERE beta_email_sequence.user_id = p.id
      AND email_type = 'day_3'
      AND status IN ('sent', 'pending')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to find beta users eligible for Day 30 email
CREATE OR REPLACE FUNCTION get_beta_users_for_day_30()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  beta_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    u.email,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE
    p.is_beta = TRUE
    AND u.created_at <= NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_email_sequence
      WHERE beta_email_sequence.user_id = p.id
      AND email_type = 'day_30'
      AND status IN ('sent', 'pending')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to find beta users eligible for Day 76 email (14 days before beta_expires_at)
CREATE OR REPLACE FUNCTION get_beta_users_for_day_76()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  beta_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    u.email,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE
    p.is_beta = TRUE
    AND p.beta_expires_at IS NOT NULL
    AND p.beta_expires_at > NOW()
    AND p.beta_expires_at <= NOW() + INTERVAL '14 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_email_sequence
      WHERE beta_email_sequence.user_id = p.id
      AND email_type = 'day_76'
      AND status IN ('sent', 'pending')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to queue a beta sequence email
CREATE OR REPLACE FUNCTION queue_beta_sequence_email(
  p_user_id UUID,
  p_email TEXT,
  p_email_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.beta_email_sequence (
    user_id,
    email,
    email_type,
    status
  )
  VALUES (
    p_user_id,
    p_email,
    p_email_type,
    'pending'
  )
  ON CONFLICT (user_id, email_type) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get pending beta sequence emails
CREATE OR REPLACE FUNCTION get_pending_beta_sequence_emails(batch_size INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  email_type TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.user_id,
    e.email,
    e.email_type,
    e.created_at
  FROM public.beta_email_sequence e
  WHERE e.status = 'pending'
  AND e.attempts < 3
  ORDER BY e.created_at ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to mark a beta sequence email as sent or failed
CREATE OR REPLACE FUNCTION mark_beta_sequence_email_sent(
  p_email_id UUID,
  p_resend_email_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_success THEN
    UPDATE public.beta_email_sequence
    SET
      status = 'sent',
      sent_at = NOW(),
      email_id = p_resend_email_id
    WHERE id = p_email_id;
  ELSE
    UPDATE public.beta_email_sequence
    SET
      status = CASE WHEN attempts >= 2 THEN 'failed' ELSE 'pending' END,
      attempts = attempts + 1,
      error_message = p_error_message
    WHERE id = p_email_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Log sent beta emails to welcome_emails_sent for tracking
-- We need to alter welcome_emails_sent to support multiple emails per user
-- by adding a type column and adjusting the unique constraint
ALTER TABLE public.welcome_emails_sent
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'welcome';

-- Drop the old unique constraint on user_id only
ALTER TABLE public.welcome_emails_sent
  DROP CONSTRAINT IF EXISTS welcome_emails_sent_user_id_key;

-- Add new unique constraint on (user_id, type)
ALTER TABLE public.welcome_emails_sent
  ADD CONSTRAINT welcome_emails_sent_user_id_type_key UNIQUE (user_id, type);
