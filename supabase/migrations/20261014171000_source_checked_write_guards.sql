-- Close direct-client mutation paths in otherwise owner-writable legacy quiz tables.
create or replace function learning_private.protect_source_question() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if old.source_checked_content_id is not null and current_user not in ('service_role','postgres') then raise exception 'Source questions are server-managed'; end if;
  return old;
 end if;
 if TG_OP='UPDATE' and new.source_checked_content_id is distinct from old.source_checked_content_id then raise exception 'Source content link is immutable'; end if;
 if new.source_checked_content_id is null then
  if exists(select 1 from public.quiz_sessions where id=new.session_id and content_policy='source_checked_v1') then raise exception 'Source sessions require frozen questions'; end if;
  return new;
 end if;
 if current_user not in ('service_role','postgres') then raise exception 'Source-checked answers are server-managed'; end if;
 if not exists(select 1 from public.quiz_sessions where id=new.session_id and content_policy='source_checked_v1') then raise exception 'Source question requires source session'; end if;
 if TG_OP='UPDATE' then
  if (to_jsonb(new)-'user_answer'-'is_correct'-'answered_at') is distinct from (to_jsonb(old)-'user_answer'-'is_correct'-'answered_at') then raise exception 'Frozen source question is immutable'; end if;
  if old.answered_at is not null and new is distinct from old then raise exception 'First answer is final'; end if;
 end if;
 if not exists(select 1 from public.source_checked_content_versions where id=new.source_checked_content_id and withdrawn_at is null) then raise exception 'Source content unavailable'; end if;
 return new;
end $$;
drop trigger protect_source_question on public.quiz_questions;
create trigger protect_source_question before insert or update or delete on public.quiz_questions for each row execute function learning_private.protect_source_question();
create or replace function learning_private.protect_source_session() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if old.content_policy='source_checked_v1' and current_user not in ('service_role','postgres') then raise exception 'Source sessions are server-managed'; end if;
  return old;
 end if;
 if TG_OP='UPDATE' and (new.content_policy is distinct from old.content_policy or new.start_request_id is distinct from old.start_request_id or (old.content_policy='source_checked_v1' and new.user_id is distinct from old.user_id)) then raise exception 'Source session identity is immutable'; end if;
 if new.content_policy='source_checked_v1' and current_user not in ('service_role','postgres') then raise exception 'Source sessions are server-managed'; end if;
 return new;
end $$;
drop trigger protect_source_session on public.quiz_sessions;
create trigger protect_source_session before insert or update or delete on public.quiz_sessions for each row execute function learning_private.protect_source_session();
create index source_queue_content on public.source_checked_review_queue(content_id);
create index source_attempt_user on public.source_checked_review_attempts(user_id);
