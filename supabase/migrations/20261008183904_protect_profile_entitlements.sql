-- Profiles are provisioned by handle_new_user(), not by browser inserts.
-- RLS limits rows; column grants separately limit what an owner can change.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Remove any legacy column grants as well as the table-level grants above.
DO $$
DECLARE columns_sql text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
    INTO columns_sql FROM pg_attribute
    WHERE attrelid = 'public.profiles'::regclass AND attnum > 0 AND NOT attisdropped;
  EXECUTE format('REVOKE INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.profiles FROM PUBLIC, anon, authenticated',
    columns_sql, columns_sql, columns_sql);
END $$;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
  first_name, preferred_name, program_type, program_track, program_level,
  exam_date, university_name, school_name, graduation_date,
  onboarding_completed, onboarding_step, onboarding_completed_at, onboarding_skipped,
  phi_acknowledged_at, default_entry_path
) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Owners update profile preferences" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Internal maintenance, email, and webhook functions must not bypass these
-- boundaries through publicly callable SECURITY DEFINER RPCs.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.proname = ANY(ARRAY[
      'repair_orphaned_users', 'test_set_user_created_at', 'get_orphaned_users',
      'get_trigger_health', 'get_webhook_stats', 'get_webhooks_for_retry',
      'get_beta_users_for_day_3', 'get_beta_users_for_day_30',
      'get_beta_users_for_day_45', 'get_beta_users_for_day_60',
      'get_beta_users_for_day_76', 'get_beta_users_for_day_90', 'get_beta_users_for_week_1',
      'get_trial_day1_eligible_users', 'get_trial_day3_eligible_users', 'get_trial_day5_eligible_users',
      'get_users_for_day_6_reminder', 'get_users_for_day_7_expiration',
      'get_pending_beta_lifecycle_emails', 'get_pending_trial_expiration_emails',
      'get_pending_welcome_emails', 'mark_beta_lifecycle_email_sent',
      'mark_trial_expiration_email_sent', 'mark_welcome_email_sent',
      'queue_beta_lifecycle_email', 'queue_trial_expiration_email'
    ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.signature);
  END LOOP;
END $$;
