import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {getRetakePass} from '@/lib/retake-pass-server'
export async function GET(){try{const {data:{user}}=await createClient().auth.getUser();if(!user)return NextResponse.json({error:'Please sign in.'},{status:401});const p=await getRetakePass(user.id);return NextResponse.json({pass:p?{id:p.id,purchased_at:p.purchased_at,access_until:p.access_until,extension_used_at:p.extension_used_at,active:p.active,extensionAvailable:p.extensionAvailable}:null},{headers:{'Cache-Control':'private, no-store'}})}catch{return NextResponse.json({error:'Pass details could not load.'},{status:503})}}
