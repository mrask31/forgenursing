-- Email Eligibility RPC Functions
-- Three Postgres functions for querying users eligible for each email sequence.
-- Called via supabase.rpc() from the email-eligibility TypeScript module.

-- Day 3: Inactive trial users (tolerance window)
CREATE OR REPLACE FUNCTION public.get_day3_eligible_users()
RETURNS TABLE(user_id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id AS user_id, au.email::TEXT
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.email_queue eq ON eq.user_id = au.id AND eq.email_type = 'onboarding_day_3'
  WHERE p.trial_ends_at IS NOT NULL
    AND p.created_at <= now() - interval '3 days'
    AND (au.last_sign_in_at IS NULL OR au.last_sign_in_at <= p.created_at + interval '1 minute')
    AND (p.is_beta IS NULL OR p.is_beta = false)
    AND eq.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Day 6: Trial users approaching expiration
CREATE OR REPLACE FUNCTION public.get_day6_eligible_users()
RETURNS TABLE(user_id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id AS user_id, au.email::TEXT
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.email_queue eq ON eq.user_id = au.id AND eq.email_type = 'onboarding_day_6'
  WHERE p.trial_ends_at IS NOT NULL
    AND p.created_at <= now() - interval '6 days'
    AND (p.is_beta IS NULL OR p.is_beta = false)
    AND p.subscription_status != 'active'
    AND eq.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Beta Day 7: Inactive beta users (tolerance window)
CREATE OR REPLACE FUNCTION public.get_beta_day7_eligible_users()
RETURNS TABLE(user_id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.id AS user_id, au.email::TEXT
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.email_queue eq ON eq.user_id = au.id AND eq.email_type = 'beta_day_7_reengagement'
  WHERE p.is_beta = true
    AND p.created_at <= now() - interval '7 days'
    AND (au.last_sign_in_at IS NULL OR au.last_sign_in_at <= p.created_at + interval '1 minute')
    AND eq.id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
