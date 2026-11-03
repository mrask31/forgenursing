-- Extend the existing provider-idempotent delivery ledger to Day 6/expiry.
-- Old sender/queue history remains intact. No retroactive send or learner-date edits.
alter table public.trial_engagement_deliveries
  drop constraint trial_engagement_deliveries_step_check;
alter table public.trial_engagement_deliveries
  add constraint trial_engagement_deliveries_step_check
  check (step in ('trial_day_3','trial_day_5','trial_day_6','trial_expired'));

create function public.get_trial_expiry_candidates(p_step text)
returns table(user_id uuid,email text,trial_ends_at timestamptz)
language sql security definer set search_path=''
as $$
 select p.id,u.email::text,p.trial_ends_at
 from public.profiles p join auth.users u on u.id=p.id
 where p_step in ('trial_day_6','trial_expired')
   and p.is_beta=false and p.stripe_subscription_id is null
   and u.email is not null and u.email_confirmed_at is not null
   and coalesce(u.raw_user_meta_data->>'email_opt_out','false')<>'true'
   and coalesce(u.raw_user_meta_data->>'marketing_emails','true')<>'false'
   and ((p_step='trial_day_6' and p.subscription_status='trialing'
      and p.trial_ends_at>now() and p.trial_ends_at<=now()+interval '25 hours')
     or (p_step='trial_expired' and p.subscription_status in ('trialing','expired')
      and p.trial_ends_at<=now() and p.trial_ends_at>now()-interval '24 hours'))
   and not exists(select 1 from public.retake_passes rp where rp.user_id=p.id and rp.audience='production')
   and not exists(select 1 from public.trial_expiration_emails old where old.user_id=p.id
     and old.email_type=case p_step when 'trial_day_6' then 'day_6_reminder' else 'day_7_expiration' end
     and old.status in ('sent','pending'))
   and not exists(select 1 from public.trial_engagement_deliveries d where d.user_id=p.id
     and d.step=p_step and d.status in ('sent','skipped','legacy_hold'))
 order by p.trial_ends_at,p.id limit 100;
$$;
revoke all on function public.get_trial_expiry_candidates(text) from public,anon,authenticated;
grant execute on function public.get_trial_expiry_candidates(text) to service_role;
comment on function public.get_trial_expiry_candidates(text) is
 'Service-only hourly Day 6/expiry selection. Includes trialing status; never replays old queues or purchasers.';
