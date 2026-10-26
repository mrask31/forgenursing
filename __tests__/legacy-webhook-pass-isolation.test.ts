import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const m=vi.hoisted(()=>({event:{} as any,from:vi.fn(),retrieve:vi.fn(),send:vi.fn(),sync:vi.fn()}))
vi.mock('stripe',()=>({default:class {webhooks={constructEvent:()=>m.event};subscriptions={retrieve:m.retrieve}}}))
vi.mock('resend',()=>({Resend:class {emails={send:m.send}}}))
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({from:m.from})}))
vi.mock('next/headers',()=>({headers:()=>({get:()=> 'signed-fixture'})}))
vi.mock('@/lib/stripe-subscription-sync',()=>({syncSubscriptionEvent:m.sync}))
vi.mock('@/lib/analytics/stripe-payment',()=>({recordInvoicePayment:vi.fn()}))
import { POST } from '../src/app/api/stripe/webhook/route'
beforeEach(()=>{
 vi.clearAllMocks()
 for(const key of ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SUPABASE_URL'])vi.stubEnv(key,'test-fixture')
 m.from.mockImplementation(()=>({upsert:async()=>({error:null}),update:()=>({eq:async()=>({error:null})})}))
 m.event={id:'evt_fixture',type:'checkout.session.completed',data:{object:{mode:'payment',client_reference_id:'owner',customer:'cus_pass',metadata:{offer:'retake_pass_v1'}}}}
 m.retrieve.mockResolvedValue({status:'active',items:{data:[]}})
})
afterEach(()=>vi.unstubAllEnvs())
it('acknowledges a pass event without subscription lookup, profile changes or subscription email',async()=>{
 const r=await POST(new Request('https://forgenursing.com/api/stripe/webhook',{method:'POST',body:'signed event'}))
 expect(r.status).toBe(200)
 expect(await r.json()).toMatchObject({received:true,success:true})
 expect(m.retrieve).not.toHaveBeenCalled()
 expect(m.from.mock.calls.map(call=>call[0])).not.toContain('profiles')
 expect(m.send).not.toHaveBeenCalled()
})
it('retains subscription lifecycle synchronization for existing customers',async()=>{
 m.event={id:'evt_subscription',type:'customer.subscription.updated',data:{object:{id:'sub_existing',customer:'cus_existing'}}}
 m.sync.mockResolvedValue({success:true})
 expect((await POST(new Request('https://forgenursing.com/api/stripe/webhook',{method:'POST',body:'signed event'}))).status).toBe(200)
 expect(m.sync).toHaveBeenCalledWith('sub_existing',expect.anything(),expect.anything())
})
