-- Fix: subscription_status != 'active' silently excluded NULL rows in PostgreSQL.
-- Changed all 7 beta lifecycle RPCs to use IS DISTINCT FROM 'active'
-- which correctly treats NULL subscription_status as "not active".
-- Bug discovered during E2E testing — beta users with NULL subscription_status
-- would never have received lifecycle emails.

CREATE OR REPLACE FUNCTION public.get_beta_users_for_day_3()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.created_at <= NOW() - INTERVAL '3 days'
    AND p.created_at >  NOW() - INTERVAL '4 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'day_3'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_users_for_week_1()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.created_at <= NOW() - INTERVAL '7 days'
    AND p.created_at >  NOW() - INTERVAL '8 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'week_1'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_users_for_day_30()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.created_at <= NOW() - INTERVAL '30 days'
    AND p.created_at >  NOW() - INTERVAL '31 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'day_30'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_users_for_day_45()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.created_at <= NOW() - INTERVAL '45 days'
    AND p.created_at >  NOW() - INTERVAL '46 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'day_45'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_users_for_day_60()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.created_at <= NOW() - INTERVAL '60 days'
    AND p.created_at >  NOW() - INTERVAL '61 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'day_60'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_users_for_day_76()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.beta_expires_at IS NOT NULL
    AND p.beta_expires_at <= NOW() + INTERVAL '15 days'
    AND p.beta_expires_at >  NOW() + INTERVAL '13 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'day_76'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_users_for_day_90()
 RETURNS TABLE(user_id uuid, email text, first_name text, beta_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    COALESCE(p.first_name, p.preferred_name, split_part(u.email::text, '@', 1))::text AS first_name,
    p.beta_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_beta = true
    AND p.subscription_status IS DISTINCT FROM 'active'
    AND p.beta_expires_at IS NOT NULL
    AND p.beta_expires_at <= NOW()
    AND p.beta_expires_at > NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.beta_lifecycle_emails b
      WHERE b.user_id = p.id
        AND b.email_type = 'day_90'
        AND b.status IN ('sent', 'pending')
    );
END;
$function$;
