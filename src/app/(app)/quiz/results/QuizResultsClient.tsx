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
}

interface CategoryBreakdown {
  category: string
  correct: number
  total: number
}

export default function QuizResultsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

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

  // Category breakdown
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

  const handleDigDeeper = (q: QuizQuestion) => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('dig_deeper_clicked', {
        session_id: sessionId,
        question_id: q.id,
        question_index: q.question_index,
        nclex_category: q.nclex_category,
        source: 'results_screen',
        user_answer: q.user_answer,
        correct_answer: q.correct_answer,
      })
    } catch {}
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-40 max-w-md mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center" style={{ color: '#0B2545' }}>
          Quiz Complete! 🎉
        </h1>

        {/* Score */}
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

        {/* Category breakdown */}
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

        {/* Missed questions */}
        {missed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold" style={{ color: '#0B2545' }}>Questions You Missed</h2>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              {missed.map(q => (
                <div key={q.id} className="p-4 space-y-2">
                  <p className="text-sm" style={{ color: '#0B2545' }}>
                    <span className="font-medium">Q{q.question_index + 1}</span> · {q.question_stem.slice(0, 80)}...
                  </p>

                  {/* Review toggle */}
                  {reviewingId === q.id && (
                    <div className="rounded-lg p-3 text-sm space-y-2" style={{ backgroundColor: '#F9FAFB' }}>
                      <p><span className="font-medium">Your answer:</span> {q.user_answer}</p>
                      <p><span className="font-medium">Correct:</span> {q.correct_answer}</p>
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
                    <Link
                      href={`/tutor?intent=dig-deeper&quizSessionId=${sessionId}&questionId=${q.id}`}
                      onClick={() => handleDigDeeper(q)}
                      className="px-3 py-1.5 rounded text-sm font-medium text-white flex items-center"
                      style={{ backgroundColor: '#0B2545', minHeight: '44px' }}
                    >
                      Dig Deeper →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push('/quiz')}
            className="w-full rounded-lg text-white font-semibold text-base"
            style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
          >
            Start New Quiz
          </button>
          <button
            onClick={() => router.push('/tutor')}
            className="w-full rounded-lg font-semibold text-base border-2"
            style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '56px' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
