import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const m = vi.hoisted(() => ({user:{id:'owner'} as {id:string}|null,access:true,q:null as any,eq:vi.fn(),source:vi.fn(),clinical:vi.fn()}))
vi.mock('@/lib/supabase/server',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:m.user}})},from:()=>({select:()=>({eq:(...args:unknown[])=>{m.eq(...args);return {eq:(...args:unknown[])=>{m.eq(...args);return {maybeSingle:async()=>({data:m.q})}}}}})})})}))
vi.mock('@/lib/entitlement',()=>({getEntitlementForUser:async()=>({hasAccess:m.access})}))
vi.mock('@/lib/learning/source-checked-server',()=>({sourceCheckedContent:m.source}))
vi.mock('@/lib/learning/server',()=>({approvedContent:m.clinical}))
import { GET } from '../src/app/api/quiz/feedback/route'
const id='12345678-1234-4234-8234-123456789012'
const get=()=>GET(new NextRequest(`https://preview.example/api/quiz/feedback?questionId=${id}`))
beforeEach(()=>{vi.clearAllMocks();m.user={id:'owner'};m.access=true;m.q={id,session_id:'session',question_index:0,question_stem:'A patient needs assessment.',answered_at:'2026-10-25',user_answer:'B',is_correct:false,correct_answer:'A',learning_attempt:1,quiz_sessions:{status:'in_progress',score:0,current_question_index:1,quiz_mode:'standard'}};m.source.mockResolvedValue(null);m.clinical.mockResolvedValue([])})
describe('saved quiz feedback',()=>{
 it('requires authentication and access',async()=>{m.user=null;expect((await get()).status).toBe(401);m.user={id:'owner'};m.access=false;expect((await get()).status).toBe(402);expect(m.eq).not.toHaveBeenCalled()})
 it('reads only owned questions and restores feedback without scoring or advancing',async()=>{const r=await get();expect(r.status).toBe(200);expect(m.eq).toHaveBeenCalledWith('quiz_sessions.user_id','owner');expect(r.headers.get('Cache-Control')).toBe('private, no-store');const b=await r.json();expect(b.question.question_index).toBe(0);expect(b.question.quiz_sessions).toBeUndefined();expect(b.answer).toMatchObject({user_answer:'B',correct_answer:'A',total_answered:1,score:0,learning:{retry_eligible:true}})})
 it('does not disclose unanswered solutions or missing questions',async()=>{m.q.answered_at=null;const r=await get();expect(r.status).toBe(409);expect(await r.json()).not.toHaveProperty('question');m.q=null;expect((await get()).status).toBe(404)})
 it('honors content holds and withdrawn source-checked versions',async()=>{m.q.question_stem='A patient with COPD';expect((await get()).status).toBe(409);m.q.question_stem='A patient needs assessment.';m.q.source_checked_content_id='withdrawn';expect((await get()).status).toBe(409)})
 it('restores last-question feedback even after session completion',async()=>{m.q.quiz_sessions.status='completed';expect((await (await get()).json()).answer.session_complete).toBe(true)})
 it('does not offer a retry of a retry',async()=>{m.q.learning_attempt=2;m.q.quiz_sessions.quiz_mode='retest';expect((await (await get()).json()).answer.learning.retry_eligible).toBe(false)})
})
