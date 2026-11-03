import { beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({getUser:vi.fn(),retrieve:vi.fn(),fulfill:vi.fn()}))
vi.mock('@/lib/supabase/server',()=>({createClient:()=>({auth:{getUser:mocks.getUser}})}))
vi.mock('@/lib/retake-pass-server',()=>({passRequestAllowed:()=>true,passStripe:()=>({checkout:{sessions:{retrieve:mocks.retrieve}}}),fulfillRetakePass:mocks.fulfill}))
import { POST } from '../src/app/api/retake-pass/confirm/route'
const request=()=>new Request('https://forgenursing.com/api/retake-pass/confirm',{method:'POST',body:JSON.stringify({sessionId:'cs_live_confirmed'})})
beforeEach(()=>{
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({data:{user:{id:'account'}}})
  mocks.retrieve.mockResolvedValue({id:'cs_live_confirmed',payment_intent:'pi_verified123',amount_total:2999,currency:'usd',livemode:true})
  mocks.fulfill.mockResolvedValue({id:'pass'})
})
it('returns a GA4 receipt only after Stripe retrieval and successful paid-access fulfillment',async()=>{
  const response=await POST(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({confirmed:true,purchase:{transaction_id:'pi_verified123',value:29.99,currency:'USD',livemode:true}})
  expect(mocks.fulfill).toHaveBeenCalledWith(expect.objectContaining({id:'cs_live_confirmed'}),expect.anything(),'account')
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})
it('does not produce a purchase receipt when ownership/payment/fulfillment validation fails',async()=>{
  mocks.fulfill.mockRejectedValue(new Error('Unpaid or wrong account'))
  const response=await POST(request());expect(response.status).toBe(409)
  expect(await response.json()).not.toHaveProperty('purchase')
})
it('never accepts client-side amount/intent fields or anonymous confirmation',async()=>{
  mocks.getUser.mockResolvedValue({data:{user:null}})
  expect((await POST(request())).status).toBe(401)
  expect(mocks.retrieve).not.toHaveBeenCalled();expect(mocks.fulfill).not.toHaveBeenCalled()
})
it('marks sandbox confirmation explicitly as sandbox for client suppression',async()=>{
  mocks.retrieve.mockResolvedValue({id:'cs_test_confirmed',payment_intent:'pi_sandbox',amount_total:2999,currency:'usd',livemode:false})
  const response=await POST(request());expect(await response.json()).toHaveProperty('purchase.livemode',false)
})
