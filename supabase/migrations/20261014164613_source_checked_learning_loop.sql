-- Separate editorial publication tier. Existing independently approved packets are unchanged.
create table public.source_checked_content_versions (
 id uuid primary key default gen_random_uuid(), packet_id text not null, version integer not null check(version>0),
 audience text not null check(audience in ('preview','production')), distinction_id text not null,
 packet jsonb not null, packet_sha256 text not null check(packet_sha256 ~ '^[a-f0-9]{64}$'),
 published_at timestamptz not null default now(), withdrawn_at timestamptz, withdrawal_reason text,
 unique(packet_id,version,audience), unique(packet_sha256,audience),
 check((packet->>'publication_kind') is not distinct from 'ai_source_checked'),
 check((packet->'independent_clinical_validation') is not distinct from 'false'::jsonb),
 check((packet->>'learner_level') is not distinct from 'NCLEX-RN'),
 check((packet->>'distinction_id') is not distinct from distinction_id),
 check(coalesce(jsonb_typeof(packet->'reviews') = 'array' and jsonb_array_length(packet->'reviews') = 1,false)),
 check((packet->>'packet_id') is not distinct from packet_id),
 check((packet->>'version')::integer is not distinct from version),
 check(concat(packet->'original',packet->'retry',packet->'reviews') !~* '(COPD|chronic obstructive|emphysema|chronic bronchitis)'),
 check(withdrawn_at is null or length(withdrawal_reason)>0)
);
alter table public.source_checked_content_versions enable row level security;
revoke all on public.source_checked_content_versions from public,anon,authenticated;
grant select,insert,update on public.source_checked_content_versions to service_role;
create trigger freeze_source_checked_content before update on public.source_checked_content_versions for each row execute function learning_private.freeze_approved_content();

alter table public.quiz_sessions add column content_policy text, add column start_request_id uuid;
create unique index source_checked_start_once on public.quiz_sessions(user_id,start_request_id) where start_request_id is not null;
alter table public.quiz_questions add column source_checked_content_id uuid references public.source_checked_content_versions(id);
alter table public.quiz_questions add constraint one_content_tier check (clinical_content_id is null or source_checked_content_id is null);
create index quiz_source_checked_content on public.quiz_questions(source_checked_content_id) where source_checked_content_id is not null;

create table public.source_checked_review_queue (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 source_question_id uuid not null unique references public.quiz_questions(id),
 content_id uuid not null references public.source_checked_content_versions(id), distinction_id text not null,
 missed_at timestamptz not null, due_at timestamptz not null, status text not null default 'scheduled' check(status in ('scheduled','exhausted'))
);
create index source_review_due on public.source_checked_review_queue(user_id,due_at) where status='scheduled';
create table public.source_checked_review_attempts (
 id uuid primary key default gen_random_uuid(), queue_id uuid not null unique references public.source_checked_review_queue(id),
 user_id uuid not null references auth.users(id) on delete cascade, presented_at timestamptz not null default now(),
 answered_at timestamptz, user_answer text check(user_answer in ('A','B','C','D')), correct boolean
);
create table public.source_checked_exposures (
 user_id uuid not null references auth.users(id) on delete cascade, packet_id text not null,
 role text not null check(role in ('original','retry','delayed_review')), first_seen_at timestamptz not null default now(),
 primary key(user_id,packet_id,role)
);
alter table public.source_checked_review_queue enable row level security;
alter table public.source_checked_review_attempts enable row level security;
alter table public.source_checked_exposures enable row level security;
revoke all on public.source_checked_review_queue,public.source_checked_review_attempts,public.source_checked_exposures from public,anon,authenticated;
grant select on public.source_checked_review_queue,public.source_checked_review_attempts,public.source_checked_exposures to authenticated;
grant all on public.source_checked_review_queue,public.source_checked_review_attempts,public.source_checked_exposures to service_role;
create policy source_queue_owner on public.source_checked_review_queue for select to authenticated using((select auth.uid())=user_id);
create policy source_attempt_owner on public.source_checked_review_attempts for select to authenticated using((select auth.uid())=user_id);
create policy source_exposure_owner on public.source_checked_exposures for select to authenticated using((select auth.uid())=user_id);

create function learning_private.protect_source_question() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and new.source_checked_content_id is distinct from old.source_checked_content_id then raise exception 'Source content link is immutable'; end if;
 if new.source_checked_content_id is null then return new; end if;
 if current_user not in ('service_role','postgres') then raise exception 'Source-checked answers are server-managed'; end if;
 if TG_OP='UPDATE' then
  if (to_jsonb(new)-'user_answer'-'is_correct'-'answered_at') is distinct from (to_jsonb(old)-'user_answer'-'is_correct'-'answered_at') then raise exception 'Frozen source question is immutable'; end if;
  if old.answered_at is not null and new is distinct from old then raise exception 'First answer is final'; end if;
 end if;
 if not exists(select 1 from public.source_checked_content_versions where id=new.source_checked_content_id and withdrawn_at is null) then raise exception 'Source content unavailable'; end if;
 return new;
end $$;
create trigger protect_source_question before insert or update on public.quiz_questions for each row execute function learning_private.protect_source_question();

create function learning_private.protect_source_session() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and (new.content_policy is distinct from old.content_policy or new.start_request_id is distinct from old.start_request_id or (old.content_policy='source_checked_v1' and new.user_id is distinct from old.user_id)) then raise exception 'Source session identity is immutable'; end if;
 if new.content_policy='source_checked_v1' and current_user not in ('service_role','postgres') then raise exception 'Source sessions are server-managed'; end if;
 return new;
end $$;
create trigger protect_source_session before insert or update on public.quiz_sessions for each row execute function learning_private.protect_source_session();

create function learning_private.insert_source_question(p_session uuid,p_content uuid,p_role text,p_index integer,p_parent uuid default null) returns uuid language plpgsql set search_path='' as $$
declare c public.source_checked_content_versions; item jsonb; inserted uuid;
begin
 select * into strict c from public.source_checked_content_versions where id=p_content and withdrawn_at is null;
 if p_role not in ('original','retry') then raise exception 'Invalid role'; end if;
 item:=c.packet->p_role;
 insert into public.quiz_questions(session_id,question_index,question_stem,options,correct_answer,rationale_correct,rationale_incorrect,nclex_category,difficulty,key_cue,one_line_fix,why_correct_short,mistake_type,distinction_id,source_question_id,learning_attempt,source_checked_content_id,generation_model,generation_prompt_version)
 values(p_session,p_index,item->>'question_stem',item->'options',item->>'correct_answer',item->>'rationale_correct',item->'rationale_incorrect',item->>'nclex_category',(item->>'difficulty')::integer,item->>'key_cue',item->>'one_line_fix',item->>'rationale_correct',c.packet->>'focus',c.distinction_id,p_parent,case when p_role='retry' then 2 else 1 end,c.id,'frozen-source-checked','source-checked-v1') returning id into inserted;
 return inserted;
end $$;
revoke all on function learning_private.insert_source_question(uuid,uuid,text,integer,uuid) from public,anon,authenticated;
grant usage on schema learning_private to service_role;
grant execute on function learning_private.insert_source_question(uuid,uuid,text,integer,uuid) to service_role;

create function public.start_source_checked_session(p_user_id uuid,p_request_id uuid,p_total integer,p_category text,p_focus text,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare s public.quiz_sessions; selected_id uuid; n integer:=0; selected uuid[];
begin
 if p_user_id is null or p_request_id is null or p_total is null or p_total not between 1 and 5 or p_audience not in ('preview','production') then raise exception 'Invalid session request'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select * into s from public.quiz_sessions where user_id=p_user_id and start_request_id=p_request_id;
 if found then return jsonb_build_object('session',to_jsonb(s)); end if;
 if exists(select 1 from public.profiles where id=p_user_id and program_level not in ('ADN','BSN')) then raise exception 'This bank supports NCLEX-RN'; end if;
 update public.quiz_sessions set status='abandoned',abandoned_at=now() where user_id=p_user_id and status='in_progress' and content_policy='source_checked_v1';
 select array_agg(id) into selected from (
  select c.id from public.source_checked_content_versions c
  where c.withdrawn_at is null and c.audience=p_audience
   and (p_category is null or c.packet->'original'->>'nclex_category'=p_category)
   and (p_focus is null or c.packet->>'focus'=p_focus)
   and not exists(select 1 from public.source_checked_exposures e where e.user_id=p_user_id and e.packet_id=c.packet_id and e.role='original')
   and not exists(select 1 from public.source_checked_content_versions newer where newer.packet_id=c.packet_id and newer.audience=c.audience and newer.version>c.version)
  order by md5(c.packet_id||p_request_id::text) limit p_total
 ) candidates;
 if coalesce(array_length(selected,1),0)=0 then raise exception 'No fresh source-checked questions in this focus'; end if;
 insert into public.quiz_sessions(user_id,source_type,nclex_category,status,score,total_questions,current_question_index,quiz_mode,target_mistake_type,content_policy,start_request_id)
 values(p_user_id,'generic',p_category,'in_progress',0,array_length(selected,1),0,case when p_focus is null then 'standard' else 'targeted_drill' end,p_focus,'source_checked_v1',p_request_id) returning * into s;
 foreach selected_id in array selected loop
  perform learning_private.insert_source_question(s.id,selected_id,'original',n); n:=n+1;
 end loop;
 return jsonb_build_object('session',to_jsonb(s));
end $$;
revoke all on function public.start_source_checked_session(uuid,uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.start_source_checked_session(uuid,uuid,integer,text,text,text) to service_role;

create function public.present_source_checked_question(p_user_id uuid,p_question_id uuid,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare q public.quiz_questions; c public.source_checked_content_versions;
begin
 select qq.* into q from public.quiz_questions qq join public.quiz_sessions s on s.id=qq.session_id where qq.id=p_question_id and s.user_id=p_user_id and s.status='in_progress' and qq.question_index=s.current_question_index and qq.answered_at is null;
 if not found then raise exception 'Question unavailable'; end if;
 select * into c from public.source_checked_content_versions where id=q.source_checked_content_id and withdrawn_at is null and audience=p_audience;
 if not found then raise exception 'Source content unavailable'; end if;
 insert into public.source_checked_exposures(user_id,packet_id,role) values(p_user_id,c.packet_id,case when q.learning_attempt=2 then 'retry' else 'original' end) on conflict do nothing;
 return jsonb_build_object('id',q.id,'session_id',q.session_id,'question_index',q.question_index,'question_stem',q.question_stem,'options',q.options,'nclex_category',q.nclex_category,'difficulty',q.difficulty,'distinction_id',q.distinction_id,'source_question_id',q.source_question_id,'learning_attempt',q.learning_attempt,'source_checked_content_id',q.source_checked_content_id,'content_status','ai_source_checked');
end $$;
revoke all on function public.present_source_checked_question(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.present_source_checked_question(uuid,uuid,text) to service_role;

create function public.answer_source_checked_question(p_user_id uuid,p_question_id uuid,p_answer text,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare q public.quiz_questions; s public.quiz_sessions; c public.source_checked_content_versions;
begin
 if p_answer is null or p_answer not in ('A','B','C','D') then raise exception 'Invalid answer'; end if;
 select * into q from public.quiz_questions where id=p_question_id for update;
 select * into s from public.quiz_sessions where id=q.session_id and user_id=p_user_id for update;
 if not found then raise exception 'Question unavailable'; end if;
 select * into c from public.source_checked_content_versions where id=q.source_checked_content_id and audience=p_audience and withdrawn_at is null;
 if not found then raise exception 'Source content unavailable'; end if;
 if q.answered_at is null then
  if s.status<>'in_progress' or q.question_index<>s.current_question_index then raise exception 'Question not current'; end if;
  if not exists(select 1 from public.source_checked_exposures where user_id=p_user_id and packet_id=c.packet_id and role=case when q.learning_attempt=2 then 'retry' else 'original' end) then raise exception 'Question not presented'; end if;
  update public.quiz_questions set user_answer=p_answer,is_correct=(p_answer=correct_answer),answered_at=now() where id=q.id returning * into q;
  update public.quiz_sessions set score=coalesce(score,0)+case when q.is_correct then 1 else 0 end,current_question_index=current_question_index+1,
   status=case when current_question_index+1>=total_questions then 'completed' else status end,
   completed_at=case when current_question_index+1>=total_questions then now() else completed_at end where id=s.id returning * into s;
  if q.learning_attempt=1 and not q.is_correct then
   insert into public.source_checked_review_queue(user_id,source_question_id,content_id,distinction_id,missed_at,due_at)
   values(p_user_id,q.id,c.id,c.distinction_id,q.answered_at,q.answered_at+interval '1 day') on conflict(source_question_id) do nothing;
  end if;
 end if;
 return to_jsonb(q)||jsonb_build_object('session_complete',s.status='completed','score',s.score,'total_answered',s.current_question_index,'quiz_mode',s.quiz_mode,'sources',c.packet->'references','content_status','ai_source_checked');
end $$;
revoke all on function public.answer_source_checked_question(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.answer_source_checked_question(uuid,uuid,text,text) to service_role;

create function public.start_source_checked_retry(p_user_id uuid,p_question_id uuid,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare q public.quiz_questions; c public.source_checked_content_versions; s public.quiz_sessions; retry_id uuid;
begin
 select qq.* into q from public.quiz_questions qq join public.quiz_sessions qs on qs.id=qq.session_id where qq.id=p_question_id and qs.user_id=p_user_id for update of qq;
 if not found or q.answered_at is null or q.is_correct is distinct from false or q.learning_attempt<>1 then raise exception 'Retry requires an original miss'; end if;
 select * into c from public.source_checked_content_versions where id=q.source_checked_content_id and audience=p_audience and withdrawn_at is null;
 if not found then raise exception 'Source content unavailable'; end if;
 select id,session_id into retry_id,s.id from public.quiz_questions where source_question_id=q.id and learning_attempt=2;
 if found then
  select * into s from public.quiz_sessions where id=s.id and user_id=p_user_id;
  if s.status='completed' then return jsonb_build_object('session',to_jsonb(s),'completed',true); end if;
  update public.quiz_sessions set status='in_progress',abandoned_at=null where id=s.id returning * into s;
 else
  insert into public.quiz_sessions(user_id,source_type,nclex_category,status,score,total_questions,current_question_index,quiz_mode,content_policy)
  values(p_user_id,'generic',q.nclex_category,'in_progress',0,1,0,'retest','source_checked_v1') returning * into s;
  retry_id:=learning_private.insert_source_question(s.id,c.id,'retry',0,q.id);
 end if;
 return jsonb_build_object('session',to_jsonb(s),'question',public.present_source_checked_question(p_user_id,retry_id,p_audience));
end $$;
revoke all on function public.start_source_checked_retry(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.start_source_checked_retry(uuid,uuid,text) to service_role;

create function public.source_checked_review_status(p_user_id uuid,p_audience text) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object(
  'available',exists(select 1 from public.source_checked_content_versions where withdrawn_at is null and audience=p_audience),
  'due',coalesce((select jsonb_agg(to_jsonb(d) order by d.due_at) from (select q.id,q.distinction_id,q.due_at,'source_checked'::text as content_kind from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='scheduled' and q.due_at<=now() and c.withdrawn_at is null and c.audience=p_audience order by q.due_at limit 100) d),'[]'::jsonb),
  'next_due_at',(select min(q.due_at) from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='scheduled' and q.due_at>now() and c.withdrawn_at is null and c.audience=p_audience),
  'exhausted_count',(select count(*) from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='exhausted' and c.audience=p_audience),
  'content_status','ai_source_checked');
$$;
revoke all on function public.source_checked_review_status(uuid,text) from public,anon,authenticated;
grant execute on function public.source_checked_review_status(uuid,text) to service_role;

create function public.start_source_checked_review(p_user_id uuid,p_queue_id uuid,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare q public.source_checked_review_queue; c public.source_checked_content_versions; a public.source_checked_review_attempts; item jsonb;
begin
 select * into q from public.source_checked_review_queue where id=p_queue_id and user_id=p_user_id for update;
 if not found or q.status<>'scheduled' or q.due_at>now() then raise exception 'Review not due'; end if;
 select * into c from public.source_checked_content_versions where id=q.content_id and audience=p_audience and withdrawn_at is null;
 if not found then raise exception 'Source content unavailable'; end if;
 select * into a from public.source_checked_review_attempts where queue_id=q.id;
 if not found then
  if exists(select 1 from public.source_checked_exposures where user_id=p_user_id and packet_id=c.packet_id and role='delayed_review') then raise exception 'No fresh delayed variant'; end if;
  insert into public.source_checked_review_attempts(queue_id,user_id) values(q.id,p_user_id) returning * into a;
  insert into public.source_checked_exposures(user_id,packet_id,role) values(p_user_id,c.packet_id,'delayed_review');
 end if;
 item:=c.packet->'reviews'->0;
 return jsonb_build_object('question',jsonb_build_object('id',a.id,'question_stem',item->'question_stem','options',item->'options'),
  'review_round',1,'content_kind','source_checked','content_status','ai_source_checked','source_question_id',q.source_question_id,'distinction_id',q.distinction_id,'content_version',c.id);
end $$;
revoke all on function public.start_source_checked_review(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.start_source_checked_review(uuid,uuid,text) to service_role;

create function public.answer_source_checked_review(p_user_id uuid,p_attempt_id uuid,p_answer text,p_audience text) returns jsonb language plpgsql set search_path='' as $$
declare a public.source_checked_review_attempts; q public.source_checked_review_queue; c public.source_checked_content_versions; item jsonb;
begin
 if p_answer is null or p_answer not in ('A','B','C','D') then raise exception 'Invalid answer'; end if;
 select * into a from public.source_checked_review_attempts where id=p_attempt_id and user_id=p_user_id for update;
 if not found then raise exception 'Review unavailable'; end if;
 select * into q from public.source_checked_review_queue where id=a.queue_id and user_id=p_user_id for update;
 select * into c from public.source_checked_content_versions where id=q.content_id and audience=p_audience and withdrawn_at is null;
 if not found then raise exception 'Source content unavailable'; end if;
 item:=c.packet->'reviews'->0;
 if a.answered_at is null then
  if q.status<>'scheduled' or q.due_at>now() then raise exception 'Review not due'; end if;
  update public.source_checked_review_attempts set user_answer=p_answer,correct=(p_answer=item->>'correct_answer'),answered_at=now() where id=a.id returning * into a;
  update public.source_checked_review_queue set status='exhausted' where id=q.id;
 end if;
 return jsonb_build_object('question_id',a.id,'source_question_id',q.source_question_id,'distinction_id',q.distinction_id,'correct',a.correct,'user_answer',a.user_answer,
  'days_since_miss',greatest(0,floor(extract(epoch from (a.answered_at-q.missed_at))/86400)),
  'review_round',1,'content_version',c.id,'feedback',item,'sources',c.packet->'references','content_status','ai_source_checked','exhausted',true);
end $$;
revoke all on function public.answer_source_checked_review(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.answer_source_checked_review(uuid,uuid,text,text) to service_role;
