import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import { loopProperties } from '@/lib/learning/distinctions'
import { approvedContent } from '@/lib/learning/server'
const input = z.object({ questionId: z.string().uuid(), userAnswer: z.enum(['A','B','C','D']) })
export async function POST(req: NextRequest) {
 try {
  const db = createClient(), {data:{user},error} = await db.auth.getUser()
  if(error || !user) return NextResponse.json({error:'Unauthorized'},{status:401})
  if(!(await getEntitlementForUser(user.id)).hasAccess) return NextResponse.json({error:'Payment required'},{status:402})
  const body=input.safeParse(await req.json().catch(()=>null))
  if(!body.success) return NextResponse.json({error:'Invalid question or answer'},{status:400})
  const {data:q}=await db.from('quiz_questions').select('id,clinical_content_id,quiz_sessions!inner(user_id)').eq('id',body.data.questionId).eq('quiz_sessions.user_id',user.id).maybeSingle()
  if(!q) return NextResponse.json({error:'Question not found'},{status:404})
  const reviewed = q.clinical_content_id ? (await approvedContent(q.clinical_content_id))[0] : null
  if(q.clinical_content_id && !reviewed) return NextResponse.json({error:'This question was withdrawn for review. Please start a new session.'},{status:409})
  const {data:answer,error:saveError}=await db.rpc('record_quiz_answer',{p_question_id:body.data.questionId,p_answer:body.data.userAnswer})
  if(saveError || !answer) return NextResponse.json({error:'Could not save your answer. Please try again.'},{status:500})
  const {source_chunk_text, ...safeAnswer}=answer
  return NextResponse.json({...safeAnswer, sources: reviewed?.packet.references || [], learning: {...loopProperties(answer,answer.session_id), retry_eligible: answer.learning_attempt === 1 && !answer.is_correct && answer.quiz_mode !== 'retest'}})
 } catch { return NextResponse.json({error:'Could not save your answer. Please try again.'},{status:500}) }
}
