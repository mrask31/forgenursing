'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ClipboardCheck, FileSearch, Loader2, Map as MapIcon, Target } from 'lucide-react'

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

interface MistakeBreakdown {
  mistakeType: string
  missed: number
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms)
    promise.then(resolve).catch(reject).finally(() => clearTimeout(timer))
  })
}

function fallbackMistakeType(category: string | null | undefined) {
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

function patternExplanation(mistakeType: string) {
  if (mistakeType.includes('Priority')) return 'You may be choosing an answer that is true, but not the safest or highest-priority first action.'
  if (mistakeType.includes('Safety')) return 'You may be missing the option that prevents harm or reduces immediate risk.'
  if (mistakeType.includes('Assessment')) return 'You may be mixing up when to assess first versus when the situation already requires action.'
  if (mistakeType.includes('Therapeutic')) return 'You may be teaching, explaining, or reassuring before acknowledging the client’s concern.'
  if (mistakeType.includes('Delegation')) return 'You may need to separate RN responsibility from tasks that can be safely delegated.'
  if (mistakeType.includes('Medication')) return 'You may be missing a medication safety cue, adverse effect, contraindication, or expected outcome.'
  if (mistakeType.includes('Lab')) return 'You may be missing the abnormal data point that changes the priority.'
  return 'This is a missed-answer pattern worth reviewing before your next retake practice set.'
}

export default function QuizResultsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)
  const [fixingQuestionId, setFixingQuestionId] = useState<string | null>(null)
  const [fixWeaknessError, setFixWeaknessError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setLoadError('Missing diagnostic session.')
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const response = await withTimeout(
          fetch(`/api/quiz/results?sessionId=${encodeURIComponent(sessionId)}`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          10000,
          'RESULTS_TIMEOUT'
        )

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load recovery report')
        }

        const data = await response.json()
        setSession(data.session)
        setQuestions(data.questions ?? [])
        try {
          const posthog = require('posthog-js').default
          posthog.capture('retake_recovery_report_viewed', {
            session_id: sessionId,
            quiz_mode: data.session?.quiz_mode ?? null,
            score: data.session?.score ?? null,
            total_questions: (data.questions ?? []).length,
            missed_count: (data.questions ?? []).filter((q: QuizQuestion) => !q.is_correct && q.user_answer).length,
          })
        } catch {}
      } catch (error: any) {
        console.error('[QuizResults] Load error:', error)
        setLoadError(error?.message || 'Failed to load recovery report')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FB]">
        <div className="text-center text-gray-500">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#0D8F9C]" />
          Loading recovery report...
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-[#F7F9FB]">
        <p className="text-gray-600">{loadError}</p>
        <button onClick={() => window.location.reload()} className="rounded-lg text-white font-semibold px-5 py-3" style={{ backgroundColor: '#0D8F9C' }}>
          Try Again
        </button>
        <Link href="/quiz" className="underline" style={{ color: '#0D8F9C' }}>Start a new diagnostic</Link>
      </div>
    )
  }

  if (!session || questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F9FB]">
        <p className="text-gray-500">No recovery report found.</p>
        <Link href="/quiz" className="underline" style={{ color: '#0D8F9C' }}>Start a new diagnostic</Link>
      </div>
    )
  }

  const total = questions.length
  const missed = questions.filter(q => !q.is_correct && q.user_answer)
  const correct = questions.filter(q => q.is_correct).length
  const isTargetedDrill = session.quiz_mode === 'targeted_drill'
  const isDiagnostic = session.quiz_mode === 'diagnostic'
  const targetPattern = session.target_mistake_type || questions[0]?.mistake_type || null

  const mistakeMap = new Map<string, number>()
  missed.forEach(q => {
    const mistakeType = q.mistake_type || fallbackMistakeType(q.nclex_category)
    mistakeMap.set(mistakeType, (mistakeMap.get(mistakeType) ?? 0) + 1)
  })
  const mistakeBreakdown: MistakeBreakdown[] = Array.from(mistakeMap.entries())
    .map(([mistakeType, missed]) => ({ mistakeType, missed }))
    .sort((a, b) => b.missed - a.missed)
  const topMistake = mistakeBreakdown[0]

  const handleOpenCoach = async (q: QuizQuestion) => {
    if (!sessionId || fixingQuestionId) return
    setFixWeaknessError(null)
    setFixingQuestionId(q.id)

    try {
      const mistakeType = q.mistake_type || fallbackMistakeType(q.nclex_category)
      try {
        const posthog = require('posthog-js').default
        posthog.capture('answer_autopsy_coach_clicked', {
          session_id: sessionId,
          question_id: q.id,
          question_index: q.question_index,
          nclex_category: q.nclex_category,
          source: 'recovery_report',
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
        body: JSON.stringify({ quizSessionId: sessionId, questionId: q.id }),
      })

      if (!response.ok) {
        setFixWeaknessError('Could not open the Answer Autopsy Coach. Please try again.')
        return
      }

      const data = await response.json()
      if (!data.chatId) {
        setFixWeaknessError('Could not open the Answer Autopsy Coach. Please try again.')
        return
      }

      router.push(`/tutor?sessionId=${data.chatId}`)
    } catch (error) {
      console.error('[QuizResults] Autopsy coach error:', error)
      setFixWeaknessError('Could not open the Answer Autopsy Coach. Please try again.')
    } finally {
      setFixingQuestionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] px-4 py-6 pb-36 sm:px-6 lg:px-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
          <p className="inline-flex rounded-full bg-[#E0F4F6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">
            Retake Recovery Report
          </p>
          <h1 className="mt-4 text-3xl font-bold" style={{ color: '#0B2545' }}>
            {isTargetedDrill ? 'Focused pattern drill complete' : isDiagnostic ? 'Baseline retake diagnostic complete' : 'Diagnostic set complete'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1E2D3D]/70">
            This report is not a pass prediction. It shows what your answers suggest you should fix before the next NCLEX attempt.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Questions answered" value={String(total)} body="More answers sharpen your pattern map." />
          <MetricCard label="Correct in this set" value={`${correct}/${total}`} body="Useful, but the pattern matters more than the score." />
          <MetricCard label="Misses to analyze" value={String(missed.length)} body="Each miss becomes an Answer Autopsy signal." />
        </section>

        <section className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">What Forge learned</p>
              <h2 className="mt-2 text-2xl font-bold" style={{ color: '#0B2545' }}>
                {topMistake ? topMistake.mistakeType : targetPattern || 'No major miss pattern in this set'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">
                {topMistake
                  ? patternExplanation(topMistake.mistakeType)
                  : isTargetedDrill
                    ? `This set gave Forge more signal on ${targetPattern || 'your current focus'}.`
                    : 'You answered this set without enough repeated misses to identify a dominant pattern yet.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/readiness')}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B2545] px-5 py-3 text-sm font-bold text-white"
            >
              <MapIcon className="h-4 w-4" />
              View Mistake Pattern Map
            </button>
          </div>
        </section>

        {mistakeBreakdown.length > 0 && (
          <section className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">Miss patterns from this set</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {mistakeBreakdown.map((item) => (
                <div key={item.mistakeType} className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold" style={{ color: '#0B2545' }}>{item.mistakeType}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#1E2D3D]/60">{patternExplanation(item.mistakeType)}</p>
                    </div>
                    <span className="rounded-full bg-[#E0F4F6] px-2 py-1 text-xs font-bold text-[#0D8F9C]">
                      {item.missed} miss{item.missed === 1 ? '' : 'es'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">Answer Autopsies</p>
          <div className="mt-4 space-y-3">
            {missed.length === 0 ? (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p className="font-bold text-green-900">No missed answers in this set.</p>
                <p className="mt-1 text-sm text-green-800">Keep building the map with another diagnostic set.</p>
              </div>
            ) : (
              missed.map((q) => {
                const mistakeType = q.mistake_type || fallbackMistakeType(q.nclex_category)
                const expanded = expandedQuestionId === q.id
                return (
                  <div key={q.id} className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E0F4F6] text-[#0D8F9C]">
                        <FileSearch className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold" style={{ color: '#0B2545' }}>Question {q.question_index + 1}: {mistakeType}</p>
                        <p className="mt-1 text-xs leading-5 text-[#1E2D3D]/60">{patternExplanation(mistakeType)}</p>
                        {expanded && (
                          <div className="mt-3 space-y-3 rounded-xl border border-[#DDE5EE] bg-white p-3 text-sm leading-6 text-[#1E2D3D]/75">
                            <p><span className="font-bold text-[#0B2545]">You picked:</span> {q.user_answer}</p>
                            <p><span className="font-bold text-[#0B2545]">Correct:</span> {q.correct_answer}</p>
                            {q.reasoning_trap && <p><span className="font-bold text-[#0B2545]">Trap:</span> {q.reasoning_trap}</p>}
                            {q.fix_instruction && <p><span className="font-bold text-[#0B2545]">Fix:</span> {q.fix_instruction}</p>}
                          </div>
                        )}
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setExpandedQuestionId(expanded ? null : q.id)}
                            className="min-h-[40px] rounded-lg border border-[#DDE5EE] bg-white px-3 py-2 text-xs font-bold text-[#0B2545]"
                          >
                            {expanded ? 'Hide autopsy' : 'View autopsy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCoach(q)}
                            disabled={fixingQuestionId === q.id}
                            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#0D8F9C] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                          >
                            {fixingQuestionId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                            Open Coach
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {fixWeaknessError && <p className="mt-3 text-xs text-red-600">{fixWeaknessError}</p>}
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => router.push('/quiz')}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-4 py-3 text-sm font-bold text-white"
          >
            <ClipboardCheck className="h-4 w-4" />
            Next Diagnostic
          </button>
          <button
            onClick={() => router.push('/readiness')}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#DDE5EE] bg-white px-4 py-3 text-sm font-bold text-[#0B2545]"
          >
            <MapIcon className="h-4 w-4" />
            Pattern Map
          </button>
          <button
            onClick={() => router.push('/entry')}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#DDE5EE] bg-white px-4 py-3 text-sm font-bold text-[#0B2545]"
          >
            Recovery Home
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, body }: { label: string; value: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: '#0B2545' }}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#1E2D3D]/60">{body}</p>
    </div>
  )
}
