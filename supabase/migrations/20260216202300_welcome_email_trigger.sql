-- ============================================
-- WELCOME EMAIL AUTOMATION
-- ============================================

-- 1. Create table to track sent welcome emails
CREATE TABLE IF NOT EXISTS public.welcome_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_welcome_emails_user_id ON public.welcome_emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_welcome_emails_sent_at ON public.welcome_emails_sent(sent_at);

ALTER TABLE public.welcome_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage welcome emails"
  ON public.welcome_emails_sent
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Function to send welcome email via webhook
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_response TEXT;
  v_app_url TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  IF EXISTS (SELECT 1 FROM public.welcome_emails_sent WHERE user_id = NEW.id) THEN
    RAISE NOTICE 'Welcome email already sent for user %', NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.trial_ends_at IS NOT NULL THEN
    v_app_url := current_setting('app.settings.app_url', true);
    IF v_app_url IS NULL OR v_app_url = '' THEN
      v_app_url := 'https://forgenursing.com';
    END IF;

    BEGIN
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

      INSERT INTO public.welcome_emails_sent (user_id, email, status)
      VALUES (NEW.id, v_email, 'sent')
      ON CONFLICT (user_id) DO NOTHING;

      RAISE NOTICE 'Welcome email queued for user % (email: %)', NEW.id, v_email;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.welcome_emails_sent (user_id, email, status, error_message)
      VALUES (NEW.id, v_email, 'failed', SQLERRM)
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE WARNING 'Failed to send welcome email for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger
DROP TRIGGER IF EXISTS on_profile_trial_started ON public.profiles;
CREATE TRIGGER on_profile_trial_started
  AFTER INSERT OR UPDATE OF trial_ends_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.trial_ends_at IS NOT NULL)
  EXECUTE FUNCTION send_welcome_email();
