import {passRequestAllowed} from '@/lib/retake-pass-server'
import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {getRetakePass,passStripe,passPriceId,passAudience,getPassCheckoutIntent} from '@/lib/retake-pass-server'
import {matchesRetakePassPrice} from '@/lib/retake-pass'
export async function POST(req?:Request){if(!passRequestAllowed(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});try{
 const {data:{user}}=await createClient().auth.getUser();if(!user)return NextResponse.json({error:'Please sign in.'},{status:401})
 const existing=await getRetakePass(user.id)
 if(existing?.active||existing?.extensionAvailable)return NextResponse.json({error:existing.active?'Your pass is active.':'Your free extension is available in Account.'},{status:409})
 const stripe=passStripe(),id=passPriceId();if(!id)throw new Error('Pass price is not configured.')
 const price=await stripe.prices.retrieve(id);if(!matchesRetakePassPrice(price)||price.livemode!==(passAudience()==='production'))throw new Error('Pass pricing is unavailable.')
 const host=process.env.VERCEL_URL,configured=process.env.NEXT_PUBLIC_APP_URL
 const origin=passAudience()==='preview'&&host?`https://${host}`:configured?.startsWith('https://')?configured:'https://forgenursing.com'
 const intent=await getPassCheckoutIntent(user.id)
 const session=await stripe.checkout.sessions.create({expires_at:Math.floor(Date.parse(intent.expires_at)/1000),mode:'payment',line_items:[{price:id,quantity:1}],customer_creation:'always',customer_email:user.email,client_reference_id:user.id,metadata:{offer:'retake_pass_v1',audience:passAudience()},invoice_creation:{enabled:true},payment_method_types:['card'],success_url:`${origin}/settings?pass_checkout={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/checkout?canceled=1`},{idempotencyKey:`retake-v1:${intent.token}`})
 return NextResponse.json({url:session.url})
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Pass checkout unavailable.'},{status:503})}}
