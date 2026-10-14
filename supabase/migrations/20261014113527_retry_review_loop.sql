-- Frozen clinical approvals are operator-owned. Students never write approval or queue state.
create table public.clinical_content_versions (
  id uuid primary key default gen_random_uuid(),
  packet_id text not null, version integer not null check (version > 0),
  distinction_id text not null, packet jsonb not null,
  packet_sha256 text not null check (packet_sha256 ~ '^[a-f0-9]{64}$'),
  approval jsonb not null check (approval->>'decision' = 'approved' and approval->>'reviewer_independent' = 'true' and approval->>'all_criteria_resolved' = 'true' and approval->>'packet_sha256' = packet_sha256),
  approved_at timestamptz not null,
  withdrawn_at timestamptz, withdrawal_reason text,
  created_at timestamptz not null default now(),
  unique(packet_id, version), unique(packet_sha256),
  check (jsonb_array_length(packet->'reviews') >= 3),
  check (packet->>'distinction_id' = distinction_id),
  check (withdrawn_at is null or length(withdrawal_reason) > 0)
);
alter table public.clinical_content_versions enable row level security;
revoke all on public.clinical_content_versions from public, anon, authenticated;
grant select, insert, update on public.clinical_content_versions to service_role;

alter table public.quiz_questions
  add column distinction_id text,
  add column source_question_id uuid references public.quiz_questions(id) on delete set null,
  add column learning_attempt integer not null default 1 check (learning_attempt in (1,2)),
  add column generation_model text,
  add column generation_prompt_version text,
  add column clinical_content_id uuid references public.clinical_content_versions(id);
create unique index quiz_one_retry_per_original on public.quiz_questions(source_question_id) where source_question_id is not null and learning_attempt = 2;

create table public.learning_review_queue (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source_question_id uuid not null unique references public.quiz_questions(id) on delete cascade,
  clinical_content_id uuid not null references public.clinical_content_versions(id), distinction_id text not null,
  missed_at timestamptz not null, due_at timestamptz not null,
  review_round integer not null default 0, status text not null default 'scheduled' check(status in ('scheduled','exhausted'))
);
create index review_due_by_user on public.learning_review_queue(user_id, due_at) where status = 'scheduled';
alter table public.learning_review_queue enable row level security;
revoke all on public.learning_review_queue from public, anon, authenticated;
grant select on public.learning_review_queue to authenticated;
grant all on public.learning_review_queue to service_role;
create policy "Read own scheduled reviews" on public.learning_review_queue for select to authenticated using ((select auth.uid()) = user_id);

create table public.learning_review_attempts (
  id uuid primary key default gen_random_uuid(), queue_id uuid not null references public.learning_review_queue(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_round integer not null, presented_at timestamptz not null default now(),
  answered_at timestamptz, user_answer text check(user_answer in ('A','B','C','D')), correct boolean,
  unique(queue_id, review_round)
);
alter table public.learning_review_attempts enable row level security;
revoke all on public.learning_review_attempts from public, anon, authenticated;
grant select on public.learning_review_attempts to authenticated;
grant all on public.learning_review_attempts to service_role;
create policy "Read own review attempts" on public.learning_review_attempts for select to authenticated using ((select auth.uid()) = user_id);

create schema if not exists learning_private;
revoke all on schema learning_private from public, anon, authenticated;
create function learning_private.freeze_approved_content() returns trigger language plpgsql set search_path = '' as $$
begin
 if (to_jsonb(new) - 'withdrawn_at' - 'withdrawal_reason') is distinct from (to_jsonb(old) - 'withdrawn_at' - 'withdrawal_reason') then
   raise exception 'Approved content is immutable; publish a newly reviewed version';
 end if;
 if old.withdrawn_at is not null and (new.withdrawn_at is distinct from old.withdrawn_at or new.withdrawal_reason is distinct from old.withdrawal_reason) then
   raise exception 'Withdrawal is permanent; publish a new version';
 end if;
 return new;
end $$;
create trigger freeze_approved_content before update on public.clinical_content_versions for each row execute function learning_private.freeze_approved_content();

create function learning_private.protect_clinical_link() returns trigger language plpgsql set search_path = '' as $$
begin
 if TG_OP = 'INSERT' then
   if new.clinical_content_id is not null and current_user not in ('service_role','postgres') then raise exception 'Clinical approval is operator managed'; end if;
 elsif new.clinical_content_id is distinct from old.clinical_content_id then
   raise exception 'Clinical content links are immutable';
 elsif old.clinical_content_id is not null and (to_jsonb(new) - 'user_answer' - 'is_correct' - 'answered_at') is distinct from (to_jsonb(old) - 'user_answer' - 'is_correct' - 'answered_at') then
   raise exception 'Reviewed question content is immutable';
 end if;
 return new;
end $$;
create trigger protect_clinical_link before insert or update on public.quiz_questions for each row execute function learning_private.protect_clinical_link();

-- Internal trigger only: never callable through the public API. Owner is checked even with privileged writes.
create function learning_private.schedule_review() returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
 if old.answered_at is null and new.answered_at is not null and new.is_correct = false and new.learning_attempt = 1 and new.clinical_content_id is not null then
   select user_id into owner_id from public.quiz_sessions where id = new.session_id;
   if auth.uid() is not null and auth.uid() <> owner_id then raise exception 'Review owner mismatch'; end if;
   insert into public.learning_review_queue(user_id, source_question_id, clinical_content_id, distinction_id, missed_at, due_at)
   select owner_id, new.id, c.id, c.distinction_id, new.answered_at, new.answered_at + interval '1 day'
   from public.clinical_content_versions c where c.id = new.clinical_content_id and c.withdrawn_at is null
   on conflict(source_question_id) do nothing;
 end if;
 return new;
end $$;
revoke all on function learning_private.schedule_review() from public, anon, authenticated;
create trigger schedule_review after update of answered_at on public.quiz_questions for each row execute function learning_private.schedule_review();

-- Service-role-only RPC; no SECURITY DEFINER. Locking prevents double answers/schedule advances.
create function public.answer_scheduled_review(p_user_id uuid, p_attempt_id uuid, p_answer text) returns jsonb language plpgsql set search_path = '' as $$
declare a public.learning_review_attempts; q public.learning_review_queue; c public.clinical_content_versions; item jsonb; ok boolean; next_round integer;
begin
 if p_answer not in ('A','B','C','D') then raise exception 'Invalid answer'; end if;
 select * into a from public.learning_review_attempts where id = p_attempt_id and user_id = p_user_id for update;
 if not found then raise exception 'Review attempt not found'; end if;
 select * into q from public.learning_review_queue where id = a.queue_id and user_id = p_user_id for update;
 select * into c from public.clinical_content_versions where id = q.clinical_content_id and withdrawn_at is null;
 if not found then raise exception 'Reviewed content unavailable'; end if;
 item := c.packet->'reviews'->a.review_round;
 if item is null then raise exception 'Review variant unavailable'; end if;
 if a.answered_at is null then
   if q.due_at > now() or q.review_round <> a.review_round or q.status <> 'scheduled' then raise exception 'Review not due'; end if;
   ok := item->>'correct_answer' = p_answer;
   update public.learning_review_attempts set user_answer = p_answer, correct = ok, answered_at = now() where id = a.id returning * into a;
   next_round := q.review_round + 1;
   update public.learning_review_queue set review_round = next_round,
     status = case when next_round >= jsonb_array_length(c.packet->'reviews') then 'exhausted' else 'scheduled' end,
     due_at = now() + case when not ok then interval '1 day' when next_round = 1 then interval '3 days' else interval '7 days' end
   where id = q.id;
 end if;
 return jsonb_build_object('question_id',a.id,'source_question_id',q.source_question_id,'distinction_id',q.distinction_id,
   'correct',a.correct,'user_answer',a.user_answer,'days_since_miss',greatest(0,floor(extract(epoch from (a.answered_at - q.missed_at))/86400)),
   'review_round',a.review_round + 1,'content_version',c.id,'feedback',item,'sources',c.packet->'references');
end $$;
revoke all on function public.answer_scheduled_review(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.answer_scheduled_review(uuid,uuid,text) to service_role;

create function public.record_quiz_answer(p_question_id uuid, p_answer text) returns jsonb language plpgsql set search_path = '' as $$
declare q public.quiz_questions; s public.quiz_sessions;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 if p_answer not in ('A','B','C','D') then raise exception 'Invalid answer'; end if;
 select * into q from public.quiz_questions where id = p_question_id for update;
 if not found then raise exception 'Question not found'; end if;
 select * into s from public.quiz_sessions where id = q.session_id and user_id = auth.uid() for update;
 if not found then raise exception 'Forbidden'; end if;
 if q.answered_at is null then
   if s.status <> 'in_progress' then raise exception 'Session is not in progress'; end if;
   update public.quiz_questions set user_answer = p_answer, is_correct = (p_answer = correct_answer), answered_at = now() where id = q.id returning * into q;
   update public.quiz_sessions set score = coalesce(score,0) + case when q.is_correct then 1 else 0 end,
     current_question_index = coalesce(current_question_index,0) + 1,
     status = case when coalesce(current_question_index,0) + 1 >= total_questions then 'completed' else status end,
     completed_at = case when coalesce(current_question_index,0) + 1 >= total_questions then now() else completed_at end
   where id = s.id returning * into s;
 end if;
 return to_jsonb(q) || jsonb_build_object('session_complete',s.status = 'completed','score',s.score,'total_answered',s.current_question_index,'quiz_mode',s.quiz_mode);
end $$;
revoke all on function public.record_quiz_answer(uuid,text) from public, anon;
grant execute on function public.record_quiz_answer(uuid,text) to authenticated;
