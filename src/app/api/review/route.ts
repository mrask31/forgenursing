import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import { approvedContent, learningAdmin } from '@/lib/learning/server'
import { sourceCheckedEnabled, sourceCheckedRpc } from '@/lib/learning/source-checked-server'

async function authorize() {
 const {data:{user},error}=await createClient().auth.getUser()
 if(error || !user) return {error:NextResponse.json({error:'Unauthorized'},{status:401})}
 if(!(await getEntitlementForUser(user.id)).hasAccess) return {error:NextResponse.json({error:'Payment required'},{status:402})}
 return {user}
}
export async function GET() {
 try {
  const auth=await authorize();if(auth.error)return auth.error
  const db=learningAdmin(), bank=await approvedContent(), ids=bank.map(c=>c.id)
  const source = sourceCheckedEnabled() ? await sourceCheckedRpc('source_checked_review_status_anytime',{p_user_id:auth.user!.id}) : null
  if(source?.error) throw source.error
  const sourceStatus = source?.data || {available:false,due:[],next_due_at:null,exhausted_count:0}
  if(!ids.length) return NextResponse.json(sourceStatus)
  const {data,error}=await db.from('learning_review_queue').select('id,distinction_id,due_at,review_round').eq('user_id',auth.user!.id).eq('status','scheduled').in('clinical_content_id',ids).order('due_at',{ascending:true}).limit(1000)
  if(error) throw error
  const now=Date.now(), due=(data||[]).filter(q=>Date.parse(q.due_at)<=now)
  const pending=[...(data||[]).map(q=>({...q,content_kind:'clinical'})),...(sourceStatus.pending||sourceStatus.due)].sort((a,b)=>Date.parse(a.due_at)-Date.parse(b.due_at))
  const next = [(data||[]).find(q=>Date.parse(q.due_at)>now)?.due_at,sourceStatus.next_due_at].filter(Boolean).sort()
  return NextResponse.json({available:true,pending,pending_count:(data||[]).length+(sourceStatus.pending_count??sourceStatus.due.length),due:[...due,...sourceStatus.due].sort((a,b)=>Date.parse(a.due_at)-Date.parse(b.due_at)),next_due_at:next[0] || null,exhausted_count:sourceStatus.exhausted_count})
 } catch {return NextResponse.json({error:'Your review queue could not load. Please retry.'},{status:503})}
}
const bodySchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('start'),queue_id:z.string().uuid(),content_kind:z.enum(['source_checked','clinical']).optional()}),
 z.object({action:z.literal('answer'),attempt_id:z.string().uuid(),answer:z.enum(['A','B','C','D']),content_kind:z.enum(['source_checked','clinical']).optional()})
])
export async function POST(req:NextRequest) {
 try {
  const auth=await authorize();if(auth.error)return auth.error
  const parsed=bodySchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success)return NextResponse.json({error:'Invalid review request'},{status:400})
  const body=parsed.data, db=learningAdmin(), userId=auth.user!.id
  if(body.content_kind==='source_checked') {
   if(!sourceCheckedEnabled()) return NextResponse.json({error:'This review is temporarily unavailable.'},{status:409})
   const {data,error}=body.action==='start'
    ? await sourceCheckedRpc('start_source_checked_review_anytime',{p_user_id:userId,p_queue_id:body.queue_id})
    : await sourceCheckedRpc('answer_source_checked_review_anytime',{p_user_id:userId,p_attempt_id:body.attempt_id,p_answer:body.answer})
   if(error || !data) return NextResponse.json({error:body.action==='start'?'This review or its content is unavailable.':'Your review could not be saved. Please retry.'},{status:409})
   return NextResponse.json(data)
  }
  if(body.action==='answer') {
   const {data,error}=await db.rpc('answer_scheduled_review_anytime',{p_user_id:userId,p_attempt_id:body.attempt_id,p_answer:body.answer})
   if(error || !data) return NextResponse.json({error:'This review is unavailable or could not be saved. Please reload your queue.'},{status:409})
   return NextResponse.json(data)
  }
  const {data:queue,error}=await db.from('learning_review_queue').select('*').eq('id',body.queue_id).eq('user_id',userId).eq('status','scheduled').maybeSingle()
  if(error) throw error
  if(!queue)return NextResponse.json({error:'This review is unavailable.'},{status:404})
  const content=(await approvedContent(queue.clinical_content_id))[0], item=content?.packet.reviews[queue.review_round]
  if(!item)return NextResponse.json({error:'This question is unavailable while its content is reviewed.'},{status:409})
  // Unique (queue,round) makes repeated taps/reloads resume the same question.
  const {error:insertError}=await db.from('learning_review_attempts').upsert({queue_id:queue.id,user_id:userId,review_round:queue.review_round},{onConflict:'queue_id,review_round',ignoreDuplicates:true})
  if(insertError)throw insertError
  const {data:attempt,error:fetchError}=await db.from('learning_review_attempts').select('id').eq('queue_id',queue.id).eq('review_round',queue.review_round).eq('user_id',userId).single()
  if(fetchError)throw fetchError
  return NextResponse.json({question:{id:attempt!.id,question_stem:item.question_stem,options:item.options},review_round:queue.review_round+1})
 } catch {return NextResponse.json({error:'Could not load your review. Please try again.'},{status:503})}
}
