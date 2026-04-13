-- ============================================
-- DAY 0 ONBOARDING EMAIL QUEUE TRIGGER
-- ============================================
-- Queues a pending 'onboarding_day_0' email into email_queue
-- when a profile is created or updated with a non-null trial_ends_at.
-- Uses AFTER INSERT OR UPDATE OF trial_ends_at to match the existing
-- send_welcome_email trigger pattern, ensuring the Day 0 email queues
-- correctly regardless of when trial_ends_at gets populated.
-- ============================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.queue_onboarding_day_0()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NOT NULL THEN
    INSERT INTO public.email_queue (user_id, email, email_type, status)
    SELECT NEW.id, au.email, 'onboarding_day_0', 'pending'
    FROM auth.users au
    WHERE au.id = NEW.id
    ON CONFLICT (user_id, email_type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (drop first for idempotent re-runs)
DROP TRIGGER IF EXISTS trigger_queue_onboarding_day_0 ON public.profiles;
CREATE TRIGGER trigger_queue_onboarding_day_0
  AFTER INSERT OR UPDATE OF trial_ends_at ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_onboarding_day_0();
