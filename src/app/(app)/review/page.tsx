import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewClient from './ReviewClient'
export const dynamic = 'force-dynamic'
export default async function ReviewPage(){
 const {data:{user}}=await createClient().auth.getUser()
 if(!user) redirect('/login?next=/review')
 return <ReviewClient />
}
