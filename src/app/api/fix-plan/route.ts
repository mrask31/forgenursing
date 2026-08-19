import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'

const MIN_ATTEMPTS_FOR_PERSONAL_PLAN = 5

type PatternStats = {
  mistake_type: string
  attempted: number
  correct: number
  missed: number
  accuracy: number
  last_practiced_at: string | null
}

function fallbackMistakeType(category?: string | null) {
  if (category === 'Psychosocial Integrity') return 'Therapeutic communication'
  if (category === 'Pharmacological Therapies') return 'Medication reasoning'
  if (category === 'Safety and Infection Control') return 'Safety / immediate risk'
  if (category === 'Delegation') return 'Delegation / scope'
  if (category === 'Reduction of Risk Potential') return 'Lab / diagnostic interpretation'
  if (category === 'Management of Care' || category === 'Priority Setting') return 'Priority vs. true answer'
  if (category === 'Health Promotion and Maintenance') return 'Patient education'
  if (category === 'Physiological Adaptation') return 'Assessment vs. intervention'
  return 'Clinical judgment pattern'
}

function accuracy(correct: number, attempted: number) {
  if (!attempted) return 0
  return Math.round((correct / attempted) * 100)
}

function explainFocus(mistakeType: string) {
  if (mistakeType.includes('Assessment')) return 'Practice deciding when to assess first versus when the question already gives enough data to act.'
  if (mistakeType.includes('Priority')) return 'Practice choosing which answer is safest and first when more than one option sounds clinically true.'
  if (mistakeType.includes('Safety')) return 'Practice catching the answer that prevents harm or reduces immediate risk before anything else.'
  if (mistakeType.includes('Medication')) return 'Practice connecting medication cues to effects, adverse effects, contraindications, and safety risks.'
  if (mistakeType.includes('Therapeutic')) return 'Practice responding to feelings before teaching, explaining, or reassuring.'
  if (mistakeType.includes('Delegation')) return 'Practice matching tasks to scope, client stability, and RN accountability.'
  if (mistakeType.includes('Lab')) return 'Practice connecting abnormal data to the clinical risk it creates.'
  if (mistakeType.includes('Patient education')) return 'Practice choosing the teaching point that keeps the patient safe after discharge or self-care.'
  return 'Practice the missed-answer pattern Forge is seeing in your recent diagnostic answers.'
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entitlement = await getEntitlementForUser(user.id)
    if (!entitlement.hasAccess) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    const { data: rows, error } = await supabase
      .from('quiz_questions')
      .select('id, nclex_category, mistake_type, is_correct, answered_at, created_at, quiz_sessions!inner(user_id)')
      .eq('quiz_sessions.user_id', user.id)
      .not('answered_at', 'is', null)
      .order('answered_at', { ascending: false })
      .limit(250)

    if (error) {
      console.error('[Fix Plan] Query error:', error)
      return NextResponse.json({ error: 'Failed to build retake fix plan' }, { status: 500 })
    }

    const answered = rows ?? []
    const totalAttempted = answered.length
    const map = new Map<string, PatternStats>()

    for (const row of answered as any[]) {
      const mistakeType = row.mistake_type || fallbackMistakeType(row.nclex_category)
      const existing = map.get(mistakeType) ?? {
        mistake_type: mistakeType,
        attempted: 0,
        correct: 0,
        missed: 0,
        accuracy: 0,
        last_practiced_at: null,
      }

      existing.attempted += 1
      if (row.is_correct === true) existing.correct += 1
      if (row.is_correct === false) existing.missed += 1
      if (!existing.last_practiced_at || (row.answered_at && new Date(row.answered_at) > new Date(existing.last_practiced_at))) {
        existing.last_practiced_at = row.answered_at
      }
      existing.accuracy = accuracy(existing.correct, existing.attempted)
      map.set(mistakeType, existing)
    }

    const patterns = Array.from(map.values())
    const eligible = patterns.filter(pattern => pattern.attempted >= 2)
    const topFocus = eligible.length > 0
      ? eligible.sort((a, b) => {
          if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy
          return b.missed - a.missed
        })[0]
      : patterns.sort((a, b) => b.missed - a.missed)[0] ?? null

    const hasPersonalPlan = totalAttempted >= MIN_ATTEMPTS_FOR_PERSONAL_PLAN && !!topFocus
    const focus = hasPersonalPlan ? topFocus!.mistake_type : 'Find your first retake risk pattern'

    const steps = hasPersonalPlan
      ? [
          {
            title: `Train ${focus}`,
            body: explainFocus(focus),
            action: 'Start a 3-question focused pattern drill',
          },
          {
            title: 'Review one miss with an Answer Autopsy',
            body: 'After a missed answer, look for why your choice felt right and what cue made it lose.',
            action: 'Use the Answer Autopsy Coach after a miss',
          },
          {
            title: 'Retest the same pattern',
            body: 'Do not just move to a new topic. Retest the same reasoning pattern so Forge can update your map.',
            action: 'Retest this pattern',
          },
        ]
      : [
          {
            title: 'Take a 5-question retake diagnostic',
            body: 'Forge needs a few answers to identify the missed-answer pattern to train first.',
            action: 'Start your diagnostic',
          },
          {
            title: 'Read each Answer Autopsy',
            body: 'For every miss, focus on the cue, the tempting answer, and the decision rule — not just the correct option.',
            action: 'Review the autopsy after each question',
          },
          {
            title: 'Build your first Mistake Pattern Map',
            body: 'Your answers create the first version of your retake recovery map.',
            action: 'See what Forge noticed',
          },
        ]

    return NextResponse.json({
      has_personal_plan: hasPersonalPlan,
      total_attempted: totalAttempted,
      focus,
      focus_explanation: hasPersonalPlan ? explainFocus(focus) : 'Take a short diagnostic so Forge can learn how you answer and find what to train first before your next attempt.',
      cta_label: hasPersonalPlan ? `Train ${focus}` : 'Start 5-Question Retake Diagnostic',
      cta_href: '/quiz',
      steps,
      top_pattern: topFocus,
    })
  } catch (error) {
    console.error('[Fix Plan] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
