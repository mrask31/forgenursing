-- Transactional outbox: one notification per newly fulfilled production pass.
-- Existing purchases are deliberately not backfilled.
create table public.retake_purchase_emails (
 id uuid primary key default gen_random_uuid(),
 pass_id uuid not null unique references public.retake_passes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 access_until timestamptz not null,
 status text not null default 'pending' check (status in ('pending','sending','uncertain','sent','skipped','reconciliation_required')),
 payload jsonb,
 first_attempt_at timestamptz,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 provider_message_id text,
 error_code text
);
alter table public.retake_purchase_emails enable row level security;
revoke all on public.retake_purchase_emails from public, anon, authenticated;
grant all on public.retake_purchase_emails to service_role;
create index retake_purchase_emails_user on public.retake_purchase_emails(user_id);
create index retake_purchase_emails_pending on public.retake_purchase_emails(created_at) where status in ('pending','sending','uncertain');
create function public.queue_retake_purchase_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.audience = 'production' and new.refunded_at is null then
  insert into public.retake_purchase_emails(pass_id,user_id,email,access_until)
  select new.id,new.user_id,u.email,new.access_until from auth.users u where u.id=new.user_id and u.email is not null
  on conflict (pass_id) do nothing;
 end if;
 return new;
end;
$$;
revoke all on function public.queue_retake_purchase_email() from public, anon, authenticated;
create trigger retake_purchase_email_after_grant after insert on public.retake_passes
for each row execute function public.queue_retake_purchase_email();
