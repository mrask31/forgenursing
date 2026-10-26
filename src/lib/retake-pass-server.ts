import 'server-only'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { learningAdmin } from '@/lib/learning/server'
import { matchesRetakePassPrice, retakePassState } from './retake-pass'
export const passAudience = () => process.env.VERCEL_ENV==='production' ? 'production' : 'preview'
export function passStripe() {
 const key = passAudience()==='preview' ? process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY
 if (!key || !(passAudience()==='preview' ? /^(sk|rk)_test_/ : /^(sk|rk)_live_/).test(key)) throw new Error('Pass checkout needs the matching sandbox/live Stripe key.')
 return new Stripe(key,{apiVersion:'2025-12-15.clover'})
}
export function passPriceId() { return passAudience()==='preview' ? process.env.STRIPE_PRICE_RETAKE_PASS_TEST || 'price_1UUqD0Gnwd1bHIvchVGDxJdG' : process.env.STRIPE_PRICE_RETAKE_PASS }
export async function getRetakePass(userId:string) {
 const {data,error}=await createClient().from('retake_passes').select('*').eq('user_id',userId).eq('audience',passAudience()).order('purchased_at',{ascending:false}).limit(1).maybeSingle()
 if(error) throw new Error('Pass access could not load')
 return data ? {...data,...retakePassState({purchasedAt:data.purchased_at,accessUntil:data.access_until,extendedAt:data.extension_used_at}),active:!data.refunded_at&&Date.parse(data.access_until)>Date.now(),extensionAvailable:!data.refunded_at&&!data.extension_used_at&&Date.parse(data.access_until)<=Date.now()} : null
}
/** Called only after retrieving the session from Stripe, never from client payment fields. */
export async function fulfillRetakePass(session:Stripe.Checkout.Session,stripe:Stripe,expectedUserId?:string) {
 const userId=session.client_reference_id
 if(!userId || (expectedUserId&&expectedUserId!==userId)) throw new Error('Checkout ownership mismatch')
 if(session.mode!=='payment'||session.payment_status!=='paid'||session.status!=='complete'||session.metadata?.offer!=='retake_pass_v1'||session.metadata?.audience!==passAudience()||session.livemode!==(passAudience()==='production')) throw new Error('Pass payment not complete')
 if(session.amount_total!==2999||session.currency!=='usd') throw new Error('Pass amount mismatch')
 const items=await stripe.checkout.sessions.listLineItems(session.id,{limit:2,expand:['data.price']})
 const price=items.data[0]?.price
 if(items.data.length!==1||items.data[0].quantity!==1||!price||price.id!==passPriceId()||!matchesRetakePassPrice(price)) throw new Error('Pass price mismatch')
 const customer=typeof session.customer==='string'?session.customer:session.customer?.id
 const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id
 if(!customer||!intent) throw new Error('Pass payment identity missing')
 const payment=await stripe.paymentIntents.retrieve(intent,{expand:['latest_charge']})
 const charge=typeof payment.latest_charge==='object'?payment.latest_charge:null
 if(payment.status!=='succeeded'||!charge||charge.refunded||charge.disputed||charge.amount_refunded>0) throw new Error('Payment unavailable or refunded')
 const {data,error}=await learningAdmin().rpc('grant_retake_pass',{p_user_id:userId,p_audience:passAudience(),p_checkout:session.id,p_customer:customer,p_payment_intent:intent,p_paid_at:new Date(charge.created*1000).toISOString()})
 if(error) throw new Error('Paid access could not be saved. Retry confirmation or contact support.')
 return data
}

export async function getPassCheckoutIntent(userId:string) {
 const {data,error}=await learningAdmin().rpc('retake_pass_checkout_intent',{p_user_id:userId,p_audience:passAudience()})
 if(error||!data) throw new Error('Pass checkout could not be prepared.')
 return data as {token:string;expires_at:string}
}

export function passRequestAllowed(req?:Request) { const origin=req?.headers.get('origin'); return !origin || origin===new URL(req!.url).origin }
