-- ============================================
-- SIMPLE WELCOME EMAIL SETUP
-- ============================================

-- 1. Create table to track users who need welcome emails
CREATE TABLE IF NOT EXISTS public.welcome_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  email_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_welcome_queue_status ON public.welcome_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_welcome_queue_user_id ON public.welcome_email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_welcome_queue_created_at ON public.welcome_email_queue(created_at);

ALTER TABLE public.welcome_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage welcome queue"
  ON public.welcome_email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Function to queue welcome email
CREATE OR REPLACE FUNCTION queue_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  IF NEW.trial_ends_at IS NOT NULL THEN
    INSERT INTO public.welcome_email_queue (user_id, email, trial_ends_at, status)
    VALUES (NEW.id, v_email, NEW.trial_ends_at, 'pending')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Welcome email queued for user % (email: %)', NEW.id, v_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
DROP TRIGGER IF EXISTS on_profile_trial_queue_email ON public.profiles;
CREATE TRIGGER on_profile_trial_queue_email
  AFTER INSERT OR UPDATE OF trial_ends_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.trial_ends_at IS NOT NULL)
  EXECUTE FUNCTION queue_welcome_email();

-- 4. Function to process welcome email queue
CREATE OR REPLACE FUNCTION get_pending_welcome_emails(batch_size INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
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
  AND q.attempts < 3
  ORDER BY q.created_at ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_welcome_email_sent(
  p_queue_id UUID,
  p_email_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
