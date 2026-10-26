CREATE OR REPLACE FUNCTION public.start_source_checked_review_anytime(p_user_id uuid, p_queue_id uuid, p_audience text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare q public.source_checked_review_queue; c public.source_checked_content_versions; a public.source_checked_review_attempts; item jsonb;
begin
 select * into q from public.source_checked_review_queue where id=p_queue_id and user_id=p_user_id for update;
 if not found or q.status<>'scheduled' then raise exception 'Review unavailable'; end if;
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
end $function$
;
CREATE OR REPLACE FUNCTION public.answer_scheduled_review_anytime(p_user_id uuid, p_attempt_id uuid, p_answer text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
   if q.review_round <> a.review_round or q.status <> 'scheduled' then raise exception 'Review unavailable'; end if;
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
end $function$
;
create function public.source_checked_review_status_anytime(p_user_id uuid,p_audience text) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object(
 'available',exists(select 1 from public.source_checked_content_versions where withdrawn_at is null and audience=p_audience),
 'pending',coalesce((select jsonb_agg(to_jsonb(d) order by d.due_at) from (select q.id,q.distinction_id,q.due_at,c.packet->>'focus' as focus,'source_checked'::text as content_kind from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='scheduled' and c.withdrawn_at is null and c.audience=p_audience order by q.due_at limit 1000) d),'[]'::jsonb),
 'due',coalesce((select jsonb_agg(to_jsonb(d) order by d.due_at) from (select q.id,q.distinction_id,q.due_at,'source_checked'::text as content_kind from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='scheduled' and q.due_at<=now() and c.withdrawn_at is null and c.audience=p_audience order by q.due_at limit 1000) d),'[]'::jsonb),
 'pending_count',(select count(*) from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='scheduled' and c.withdrawn_at is null and c.audience=p_audience),
 'next_due_at',(select min(q.due_at) from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='scheduled' and q.due_at>now() and c.withdrawn_at is null and c.audience=p_audience),
 'exhausted_count',(select count(*) from public.source_checked_review_queue q join public.source_checked_content_versions c on c.id=q.content_id where q.user_id=p_user_id and q.status='exhausted' and c.audience=p_audience),'content_status','ai_source_checked');
$$;
revoke all on function public.start_source_checked_review_anytime(uuid,uuid,text) from public,anon,authenticated; grant execute on function public.start_source_checked_review_anytime(uuid,uuid,text) to service_role;
revoke all on function public.answer_scheduled_review_anytime(uuid,uuid,text) from public,anon,authenticated; grant execute on function public.answer_scheduled_review_anytime(uuid,uuid,text) to service_role;
revoke all on function public.source_checked_review_status_anytime(uuid,text) from public,anon,authenticated; grant execute on function public.source_checked_review_status_anytime(uuid,text) to service_role;
