CREATE OR REPLACE FUNCTION public.answer_source_checked_review_anytime(p_user_id uuid, p_attempt_id uuid, p_answer text, p_audience text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  if q.status<>'scheduled' then raise exception 'Review unavailable'; end if;
  update public.source_checked_review_attempts set user_answer=p_answer,correct=(p_answer=item->>'correct_answer'),answered_at=now() where id=a.id returning * into a;
  update public.source_checked_review_queue set status='exhausted' where id=q.id;
 end if;
 return jsonb_build_object('question_id',a.id,'source_question_id',q.source_question_id,'distinction_id',q.distinction_id,'correct',a.correct,'user_answer',a.user_answer,
  'days_since_miss',greatest(0,floor(extract(epoch from (a.answered_at-q.missed_at))/86400)),
  'review_round',1,'content_version',c.id,'feedback',item,'sources',c.packet->'references','content_status','ai_source_checked','exhausted',true);
end $function$
;
revoke all on function public.answer_source_checked_review_anytime(uuid,uuid,text,text) from public,anon,authenticated;grant execute on function public.answer_source_checked_review_anytime(uuid,uuid,text,text) to service_role;
