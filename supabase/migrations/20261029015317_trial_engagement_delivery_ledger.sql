-- Dedicated ledger: trial-expiration queue intentionally supports only Day 6/7.
create table public.trial_engagement_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('trial_day_3','trial_day_5')),
  status text not null check (status in ('sending','sent','uncertain','skipped','legacy_hold')),
  payload jsonb,
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,step)
);
alter table public.trial_engagement_deliveries enable row level security;
revoke all on public.trial_engagement_deliveries from public,anon,authenticated;
grant select,insert,update on public.trial_engagement_deliveries to service_role;
comment on table public.trial_engagement_deliveries is
  'Service-only trial Day 3/5 claim and receipt ledger. Never replay legacy_hold without provider reconciliation.';

-- The old sender could have submitted a current-window message without a valid
-- receipt. Hold that step at cutover; future unsent steps are not blanket-held.
insert into public.trial_engagement_deliveries(user_id,step,status,error_code)
select p.id,s.step,'legacy_hold','pre_repair_outcome_unverified'
from public.profiles p
cross join (values ('trial_day_3',interval '5 days'),('trial_day_5',interval '3 days')) s(step,max_remaining)
where p.is_beta=false and p.subscription_status='trialing'
  and p.trial_ends_at>now() and p.trial_ends_at<=now()+s.max_remaining
on conflict (user_id,step) do nothing;

-- Preserve the existing privileged auth lookup, but restrict execution to the
-- existing server role and pin every relation. No browser role gets access.

create or replace function public.get_trial_day3_eligible_users()
returns table(user_id uuid,email text,trial_ends_at timestamptz)
language sql security definer set search_path=''
as $$
 select p.id,u.email::text,p.trial_ends_at
 from public.profiles p join auth.users u on u.id=p.id
 where p.is_beta=false and p.subscription_status='trialing'
   and p.stripe_subscription_id is null and u.email is not null and u.email_confirmed_at is not null
   and coalesce(u.raw_user_meta_data->>'email_opt_out','false')<>'true'
   and coalesce(u.raw_user_meta_data->>'marketing_emails','true')<>'false'
   and p.trial_ends_at>now()+interval '3 days'
   and p.trial_ends_at<=now()+interval '5 days'
   and not exists(select 1 from public.trial_expiration_emails old
     where old.user_id=p.id and old.email_type='trial_day_3')
   and not exists(select 1 from public.trial_engagement_deliveries d
     where d.user_id=p.id and d.step='trial_day_3' and d.status in ('sent','skipped','legacy_hold'))
 order by p.id;
$$;
revoke all on function public.get_trial_day3_eligible_users() from public,anon,authenticated;
grant execute on function public.get_trial_day3_eligible_users() to service_role;

create or replace function public.get_trial_day5_eligible_users()
returns table(user_id uuid,email text,trial_ends_at timestamptz)
language sql security definer set search_path=''
as $$
 select p.id,u.email::text,p.trial_ends_at
 from public.profiles p join auth.users u on u.id=p.id
 where p.is_beta=false and p.subscription_status='trialing'
   and p.stripe_subscription_id is null and u.email is not null and u.email_confirmed_at is not null
   and coalesce(u.raw_user_meta_data->>'email_opt_out','false')<>'true'
   and coalesce(u.raw_user_meta_data->>'marketing_emails','true')<>'false'
   and p.trial_ends_at>now()+interval '1 days'
   and p.trial_ends_at<=now()+interval '3 days'
   and not exists(select 1 from public.trial_expiration_emails old
     where old.user_id=p.id and old.email_type='trial_day_5')
   and not exists(select 1 from public.trial_engagement_deliveries d
     where d.user_id=p.id and d.step='trial_day_5' and d.status in ('sent','skipped','legacy_hold'))
 order by p.id;
$$;
revoke all on function public.get_trial_day5_eligible_users() from public,anon,authenticated;
grant execute on function public.get_trial_day5_eligible_users() to service_role;
