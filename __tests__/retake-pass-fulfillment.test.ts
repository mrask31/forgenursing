import {beforeEach,afterEach,expect,it,vi} from 'vitest'
vi.mock('server-only',()=>({}))
const m=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('@/lib/learning/server',()=>({learningAdmin:()=>({rpc:m.rpc})}))
vi.mock('@/lib/supabase/server',()=>({createClient:()=>({})}))
import {fulfillRetakePass} from '../src/lib/retake-pass-server'
const session:any={id:'cs_test',client_reference_id:'owner',mode:'payment',payment_status:'paid',status:'complete',metadata:{offer:'retake_pass_v1',audience:'preview'},livemode:false,amount_total:2999,currency:'usd',customer:'cus_test',payment_intent:'pi_test'}
function stripe(refunded=false):any{return {checkout:{sessions:{listLineItems:vi.fn().mockResolvedValue({data:[{quantity:1,price:{id:'price_fixture',active:true,currency:'usd',unit_amount:2999,type:'one_time',recurring:null}}]})}},paymentIntents:{retrieve:vi.fn().mockResolvedValue({status:'succeeded',latest_charge:{created:1793000000,refunded,disputed:false,amount_refunded:0}})}}}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('STRIPE_PRICE_RETAKE_PASS_TEST','price_fixture');m.rpc.mockResolvedValue({data:{id:'pass'}})})
afterEach(()=>vi.unstubAllEnvs())
it('grants only a verified paid session for the authenticated owner and preview audience',async()=>{await fulfillRetakePass(session,stripe(),'owner');expect(m.rpc).toHaveBeenCalledWith('grant_retake_pass',expect.objectContaining({p_user_id:'owner',p_checkout:'cs_test',p_audience:'preview',p_payment_intent:'pi_test'}))})
it('rejects forged ownership, unpaid/live sessions, and refunded charges before granting',async()=>{for(const s of [{...session,client_reference_id:'other'},{...session,payment_status:'unpaid'},{...session,livemode:true}])await expect(fulfillRetakePass(s,stripe(),'owner')).rejects.toThrow();await expect(fulfillRetakePass(session,stripe(true),'owner')).rejects.toThrow();expect(m.rpc).not.toHaveBeenCalled()})
