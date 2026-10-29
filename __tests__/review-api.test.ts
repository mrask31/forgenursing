import {describe,it,expect,vi,beforeEach} from 'vitest'
import {NextRequest} from 'next/server'
const mocks=vi.hoisted(()=>({user:{id:'u1'} as {id:string}|null,access:true,bank:[] as any[],rows:[] as any[],rpc:vi.fn(),filters:[] as any[]}))
vi.mock('@/lib/supabase/server',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:mocks.user},error:null})}})}))
vi.mock('@/lib/entitlement',()=>({getEntitlementForUser:async()=>({hasAccess:mocks.access})}))
vi.mock('@/lib/learning/server',()=>({approvedContent:async()=>mocks.bank,learningAdmin:()=>({rpc:mocks.rpc,from:()=>{const q:any={select:()=>q,eq:(...a:any[])=>{mocks.filters.push(a);return q},in:()=>q,order:()=>q,limit:async()=>({data:mocks.rows,error:null}),maybeSingle:async()=>({data:null,error:null})};return q}})}))
import {GET,POST} from '../src/app/api/review/route'
beforeEach(()=>{mocks.user={id:'u1'};mocks.access=true;mocks.bank=[];mocks.rows=[];mocks.filters=[];mocks.rpc.mockReset()})
describe('scheduled review API',()=>{
 it('rejects signed-out and expired-trial users',async()=>{mocks.user=null;expect((await GET()).status).toBe(401);mocks.user={id:'u1'};mocks.access=false;expect((await GET()).status).toBe(402)})
 it('distinguishes no approved content from nothing due',async()=>{expect(await (await GET()).json()).toMatchObject({available:false,due:[]});mocks.bank=[{id:'v1'}];expect(await (await GET()).json()).toMatchObject({available:true,due:[]});expect(mocks.filters).toContainEqual(['user_id','u1'])})
 it('splits future due dates from due reviews',async()=>{mocks.bank=[{id:'v1'}];mocks.rows=[{id:'past',due_at:'2020-01-01T00:00:00Z'},{id:'future',due_at:'2099-01-01T00:00:00Z'}];expect(await (await GET()).json()).toMatchObject({due:[{id:'past'}],pending:[{id:'past',content_kind:'clinical'},{id:'future',content_kind:'clinical'}],pending_count:2,next_due_at:'2099-01-01T00:00:00Z'})})
 it('validates answer shape and binds the owner server-side',async()=>{const req=(b:any)=>new NextRequest('http://localhost/api/review',{method:'POST',body:JSON.stringify(b)});expect((await POST(req({action:'answer',attempt_id:'bad',answer:'Z'}))).status).toBe(400);mocks.rpc.mockResolvedValue({data:{correct:false},error:null});expect((await POST(req({action:'answer',attempt_id:'11111111-1111-4111-8111-111111111111',answer:'A',user_id:'someone-else'}))).status).toBe(200);expect(mocks.rpc).toHaveBeenCalledWith('answer_scheduled_review_anytime',expect.objectContaining({p_user_id:'u1'}))})
 it('does not return feedback after a failed save or withdrawn review',async()=>{mocks.rpc.mockResolvedValue({data:null,error:{message:'withdrawn'}});const r=await POST(new NextRequest('http://localhost/api/review',{method:'POST',body:JSON.stringify({action:'answer',attempt_id:'11111111-1111-4111-8111-111111111111',answer:'A'})}));expect(r.status).toBe(409);expect(await r.json()).not.toHaveProperty('feedback')})
})
