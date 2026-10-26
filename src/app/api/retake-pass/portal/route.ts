import {passRequestAllowed} from '@/lib/retake-pass-server'
import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {getRetakePass,passStripe} from '@/lib/retake-pass-server'
export async function POST(req:Request){if(!passRequestAllowed(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});try{const {data:{user}}=await createClient().auth.getUser();if(!user)return NextResponse.json({error:'Please sign in.'},{status:401});const pass=await getRetakePass(user.id);if(!pass)return NextResponse.json({error:'No pass purchase is linked.'},{status:409});const host=process.env.VERCEL_URL;const session=await passStripe().billingPortal.sessions.create({customer:pass.stripe_customer_id,return_url:host?`https://${host}/settings`:'https://forgenursing.com/settings'});return NextResponse.json({url:session.url})}catch{return NextResponse.json({error:'Invoices could not open. Please retry.'},{status:503})}}
