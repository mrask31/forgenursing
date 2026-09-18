import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readRetakePlan, retakePlanSchema } from '@/lib/retake-plan'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: check, error: checkError } = await supabase.from('answer_trap_sessions')
    .select('id, score, total_questions, detected_trap, completed_at')
    .eq('user_id', user.id).not('completed_at', 'is', null)
    .order('completed_at', { ascending: false }).limit(1).maybeSingle()
  if (checkError) return NextResponse.json({ error: 'Could not load your saved check. Please retry.' }, { status: 503 })
  return NextResponse.json({ plan: readRetakePlan(user.user_metadata?.retake_plan), check })
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const parsed = retakePlanSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Check your plan details and try again.' }, { status: 400 })
  // Preferences only: user metadata must never confer access or privileges.
  const { error: saveError } = await supabase.auth.updateUser({ data: { retake_plan: parsed.data } })
  if (saveError) return NextResponse.json({ error: 'Could not save your plan. Please retry.' }, { status: 503 })
  return NextResponse.json({ plan: parsed.data })
}
