import {passRequestAllowed} from '@/lib/retake-pass-server'
import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {getRetakePass,passAudience} from '@/lib/retake-pass-server'
import {learningAdmin} from '@/lib/learning/server'
export async function POST(req:Request){if(!passRequestAllowed(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});try{const {data:{user}}=await createClient().auth.getUser();if(!user)return NextResponse.json({error:'Please sign in.'},{status:401});const pass=await getRetakePass(user.id);if(!pass?.extensionAvailable)return NextResponse.json({error:'Your one free extension is not available.'},{status:409});const {error}=await learningAdmin().rpc('extend_retake_pass',{p_user_id:user.id,p_audience:passAudience(),p_pass_id:pass.id});if(error)return NextResponse.json({error:'The extension was already used or is unavailable. Reload your pass details.'},{status:409});return NextResponse.json({extended:true})}catch{return NextResponse.json({error:'Extension could not be saved. Please retry.'},{status:503})}}
