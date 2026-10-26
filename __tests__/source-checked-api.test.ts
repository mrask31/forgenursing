import {beforeEach,describe,it,expect,vi} from 'vitest'
import {NextRequest} from 'next/server'
const state=vi.hoisted(()=>({user:{id:'owner'} as {id:string}|null,access:true,enabled:true,content:true,rpc:vi.fn(),legacy:vi.fn(),row:{id:'11111111-1111-4111-8111-111111111111',source_checked_content_id:'version',question_stem:'frozen'} as any}))
vi.mock('@/lib/supabase/server',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:state.user},error:null})},from:()=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:state.row}),update:(...args:any[])=>{state.legacy(...args);return q},insert:(...args:any[])=>{state.legacy(...args);return q},single:async()=>({data:{id:"supplement",content_policy:"generated_supplement_v1"}})};return q}})}))
vi.mock('@/lib/entitlement',()=>({getEntitlementForUser:async()=>({hasAccess:state.access})}))
vi.mock('@/lib/learning/server',()=>({approvedContent:async()=>[],learningAdmin:()=>({})}))
vi.mock('@/lib/learning/source-checked-server',()=>({sourceCheckedEnabled:()=>state.enabled,sourceCheckedContent:async()=>state.content?{}:null,sourceCheckedRpc:state.rpc}))
import {POST as start} from '@/app/api/quiz/sessions/route'
import {POST as answer} from '@/app/api/quiz/answer/route'
import {GET as queue,POST as review} from '@/app/api/review/route'
const id='11111111-1111-4111-8111-111111111111'
const req=(body:unknown)=>new NextRequest('http://localhost/api/test',{method:'POST',body:JSON.stringify(body)})
beforeEach(()=>{state.user={id:'owner'};state.access=true;state.enabled=true;state.content=true;vi.clearAllMocks();state.rpc.mockResolvedValue({data:{session:{id:'session'}},error:null})})
describe('source-checked API boundaries',()=>{
 it('requires authentication and entitlement before source sessions or reviews',async()=>{
  state.user=null;expect((await start(req({requestId:id}))).status).toBe(401)
  state.user={id:'owner'};state.access=false;expect((await queue()).status).toBe(402)
  expect(state.rpc).not.toHaveBeenCalled()
 })
 it('binds a valid idempotency key and session owner, normalizes category and caps length',async()=>{
  expect((await start(req({requestId:id,user_id:'attacker',totalQuestions:20,nclexCategory:'Pharmacological and Parenteral Therapies'}))).status).toBe(200)
  expect(state.rpc).toHaveBeenCalledWith('start_source_checked_session',{p_user_id:'owner',p_request_id:id,p_total:5,p_category:'Pharmacological Therapies',p_focus:null})
  expect(state.legacy).not.toHaveBeenCalled()
 })
 it('rejects missing idempotency keys and reports exhaustion without generated fallback',async()=>{
  expect((await start(req({}))).status).toBe(400)
  state.rpc.mockResolvedValue({data:null,error:{message:'No fresh source-checked questions in this focus'}})
  const r=await start(req({requestId:id}));expect(r.status).toBe(409);expect(await r.json()).toMatchObject({code:'fresh_content_exhausted'})
  expect(state.legacy).not.toHaveBeenCalled()
 })
 it('blocks withdrawn question answers before calling scoring',async()=>{
  state.content=false;expect((await answer(req({questionId:id,userAnswer:'A'}))).status).toBe(409);expect(state.rpc).not.toHaveBeenCalled()
 })
 it('returns source-checked metadata from a saved answer, with no claimed clinical approval',async()=>{
  state.rpc.mockResolvedValue({data:{...state.row,session_id:'s',learning_attempt:1,is_correct:false,quiz_mode:'standard'},error:null})
  const r=await answer(req({questionId:id,userAnswer:'A'}));expect(r.status).toBe(200)
  expect(await r.json()).toMatchObject({learning:{retry_eligible:true,distinction_status:'ai_source_checked',content_version:'version'}})
 })
 it('routes review by tier and binds the authenticated owner instead of a supplied one',async()=>{
  state.rpc.mockResolvedValue({data:{question:{id}},error:null})
  expect((await review(req({action:'start',queue_id:id,content_kind:'source_checked',user_id:'attacker'}))).status).toBe(200)
  expect(state.rpc).toHaveBeenCalledWith('start_source_checked_review_anytime',{p_user_id:'owner',p_queue_id:id})
  state.rpc.mockResolvedValue({data:null,error:{message:'withdrawn'}})
  const r=await review(req({action:'answer',attempt_id:id,answer:'A',content_kind:'source_checked'}));expect(r.status).toBe(409);expect(await r.json()).not.toHaveProperty('feedback')
 })
 it('returns the source queue when no independently approved content exists and respects the flag',async()=>{
  state.rpc.mockResolvedValue({data:{available:true,due:[{id,content_kind:'source_checked'}],exhausted_count:1,next_due_at:null},error:null})
  expect(await (await queue()).json()).toMatchObject({available:true,due:[{id}],exhausted_count:1})
  state.enabled=false;vi.clearAllMocks()
  expect((await review(req({action:'start',queue_id:id,content_kind:'source_checked'}))).status).toBe(409)
  expect(state.rpc).not.toHaveBeenCalled()
 })
})

it('does not silently generate default daily practice when bank rollout is off',async()=>{state.enabled=false;const r=await start(req({requestId:id}));expect(r.status).toBe(503);expect(await r.json()).toMatchObject({code:'bank_not_enabled'});expect(state.legacy).not.toHaveBeenCalled();expect(state.rpc).not.toHaveBeenCalled()})
it('allows an explicit generated supplement independently of bank availability',async()=>{state.enabled=false;expect((await start(req({practiceSource:'generated',totalQuestions:5}))).status).toBe(200);expect(state.rpc).not.toHaveBeenCalled();expect(state.legacy).toHaveBeenCalledWith(expect.objectContaining({content_policy:'generated_supplement_v1',source_type:'generic'}))})
