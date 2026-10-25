import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'
import { contentOnHold, contentHoldPayload } from '@/lib/learning/content-hold'
import { sourceCheckedContent } from '@/lib/learning/source-checked-server'
import { approvedContent } from '@/lib/learning/server'
import { loopProperties } from '@/lib/learning/distinctions'

export const dynamic = 'force-dynamic'
const fields = 'id,session_id,question_index,question_stem,options,nclex_category,difficulty,answered_at,user_answer,is_correct,correct_answer,rationale_correct,rationale_incorrect,mistake_type,reasoning_trap,fix_instruction,retest_focus,key_cue,why_correct_short,why_wrong_short,one_line_fix,distinction_id,source_question_id,learning_attempt,clinical_content_id,source_checked_content_id'
export async function GET(req: NextRequest) {
 const headers = { 'Cache-Control': 'private, no-store' }
 try {
  const db = createClient(), { data: { user }, error } = await db.auth.getUser()
  if (error || !user) return NextResponse.json({error:'Unauthorized'},{status:401,headers})
  if (!(await getEntitlementForUser(user.id)).hasAccess) return NextResponse.json({error:'Payment required'},{status:402,headers})
  const id = z.string().uuid().safeParse(req.nextUrl.searchParams.get('questionId'))
  if (!id.success) return NextResponse.json({error:'Invalid question'},{status:400,headers})
  const {data:q,error:readError} = await db.from('quiz_questions').select(`${fields},quiz_sessions!inner(user_id,status,score,current_question_index,quiz_mode)`).eq('id',id.data).eq('quiz_sessions.user_id',user.id).maybeSingle()
  if (readError) throw new Error('Feedback unavailable')
  if (!q) return NextResponse.json({error:'Question not found'},{status:404,headers})
  if (!q.answered_at || !q.user_answer) return NextResponse.json({error:'Answer this question before viewing feedback.'},{status:409,headers})
  if (contentOnHold(q)) return NextResponse.json(contentHoldPayload(),{status:409,headers})
  const source = q.source_checked_content_id ? await sourceCheckedContent(q.source_checked_content_id) : null
  const clinical = q.clinical_content_id ? (await approvedContent(q.clinical_content_id))[0] : null
  if ((q.source_checked_content_id && !source) || (q.clinical_content_id && !clinical)) return NextResponse.json({error:'This question is unavailable while its content is checked.'},{status:409,headers})
  const {quiz_sessions, ...question} = q
  const session = (Array.isArray(quiz_sessions) ? quiz_sessions[0] : quiz_sessions) as {status:string;score:number;current_question_index:number;quiz_mode:string}
  return NextResponse.json({question,answer:{...question,session_complete:session.status==='completed',score:session.score,total_answered:session.current_question_index,sources:source?.packet.references || clinical?.packet.references || [],learning:{...loopProperties(question,q.session_id),retry_eligible:q.learning_attempt===1 && !q.is_correct && session.quiz_mode!=='retest'}}},{headers})
 } catch { return NextResponse.json({error:'Saved feedback could not load. Please retry.'},{status:503,headers}) }
}
