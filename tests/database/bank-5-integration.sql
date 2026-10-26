-- Run with the ten preview packets available INSIDE a rollback transaction.
-- Synthetic user only; no learner dates are backdated.
begin;
do $qa$
declare
 qa_user uuid := gen_random_uuid(); c record; s jsonb; sid uuid; q public.quiz_questions; rq public.quiz_questions; retry_result jsonb; rev public.source_checked_review_queue; a jsonb; b jsonb; result jsonb; exhausted boolean; cases integer := 0;
begin
 insert into auth.users(id,email,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
 values(qa_user,'bank5-loop-'||qa_user::text||'@example.invalid',now(),now(),'{}'::jsonb,'{}'::jsonb);
 update public.profiles set program_level='ADN' where id=qa_user;
 for c in select * from public.source_checked_content_versions where audience='preview' and packet_id like 'qb5-h%' order by packet_id loop
  delete from public.source_checked_exposures where user_id=qa_user;
  insert into public.source_checked_exposures(user_id,packet_id,role)
   select qa_user,packet_id,'original' from public.source_checked_content_versions where audience='preview' and withdrawn_at is null and packet_id<>c.packet_id;
  s:=public.start_source_checked_session(qa_user,gen_random_uuid(),5,c.packet->'original'->>'nclex_category',null,'preview');
  sid:=(s->'session'->>'id')::uuid;
  if (s->'session'->>'total_questions')::integer<>1 then raise exception 'Expected one fresh original for %',c.packet_id; end if;
  select * into q from public.quiz_questions where session_id=sid and question_index=0;
  if q.source_checked_content_id<>c.id then raise exception 'Wrong frozen packet'; end if;
  if q.nclex_category<>c.packet->'original'->>'nclex_category' then raise exception 'Category changed during insertion'; end if;
  perform public.present_source_checked_question(qa_user,q.id,'preview');
  result:=public.answer_source_checked_question(qa_user,q.id,case when q.correct_answer='A' then 'B' else 'A' end,'preview');
  if (result->>'score')::integer<>0 then raise exception 'Original miss incorrectly scored'; end if;
  select * into rev from public.source_checked_review_queue where user_id=qa_user and source_question_id=q.id;
  if rev.id is null or rev.due_at<=now() then raise exception 'No future recommended review created'; end if;
  retry_result:=public.start_source_checked_retry(qa_user,q.id,'preview');
  select * into rq from public.quiz_questions where id=(retry_result->'question'->>'id')::uuid;
  if rq.question_stem=q.question_stem or rq.learning_attempt<>2 then raise exception 'Retry not distinct/separate'; end if;
  result:=public.answer_source_checked_question(qa_user,rq.id,rq.correct_answer,'preview');
  if (result->>'score')::integer<>1 then raise exception 'Retry score not separate'; end if;
  a:=public.start_source_checked_review_anytime(qa_user,rev.id,'preview');
  b:=public.start_source_checked_review_anytime(qa_user,rev.id,'preview');
  if a->'question'->>'id'<>b->'question'->>'id' then raise exception 'Review resume created another attempt'; end if;
  if a->'question'->>'question_stem' in(q.question_stem,rq.question_stem) then raise exception 'Review stem reused'; end if;
  result:=public.answer_source_checked_review_anytime(qa_user,(a->'question'->>'id')::uuid,c.packet->'reviews'->0->>'correct_answer','preview');
  if (result->>'correct')::boolean is not true or (result->>'exhausted')::boolean is not true then raise exception 'Review scoring/exhaustion failed'; end if;
  if (select score from public.quiz_sessions where id=sid)<>0 then raise exception 'Retry/review changed original score'; end if;
  if (select status from public.source_checked_review_queue where id=rev.id)<>'exhausted' then raise exception 'Queue not exhausted'; end if;
  exhausted:=false;
  begin perform public.start_source_checked_review_anytime(qa_user,rev.id,'preview'); exception when others then
   if sqlerrm not like '%Review unavailable%' then raise; end if;
   exhausted:=true;
  end;
  if not exhausted then raise exception 'Exhausted review started again'; end if;
  if (select count(*) from public.quiz_questions qq join public.quiz_sessions ss on ss.id=qq.session_id where ss.user_id=qa_user and qq.answered_at is not null and (qq.learning_attempt is null or qq.learning_attempt=1))<>cases+1 then raise exception 'Original-only Progress count changed after retry/review'; end if;
  if (select count(*) from public.quiz_questions qq join public.quiz_sessions ss on ss.id=qq.session_id where ss.user_id=qa_user and qq.is_correct is true and (qq.learning_attempt is null or qq.learning_attempt=1))<>0 then raise exception 'Review or retry correct answer leaked into Progress'; end if;
  cases:=cases+1;
 end loop;
 if exists(
  select 1 from (select qq.nclex_category,count(*) as answered,count(*) filter(where qq.is_correct) as correct
  from public.quiz_questions qq join public.quiz_sessions ss on ss.id=qq.session_id
  where ss.user_id=qa_user and qq.answered_at is not null and (qq.learning_attempt is null or qq.learning_attempt=1)
  group by qq.nclex_category) v
  where v.correct<>0 or v.answered<>case when v.nclex_category in('Pharmacological Therapies','Physiological Adaptation') then 1 else 2 end
 ) then raise exception 'Progress category arithmetic mismatch'; end if;
 if cases<>10 then raise exception 'Expected 10 families, got %',cases; end if;
end $qa$;
select '10 new families: original miss, distinct retry, immediate review/resume/exhaustion, separate score, original-only Progress totals 10/0 and canonical category arithmetic' as verified;
rollback;
