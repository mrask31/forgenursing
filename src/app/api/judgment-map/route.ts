import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEntitlementForUser } from '@/lib/entitlement'

const MIN_ATTEMPTS_FOR_RECOMMENDATION = 5

const POSITIVE_STAGE_ORDER = [
  'Building',
  'Improving',
  'Getting Stronger',
  'Sharpening',
  'Ready Habits Forming',
] as const

type ConfidenceStage = typeof POSITIVE_STAGE_ORDER[number]

type MistakeTypeRow = {
  mistake_type: string
  attempted: number
  correct: number
  missed: number
  accuracy: number
  last_practiced_at: string | null
  trend: 'building' | 'improving' | 'steady'
}

function fallbackMistakeType(category?: string | null) {
  if (category === 'Psychosocial Integrity') return 'Therapeutic communication'
  if (category === 'Pharmacological Therapies') return 'Medication reasoning'
  if (category === 'Safety and Infection Control') return 'Safety'
  if (category === 'Delegation') return 'Delegation'
  if (category === 'Reduction of Risk Potential') return 'Lab / diagnostic interpretation'
  if (category === 'Management of Care' || category === 'Priority Setting') return 'Priority-setting'
  if (category === 'Health Promotion and Maintenance') return 'Patient education'
  if (category === 'Physiological Adaptation') return 'Assessment-first'
  return 'Clinical judgment'
}

function roundAccuracy(correct: number, attempted: number) {
  if (!attempted) return 0
  return Math.round((correct / attempted) * 100)
}

function explainPattern(mistakeType: string) {
  switch (mistakeType) {
    case 'Priority-setting':
      return 'You are training which nursing action matters first when more than one answer sounds reasonable.'
    case 'Safety':
      return 'You are training yourself to catch the answer that prevents harm before anything else.'
    case 'Assessment-first':
      return 'You are training when to gather more data before jumping into an intervention.'
    case 'Therapeutic communication':
      return 'You are training when to acknowledge feelings before teaching, explaining, or reassuring.'
    case 'Delegation':
      return 'You are training scope of practice, client stability, and RN accountability.'
    case 'Medication reasoning':
      return 'You are training medication safety cues, adverse effects, expected outcomes, and contraindications.'
    case 'Lab / diagnostic interpretation':
      return 'You are training which abnormal data point changes the nursing priority.'
    case 'Patient education':
      return 'You are training what the patient needs to understand to stay safe.'
    default:
      return 'You are training the clinical judgment pattern behind your missed answers.'
  }
}

function chooseConfidenceStage(totalAttempted: number, correctedPatterns: number, overallAccuracy: number): ConfidenceStage {
  if (totalAttempted < 5) return 'Building'
  if (correctedPatterns >= 5 && overallAccuracy >= 75) return 'Ready Habits Forming'
  if (correctedPatterns >= 3 && overallAccuracy >= 65) return 'Sharpening'
  if (correctedPatterns >= 1 || overallAccuracy >= 55) return 'Getting Stronger'
  return 'Improving'
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
      .select('id, question_index, nclex_category, mistake_type, retest_focus, is_correct, user_answer, answered_at, created_at, quiz_sessions!inner(user_id, created_at, status)')
      .eq('quiz_sessions.user_id', user.id)
      .not('answered_at', 'is', null)
      .order('answered_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[Judgment Map] Query error:', error)
      return NextResponse.json({ error: 'Failed to load judgment map' }, { status: 500 })
    }

    const answered = rows ?? []
    const totalAttempted = answered.length
    const totalCorrect = answered.filter((row: any) => row.is_correct === true).length
    const overallAccuracy = roundAccuracy(totalCorrect, totalAttempted)

    const map = new Map<string, {
      attempted: number
      correct: number
      missed: number
      last_practiced_at: string | null
      retest_focus_counts: Map<string, number>
      recent: Array<{ is_correct: boolean | null; answered_at: string | null }>
    }>()

    for (const row of answered as any[]) {
      const mistakeType = row.mistake_type || fallbackMistakeType(row.nclex_category)
      const entry = map.get(mistakeType) ?? {
        attempted: 0,
        correct: 0,
        missed: 0,
        last_practiced_at: null,
        retest_focus_counts: new Map<string, number>(),
        recent: [],
      }

      entry.attempted += 1
      if (row.is_correct === true) entry.correct += 1
      if (row.is_correct === false) entry.missed += 1

      if (!entry.last_practiced_at || (row.answered_at && new Date(row.answered_at) > new Date(entry.last_practiced_at))) {
        entry.last_practiced_at = row.answered_at
      }

      if (row.retest_focus) {
        entry.retest_focus_counts.set(row.retest_focus, (entry.retest_focus_counts.get(row.retest_focus) ?? 0) + 1)
      }

      entry.recent.push({ is_correct: row.is_correct, answered_at: row.answered_at })
      map.set(mistakeType, entry)
    }

    const mistakeTypes: MistakeTypeRow[] = Array.from(map.entries()).map(([mistake_type, entry]) => {
      const accuracy = roundAccuracy(entry.correct, entry.attempted)
      const recentSorted = entry.recent
        .filter(item => item.answered_at)
        .sort((a, b) => new Date(b.answered_at!).getTime() - new Date(a.answered_at!).getTime())
      const recentThree = recentSorted.slice(0, 3)
      const earlierThree = recentSorted.slice(3, 6)
      const recentAccuracy = roundAccuracy(recentThree.filter(item => item.is_correct).length, recentThree.length)
      const earlierAccuracy = roundAccuracy(earlierThree.filter(item => item.is_correct).length, earlierThree.length)
      const trend = recentThree.length >= 2 && earlierThree.length >= 2 && recentAccuracy > earlierAccuracy
        ? 'improving'
        : accuracy >= 70
          ? 'steady'
          : 'building'

      return {
        mistake_type,
        attempted: entry.attempted,
        correct: entry.correct,
        missed: entry.missed,
        accuracy,
        last_practiced_at: entry.last_practiced_at,
        trend,
      }
    }).sort((a, b) => {
      if (b.missed !== a.missed) return b.missed - a.missed
      return a.accuracy - b.accuracy
    })

    const eligibleWeaknesses = mistakeTypes.filter(item => item.attempted >= 2)
    const topWeakness = eligibleWeaknesses.length > 0
      ? [...eligibleWeaknesses].sort((a, b) => {
          if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy
          return b.missed - a.missed
        })[0]
      : mistakeTypes[0] ?? null

    const strongestArea = mistakeTypes.length > 0
      ? [...mistakeTypes].sort((a, b) => {
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
          return b.attempted - a.attempted
        })[0]
      : null

    const correctedPatterns = mistakeTypes.filter(item => item.trend === 'improving' || item.accuracy >= 70).length
    const confidenceStage = chooseConfidenceStage(totalAttempted, correctedPatterns, overallAccuracy)
    const enoughData = totalAttempted >= MIN_ATTEMPTS_FOR_RECOMMENDATION

    const recommendedMistakeType = enoughData && topWeakness ? topWeakness.mistake_type : null
    const recommendation = enoughData && topWeakness
      ? {
          type: 'next_focus',
          title: `Train ${topWeakness.mistake_type}`,
          message: `${topWeakness.mistake_type} is your next growth pattern. A short drill will help Forge strengthen this area.`,
          mistake_type: topWeakness.mistake_type,
          explanation: explainPattern(topWeakness.mistake_type),
        }
      : {
          type: 'baseline',
          title: 'Build your first pattern map',
          message: 'Answer a few more questions so Forge can learn how you miss and recommend the right practice.',
          mistake_type: null,
          explanation: 'Every answered question helps Forge understand what to train next.',
        }

    return NextResponse.json({
      summary: {
        total_attempted: totalAttempted,
        total_correct: totalCorrect,
        overall_accuracy: overallAccuracy,
        enough_data: enoughData,
      },
      confidence_builder: {
        stage: confidenceStage,
        message: enoughData
          ? `Forge is learning your patterns and turning them into focused practice.`
          : `You are building your first clinical judgment pattern map.`,
        positive_signals: [
          totalAttempted > 0 ? `${totalAttempted} question${totalAttempted === 1 ? '' : 's'} answered` : 'Ready to start building your map',
          correctedPatterns > 0 ? `${correctedPatterns} pattern${correctedPatterns === 1 ? '' : 's'} showing progress` : 'Every missed question helps Forge choose what to train next',
          topWeakness ? `${topWeakness.mistake_type} identified as a next focus` : 'Forge will identify your next focus soon',
        ],
      },
      mistake_types: mistakeTypes,
      top_weakness: topWeakness
        ? {
            ...topWeakness,
            explanation: explainPattern(topWeakness.mistake_type),
          }
        : null,
      strongest_area: strongestArea
        ? {
            ...strongestArea,
            explanation: explainPattern(strongestArea.mistake_type),
          }
        : null,
      recommendation,
      recommended_mistake_type: recommendedMistakeType,
    })
  } catch (error) {
    console.error('[Judgment Map] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
