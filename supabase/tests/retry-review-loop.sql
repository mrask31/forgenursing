-- Run only inside a transaction that is rolled back. Synthetic content is never published.
create function pg_temp.assert_true(value boolean, label text) returns void language plpgsql as $$ begin if value is distinct from true then raise exception 'ASSERTION FAILED: %', label; end if; end $$;
select set_config('test.owner', (select id::text from auth.users where lower(email)='mrask30@gmail.com' limit 1), true);
select set_config('test.other', (select id::text from auth.users where lower(email)<>'mrask30@gmail.com' limit 1), true);
select pg_temp.assert_true(current_setting('test.owner',true) is not null, 'owner fixture exists');
select pg_temp.assert_true(current_setting('test.other',true) is not null, 'other fixture exists');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.clinical_content_versions','insert'), 'students cannot approve content');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.learning_review_queue','update'), 'students cannot change schedules');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.answer_scheduled_review(uuid,uuid,text)','execute'), 'review RPC is service only');
select pg_temp.assert_true(not has_function_privilege('anon','public.record_quiz_answer(uuid,text)','execute'), 'answer RPC requires auth');
insert into public.clinical_content_versions(id,packet_id,version,distinction_id,packet,packet_sha256,approval,approved_at) values
 ('11111111-1111-4111-8111-111111111111','ROLLBACK-TEST-ONLY',1,'potassium-direction-ecg',
 '{"distinction_id":"potassium-direction-ecg","reviews":[{"correct_answer":"B","rationale_correct":"TEST ONLY"},{"correct_answer":"A","rationale_correct":"TEST ONLY"},{"correct_answer":"C","rationale_correct":"TEST ONLY"}],"references":[]}',
 repeat('a',64),jsonb_build_object('decision','approved','reviewer_independent',true,'all_criteria_resolved',true,'packet_sha256',repeat('a',64)),now());
insert into public.quiz_sessions(id,user_id,source_type,status,total_questions,score,current_question_index) values
 ('22222222-2222-4222-8222-222222222222',current_setting('test.owner')::uuid,'generic','in_progress',1,0,0),
 ('33333333-3333-4333-8333-333333333333',current_setting('test.other')::uuid,'generic','in_progress',1,0,0);
insert into public.quiz_questions(id,session_id,question_index,question_stem,options,correct_answer,rationale_correct,rationale_incorrect,clinical_content_id,distinction_id) values
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222',0,'TEST ONLY','[]','B','TEST ONLY','{}','11111111-1111-4111-8111-111111111111','potassium-direction-ecg');
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
set local role authenticated;
select pg_temp.assert_true((public.record_quiz_answer('44444444-4444-4444-8444-444444444444','A')->>'is_correct')::boolean = false,'saved wrong answer');
select pg_temp.assert_true((public.record_quiz_answer('44444444-4444-4444-8444-444444444444','B')->>'user_answer') = 'A','second answer cannot change original');
select pg_temp.assert_true((select current_question_index=1 and score=0 from public.quiz_sessions where id='22222222-2222-4222-8222-222222222222'),'duplicate submission does not advance score');
select pg_temp.assert_true((select count(*)=1 from public.learning_review_queue where source_question_id='44444444-4444-4444-8444-444444444444'),'miss scheduled once');
select pg_temp.assert_true((select due_at > now()+interval '23 hours' from public.learning_review_queue where source_question_id='44444444-4444-4444-8444-444444444444'),'first review due tomorrow');
do $$ begin
 begin update public.quiz_questions set correct_answer='A' where id='44444444-4444-4444-8444-444444444444'; raise exception 'approved content update unexpectedly succeeded';
 exception when others then if SQLERRM <> 'Reviewed question content is immutable' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.learning_review_queue),'other account cannot see owner queue');
do $$ begin
 begin perform public.record_quiz_answer('44444444-4444-4444-8444-444444444444','C'); raise exception 'cross-owner answer unexpectedly succeeded';
 exception when others then if SQLERRM not in ('Question not found','Forbidden') then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
update public.learning_review_queue set due_at=now()-interval '1 minute' where source_question_id='44444444-4444-4444-8444-444444444444';
insert into public.learning_review_attempts(id,queue_id,user_id,review_round) select '55555555-5555-4555-8555-555555555555',id,user_id,0 from public.learning_review_queue where source_question_id='44444444-4444-4444-8444-444444444444';
set local role service_role;
select pg_temp.assert_true((public.answer_scheduled_review(current_setting('test.owner')::uuid,'55555555-5555-4555-8555-555555555555','B')->>'correct')::boolean,'review answer scored from frozen key');
select pg_temp.assert_true((public.answer_scheduled_review(current_setting('test.owner')::uuid,'55555555-5555-4555-8555-555555555555','A')->>'user_answer')='B','review resubmission idempotent');
select pg_temp.assert_true((select review_round=1 and due_at>now()+interval '71 hours' from public.learning_review_queue where source_question_id='44444444-4444-4444-8444-444444444444'),'success schedules remaining variant once');
do $$ begin
 begin perform public.answer_scheduled_review(current_setting('test.other')::uuid,'55555555-5555-4555-8555-555555555555','B'); raise exception 'cross-owner review unexpectedly succeeded';
 exception when others then if SQLERRM <> 'Review attempt not found' then raise; end if; end;
end $$;
update public.clinical_content_versions set withdrawn_at=now(),withdrawal_reason='ROLLBACK TEST' where id='11111111-1111-4111-8111-111111111111';
do $$ begin
 begin perform public.answer_scheduled_review(current_setting('test.owner')::uuid,'55555555-5555-4555-8555-555555555555','B'); raise exception 'withdrawn review unexpectedly succeeded';
 exception when others then if SQLERRM <> 'Reviewed content unavailable' then raise; end if; end;
end $$;
reset role;
select 'PASS: isolation, immutable approvals, idempotent answers, scheduling, withdrawal' as test_result;
