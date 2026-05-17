'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/client'

interface QuizQuestion {
  id: string
  question_index: number
  question_stem: string
  options: { label: string; text: string }[]
  correct_answer: string
  user_answer: string | null
  is_correct: boolean | null
  rationale_correct: string
  rationale_incorrect: Record<string, string>
  nclex_category: string
  difficulty: number
  mistake_type?: string | null
  reasoning_trap?: string | null
  fix_instruction?: string | null
  retest_focus?: string | null
}

interface CategoryBreakdown {
  category: string
  correct: number
  total: number
}

interface MistakeBreakdown {
  mistakeType: string
  missed: number
}

function fallbackMistakeType(category: string | null | undefined) {
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

function patternExplanation(mistakeType: string) {
  switch (mistakeType) {
    case 'Priority-setting':
      return 'You may be choosing a reasonable action that helps later instead of the action that matters first.'
    case 'Safety':
      return 'You may be missing the choice that prevents harm or reduces immediate risk.'
    case 'Assessment-first':
      return 'You may be jumping to an intervention before gathering the data needed to act safely.'
    case 'Therapeutic communication':
      return 'You may be teaching, explaining, or reassuring before acknowledging the client’s concern.'
    case 'Delegation':
      return 'You may be missing scope of practice, client stability, or RN accountability cues.'
    case 'Medication reasoning':
      return 'You may be missing a medication safety cue, adverse effect, contraindication, or expected outcome.'
    case 'Lab / diagnostic interpretation':
      return 'You may be missing the abnormal data point that changes the priority.'
    case 'Patient education':
      return 'You may be missing the safest teaching priority for what the patient must do next.'
    default:
      return 'You missed a clinical judgment pattern worth reviewing before your next quiz.'
  }
}

export default function QuizResultsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [fixingQuestionId, setFixingQuestionId] = useState<string | null>(null)
  const [fixWeaknessError, setFixWeaknessError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const load = async () => {
      const supabase = getBrowserClient()

      const { data: sess } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      const { data: qs } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('question_index', { ascending: true })

      setSession(sess)
      setQuestions(qs ?? [])
      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading results...</p>
      </div>
    )
  }

  if (!session || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">No results found.</p>
        <Link href="/quiz" className="underline" style={{ color: '#0D8F9C' }}>Start a new quiz</Link>
      </div>
    )
  }

  const score = session.score ?? questions.filter(q => q.is_correct).length
  const total = questions.length
  const pct = Math.round((score / total) * 100)
  const missed = questions.filter(q => !q.is_correct && q.user_answer)

  const catMap = new Map<string, { correct: number; total: number }>()
  questions.forEach(q => {
    if (!q.nclex_category) return
    const entry = catMap.get(q.nclex_category) ?? { correct: 0, total: 0 }
    entry.total++
    if (q.is_correct) entry.correct++
    catMap.set(q.nclex_category, entry)
  })
  const categories: CategoryBreakdown[] = Array.from(catMap.entries()).map(
    ([category, { correct, total }]) => ({ category, correct, total })
  )

  const mistakeMap = new Map<string, number>()
  missed.forEach(q => {
    const mistakeType = q.mistake_type || fallbackMistakeType(q.nclex_category)
    mistakeMap.set(mistakeType, (mistakeMap.get(mistakeType) ?? 0) + 1)
  })
  const mistakeBreakdown: MistakeBreakdown[] = Array.from(mistakeMap.entries())
    .map(([mistakeType, missed]) => ({ mistakeType, missed }))
    .sort((a, b) => b.missed - a.missed)
  const topMistake = mistakeBreakdown[0]

  const handleFixWeakness = async (q: QuizQuestion) => {
    if (!sessionId || fixingQuestionId) return
    setFixWeaknessError(null)
    setFixingQuestionId(q.id)

    try {
      const mistakeType = q.mistake_type || fallbackMistakeType(q.nclex_category)
      try {
        const posthog = require('posthog-js').default
        posthog.capture('fix_weakness_clicked', {
          session_id: sessionId,
          question_id: q.id,
          question_index: q.question_index,
          nclex_category: q.nclex_category,
          source: 'results_screen',
          user_answer: q.user_answer,
          correct_answer: q.correct_answer,
          mistake_type: mistakeType,
          retest_focus: q.retest_focus ?? null,
        })
        posthog.capture('dig_deeper_clicked', {
          session_id: sessionId,
          question_id: q.id,
          question_index: q.question_index,
          nclex_category: q.nclex_category,
          source: 'results_screen',
          user_answer: q.user_answer,
          correct_answer: q.correct_answer,
          mistake_type: mistakeType,
          retest_focus: q.retest_focus ?? null,
        })
      } catch {}

      const response = await fetch('/api/quiz/dig-deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quizSessionId: sessionId,
          questionId: q.id,
        }),
      })

      if (!response.ok) {
        console.error('[QuizResults] Fix weakness handoff failed:', await response.text())
        setFixWeaknessError('Could not open tutor. Please try again.')
        return
      }

      const data = await response.json()
      if (!data.chatId) {
        setFixWeaknessError('Could not open tutor. Please try again.')
        return
      }

      router.push(`/tutor?sessionId=${data.chatId}`)
    } catch (error) {
      console.error('[QuizResults] Fix weakness error:', error)
      setFixWeaknessError('Could not open tutor. Please try again.')
    } finally {
      setFixingQuestionId(null)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-40 max-w-md mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="space-y-6 pb-24">
        <h1 className="text-2xl font-bold text-center" style={{ color: '#0B2545' }}>
          Quiz Complete! 🎉
        </h1>

        <div className="rounded-xl border border-gray-200 p-5 text-center space-y-3">
          <p className="text-4xl font-bold" style={{ color: '#0D8F9C' }}>
            {score} / {total}
          </p>
          <div className="w-full h-3 rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: '#0D8F9C' }}
            />
          </div>
          <p className="text-sm text-gray-500">{pct}%</p>
          <p className="text-[11px] leading-snug text-gray-400">
            Scores reflect AI-generated practice questions for study only and do not predict exam performance.
          </p>
        </div>

        {topMistake && (
          <div className="rounded-xl p-5 text-white space-y-3" style={{ backgroundColor: '#0B2545' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Your Clinical Judgment Pattern
            </p>
            <div>
              <p className="text-sm text-white/70">Top missed pattern</p>
              <p className="text-2xl font-bold">{topMistake.mistakeType}</p>
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              {patternExplanation(topMistake.mistakeType)}
            </p>
            <p className="text-xs text-white/50">
              Missed {topMistake.missed} question{topMistake.missed === 1 ? '' : 's'} in this pattern.
            </p>
          </div>
        )}

        {mistakeBreakdown.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold" style={{ color: '#0B2545' }}>Mistake Types to Fix</h2>
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              {mistakeBreakdown.map(item => (
                <div key={item.mistakeType} className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: '#0B2545' }}>{item.mistakeType}</span>
                  <span className="text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-500">
                    {item.missed} missed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold" style={{ color: '#0B2545' }}>Performance by Category</h2>
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              {categories.map(cat => {
                const catPct = Math.round((cat.correct / cat.total) * 100)
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#0B2545' }}>{cat.category}</span>
                      <span className="text-gray-500">{cat.correct}/{cat.total} {catPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${catPct}%`, backgroundColor: '#0D8F9C' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {fixWeaknessError && (
          <p className="text-xs text-red-600">{fixWeaknessError}</p>
        )}

        {missed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold" style={{ color: '#0B2545' }}>Missed Questions to Fix</h2>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              {missed.map(q => {
                const mistakeType = q.mistake_type || fallbackMistakeType(q.nclex_category)
                return (
                  <div key={q.id} className="p-4 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#0D8F9C' }}>
                        {mistakeType}
                      </p>
                      <p className="text-sm" style={{ color: '#0B2545' }}>
                        <span className="font-medium">Q{q.question_index + 1}</span> · {q.question_stem.slice(0, 80)}...
                      </p>
                    </div>

                    {reviewingId === q.id && (
                      <div className="rounded-lg p-3 text-sm space-y-2" style={{ backgroundColor: '#F9FAFB' }}>
                        <p><span className="font-medium">Your answer:</span> {q.user_answer}</p>
                        <p><span className="font-medium">Correct:</span> {q.correct_answer}</p>
                        {q.reasoning_trap && <p><span className="font-medium">Trap:</span> {q.reasoning_trap}</p>}
                        {q.fix_instruction && <p><span className="font-medium">Fix:</span> {q.fix_instruction}</p>}
                        <p className="text-gray-600">{q.rationale_correct}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewingId(reviewingId === q.id ? null : q.id)}
                        className="px-3 py-1.5 rounded text-sm font-medium border"
                        style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
                      >
                        {reviewingId === q.id ? 'Hide' : 'Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFixWeakness(q)}
                        disabled={fixingQuestionId === q.id}
                        className="px-3 py-1.5 rounded text-sm font-medium text-white flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#0B2545', minHeight: '44px' }}
                      >
                        {fixingQuestionId === q.id ? 'Opening…' : 'Fix Weakness →'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push('/quiz')}
            className="w-full rounded-lg text-white font-semibold text-base"
            style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
          >
            Start New Quiz
          </button>
          <button
            onClick={() => router.push('/entry')}
            className="w-full rounded-lg font-semibold text-base border-2"
            style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '56px' }}
          >
            Back to Study Options
          </button>
        </div>
      </div>
    </div>
  )
}
