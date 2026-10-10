-- Run using an administrative database connection. All fixture writes, including
-- signup-trigger email queue rows, are rolled back inside the exception block.
CREATE OR REPLACE FUNCTION pg_temp.verify_profile_entitlements()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  qa_owner uuid := gen_random_uuid();
  qa_other uuid := gen_random_uuid();
  field_name text;
  blocked integer := 0;
  affected integer;
  result jsonb := '{}'::jsonb;
BEGIN
  BEGIN
    INSERT INTO auth.users(id,email) VALUES
      (qa_owner, 'qa-entitlement-' || qa_owner || '@example.invalid'),
      (qa_other, 'qa-entitlement-' || qa_other || '@example.invalid');
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=qa_owner
      AND subscription_status='trialing'
      AND trial_ends_at BETWEEN now()+interval '6 days 23 hours' AND now()+interval '7 days 1 hour')
    THEN RAISE EXCEPTION 'Signup trial provisioning failed'; END IF;

    PERFORM set_config('request.jwt.claim.sub',qa_owner::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',qa_owner,'role','authenticated')::text,true);
    SET LOCAL ROLE authenticated;
    FOREACH field_name IN ARRAY ARRAY['id','created_at','subscription_status','trial_ends_at',
      'is_beta','beta_expires_at','tier_type','stripe_customer_id','stripe_subscription_id','quiz_first_enabled']
    LOOP
      BEGIN
        EXECUTE format('UPDATE public.profiles SET %I=%I WHERE id=$1',field_name,field_name) USING qa_owner;
        RAISE EXCEPTION 'Protected column was writable: %',field_name;
      EXCEPTION WHEN insufficient_privilege THEN blocked := blocked+1;
      END;
    END LOOP;
    BEGIN
      DELETE FROM public.profiles WHERE id=qa_owner;
      RAISE EXCEPTION 'Client profile delete allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN
      INSERT INTO public.profiles(id) VALUES(qa_owner);
      RAISE EXCEPTION 'Client profile insert allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;

    UPDATE public.profiles SET preferred_name='QA preferences',program_level='BSN',
      phi_acknowledged_at=now(),onboarding_completed=true WHERE id=qa_owner;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'Own settings update failed'; END IF;
    UPDATE public.profiles SET preferred_name='Must not change' WHERE id=qa_other;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Cross-account write allowed'; END IF;
    IF EXISTS(SELECT 1 FROM public.profiles WHERE id=qa_other)
      THEN RAISE EXCEPTION 'Cross-account read allowed'; END IF;

    SET LOCAL ROLE service_role;
    UPDATE public.profiles SET subscription_status='active',stripe_subscription_id='sub_qa_rollback' WHERE id=qa_owner;
    IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=qa_owner AND subscription_status='active')
      THEN RAISE EXCEPTION 'Trusted billing write failed'; END IF;
    RESET ROLE;

    IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.prosecdef AND p.prorettype<>'trigger'::regtype
      AND p.proname <> 'get_beta_spot_data'
      AND (has_function_privilege('anon',p.oid,'execute') OR has_function_privilege('authenticated',p.oid,'execute')))
    THEN RAISE EXCEPTION 'Internal SECURITY DEFINER RPC remains client-callable'; END IF;

    result := jsonb_build_object('protected_columns_denied',blocked,'client_insert_delete_denied',true,
      'signup_trial_provisioned',true,'own_settings_saved',true,'cross_account_read_write_denied',true,
      'trusted_billing_update_succeeded',true,'internal_rpc_access_denied',true,'fixture_writes_rolled_back',true);
    RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='Rollback successful test fixtures';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN
    RETURN result;
  END;
END $$;
SELECT pg_temp.verify_profile_entitlements() AS verification;
