-- Additive pass storage. Preview and production grants are isolated.
create table public.retake_passes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 audience text not null check(audience in ('preview','production')),
 checkout_session_id text not null,
 stripe_customer_id text not null,
 payment_intent_id text not null,
 purchased_at timestamptz not null,
 access_until timestamptz not null,
 extension_used_at timestamptz,
 refunded_at timestamptz,
 unique(audience,checkout_session_id),
 check(access_until>purchased_at)
);
create index retake_pass_owner on public.retake_passes(user_id,audience,purchased_at desc);
alter table public.retake_passes enable row level security;
revoke all on public.retake_passes from public,anon,authenticated;
grant select on public.retake_passes to authenticated;
grant all on public.retake_passes to service_role;
create policy retake_pass_read_own on public.retake_passes for select to authenticated using ((select auth.uid())=user_id);
create function public.grant_retake_pass(p_user_id uuid,p_audience text,p_checkout text,p_customer text,p_payment_intent text,p_paid_at timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare result public.retake_passes;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_audience||':'||p_checkout,0));
 select * into result from public.retake_passes where audience=p_audience and checkout_session_id=p_checkout;
 if found then
  if result.user_id<>p_user_id or result.stripe_customer_id<>p_customer or result.payment_intent_id<>p_payment_intent then raise exception 'Checkout ownership mismatch'; end if;
  return to_jsonb(result);
 end if;
 if p_paid_at is null or p_paid_at>now()+interval '5 minutes' or p_checkout not like 'cs_%' or p_customer not like 'cus_%' or p_payment_intent not like 'pi_%' then raise exception 'Invalid verified payment'; end if;
 insert into public.retake_passes(user_id,audience,checkout_session_id,stripe_customer_id,payment_intent_id,purchased_at,access_until)
 values(p_user_id,p_audience,p_checkout,p_customer,p_payment_intent,p_paid_at,((p_paid_at at time zone 'UTC')+interval '3 months') at time zone 'UTC') returning * into result;
 return to_jsonb(result);
end $$;
create function public.extend_retake_pass(p_user_id uuid,p_audience text,p_pass_id uuid) returns jsonb language plpgsql set search_path='' as $$
declare result public.retake_passes;
begin
 select * into result from public.retake_passes where id=p_pass_id and user_id=p_user_id and audience=p_audience for update;
 if not found or result.refunded_at is not null then raise exception 'Pass unavailable'; end if;
 if result.extension_used_at is not null then raise exception 'Free extension already used'; end if;
 if result.access_until>now() then raise exception 'Extension available after initial access ends'; end if;
 update public.retake_passes set extension_used_at=now(),access_until=((now() at time zone 'UTC')+interval '3 months') at time zone 'UTC' where id=result.id returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.grant_retake_pass(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.extend_retake_pass(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.grant_retake_pass(uuid,text,text,text,text,timestamptz) to service_role;
grant execute on function public.extend_retake_pass(uuid,text,uuid) to service_role;
