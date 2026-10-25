import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: { id: 'qa' } as {id:string}|null, profile: {stripe_customer_id:'cus_qa',stripe_subscription_id:'sub_qa'} as {stripe_customer_id:string|null;stripe_subscription_id:string|null}, portal:vi.fn(), subscription:vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ auth:{getUser:async()=>({data:{user:mocks.user},error:null})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:mocks.profile,error:null})})})}) }) }))
vi.mock('stripe', () => ({default:class {subscriptions={retrieve:mocks.subscription};billingPortal={sessions:{create:mocks.portal}}}}))
import {GET,POST} from '../src/app/api/account/billing/route'
beforeEach(()=>{vi.clearAllMocks();mocks.user={id:'qa'};mocks.profile={stripe_customer_id:'cus_qa',stripe_subscription_id:'sub_qa'};vi.stubEnv('STRIPE_SECRET_KEY','sk_test_fixture_not_a_secret');vi.stubEnv('NEXT_PUBLIC_APP_URL','https://preview.example.test');vi.stubEnv('VERCEL_URL','');mocks.portal.mockResolvedValue({url:'https://billing.stripe.com/test-only'});mocks.subscription.mockResolvedValue({customer:'cus_qa',status:'active',cancel_at_period_end:false,items:{data:[{current_period_end:1800000000,price:{unit_amount:7900,currency:'usd',recurring:{interval:'year',interval_count:1}}}]}})})
afterEach(()=>vi.unstubAllEnvs())
describe('account billing boundaries',()=>{
 it('requires authentication for both details and portal',async()=>{mocks.user=null;expect((await GET()).status).toBe(401);expect((await POST()).status).toBe(401);expect(mocks.portal).not.toHaveBeenCalled();expect(mocks.subscription).not.toHaveBeenCalled()})
 it('uses only the authenticated profile customer and configured return origin',async()=>{expect((await POST()).status).toBe(200);expect(mocks.portal).toHaveBeenCalledWith({customer:'cus_qa',return_url:'https://preview.example.test/settings'})})
 it('does not create customers for unlinked accounts',async()=>{mocks.profile={stripe_customer_id:null,stripe_subscription_id:null};expect((await POST()).status).toBe(409);expect(mocks.portal).not.toHaveBeenCalled();expect(await (await GET()).json()).toEqual({subscription:null,canManage:false,stripeMode:'test'})})
 it('rejects mismatched customer ownership without returning subscription details',async()=>{mocks.subscription.mockResolvedValue({customer:'cus_other'});expect((await GET()).status).toBe(503)})
 it('returns only display fields and private no-store headers',async()=>{const r=await GET();expect(r.status).toBe(200);expect(r.headers.get('Cache-Control')).toBe('private, no-store');expect(await r.json()).toMatchObject({canManage:true,subscription:{amount:7900,currency:'usd',interval:'year',currentPeriodEnd:1800000000}})})
 it('fails safely when portal configuration is unavailable',async()=>{mocks.portal.mockRejectedValue(new Error('private provider detail'));const r=await POST();expect(r.status).toBe(503);expect(JSON.stringify(await r.json())).not.toContain('private provider detail')})
})

it('identifies test mode and missing records without exposing the key or Stripe message', async () => {
 mocks.subscription.mockRejectedValue({code:'resource_missing', message:'private Stripe response'})
 const r=await GET(); const body=await r.json()
 expect(body).toMatchObject({stripeMode:'test',code:'stripe_resource_missing'})
 expect(JSON.stringify(body)).not.toContain('sk_test_')
 expect(JSON.stringify(body)).not.toContain('private Stripe response')
})
it('reports live restricted-key mode without returning any key bytes', async () => {
 vi.stubEnv('STRIPE_SECRET_KEY','rk_live_fixture_not_a_secret')
 const body=await (await GET()).json()
 expect(body.stripeMode).toBe('live'); expect(JSON.stringify(body)).not.toContain('rk_live_')
})

it('identifies a missing return URL before calling Stripe', async () => {
 vi.stubEnv('NEXT_PUBLIC_APP_URL','')
 const r=await POST(); expect(r.status).toBe(503)
 expect(await r.json()).toMatchObject({stage:'return_url',code:'billing_return_url_invalid'})
 expect(mocks.portal).not.toHaveBeenCalled()
})
it('identifies portal permissions without exposing provider messages', async () => {
 mocks.portal.mockRejectedValue({type:'StripePermissionError',message:'private provider detail'})
 const r=await POST(); const body=await r.json()
 expect(body).toMatchObject({stage:'stripe_portal',code:'stripe_permission_denied'})
 expect(r.headers.get('Cache-Control')).toBe('private, no-store')
 expect(JSON.stringify(body)).not.toContain('private provider detail')
})

it('uses the trusted deployment hostname when app URL is absent', async () => {
 vi.stubEnv('NEXT_PUBLIC_APP_URL','')
 vi.stubEnv('VERCEL_URL','forgenursing-preview.vercel.app')
 expect((await POST()).status).toBe(200)
 expect(mocks.portal).toHaveBeenCalledWith({customer:'cus_qa',return_url:'https://forgenursing-preview.vercel.app/settings'})
})
