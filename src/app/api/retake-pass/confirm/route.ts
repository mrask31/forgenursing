import {passRequestAllowed} from '@/lib/retake-pass-server'
import {NextResponse} from 'next/server'
import {z} from 'zod'
import {createClient} from '@/lib/supabase/server'
import {passStripe,fulfillRetakePass} from '@/lib/retake-pass-server'
export async function POST(req:Request){if(!passRequestAllowed(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});try{const {data:{user}}=await createClient().auth.getUser();if(!user)return NextResponse.json({error:'Please sign in.'},{status:401});const body=z.object({sessionId:z.string().regex(/^cs_[a-zA-Z0-9_]+$/)}).safeParse(await req.json());if(!body.success)return NextResponse.json({error:'Invalid checkout.'},{status:400});const stripe=passStripe();await fulfillRetakePass(await stripe.checkout.sessions.retrieve(body.data.sessionId),stripe,user.id);return NextResponse.json({confirmed:true})}catch{return NextResponse.json({error:'Payment confirmation is pending or unavailable. Retry after payment completes; contact support if you were charged.'},{status:409})}}
