create table public.retake_pass_checkout_intents(user_id uuid not null references auth.users(id),audience text not null check(audience in ('preview','production')),token uuid not null default gen_random_uuid(),expires_at timestamptz not null default now()+interval '31 minutes',primary key(user_id,audience));
alter table public.retake_pass_checkout_intents enable row level security;
revoke all on public.retake_pass_checkout_intents from public,anon,authenticated;
grant all on public.retake_pass_checkout_intents to service_role;
create function public.retake_pass_checkout_intent(p_user_id uuid,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare r public.retake_pass_checkout_intents;
begin
 perform pg_advisory_xact_lock(hashtextextended('retake-checkout:'||p_user_id::text||':'||p_audience,0));
 insert into public.retake_pass_checkout_intents(user_id,audience) values(p_user_id,p_audience) on conflict do nothing;
 select * into r from public.retake_pass_checkout_intents where user_id=p_user_id and audience=p_audience for update;
 if r.expires_at<=now() then update public.retake_pass_checkout_intents set token=gen_random_uuid(),expires_at=now()+interval '31 minutes' where user_id=p_user_id and audience=p_audience returning * into r; end if;
 return to_jsonb(r);
end $$;
revoke all on function public.retake_pass_checkout_intent(uuid,text) from public,anon,authenticated;
grant execute on function public.retake_pass_checkout_intent(uuid,text) to service_role;
