'use client'

import { useState, useEffect, useCallback } from 'react'
import TrapLanding from './components/TrapLanding'
import TrapQuestion from './components/TrapQuestion'
import TrapFeedback from './components/TrapFeedback'
import TrapResults from './components/TrapResults'
import TrapAllCorrect from './components/TrapAllCorrect'
import type { PublicQuestion, AnswerFeedback, TrapResult } from '@/lib/answer-trap'

type Phase = 'landing' | 'question' | 'feedback' | 'retry-question' | 'retry-feedback' | 'results'

export default function AnswerTrapClient() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<AnswerFeedback | null>(null)
  const [result, setResult] = useState<TrapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [retryQuestion, setRetryQuestion] = useState<PublicQuestion | null>(null)
  const [retryAnswer, setRetryAnswer] = useState<string | null>(null)
  const [retryFeedback, setRetryFeedback] = useState<AnswerFeedback | null>(null)
  const [retryOutcomes, setRetryOutcomes] = useState<Record<string, { topic: string; correct: boolean }>>({})

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [phase, currentIndex])

  async function handleRelatedRetry(submit = false) {
    if (loading || !questions[currentIndex] || (submit && !retryAnswer)) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/answer-trap-check/retry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, anonymous_id: anonymousId,
          question_id: questions[currentIndex].id, ...(submit ? { selected_answer: retryAnswer } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load the related question.')
      if (submit) {
        setRetryFeedback(data.feedback)
        setRetryOutcomes(previous => ({ ...previous, [questions[currentIndex].id]: {
          topic: data.feedback.trap_display_name, correct: data.feedback.is_correct,
        } }))
        setPhase('retry-feedback')
      } else {
        setRetryQuestion(data.question)
        setRetryAnswer(null)
        setPhase('retry-question')
      }
      try {
        const posthog = require('posthog-js').default
        posthog.capture(submit ? 'practice_retry_answered' : 'practice_retry_started', {
          question_id: questions[currentIndex].id,
          ...(submit ? { is_correct: data.feedback.is_correct } : {}),
        })
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Please try again.')
    } finally { setLoading(false) }
  }

  // Fire page view event
  useEffect(() => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_page_viewed', {
        source_url: '/answer-trap-check',
      })
    } catch {}
  }, [])

  const handleStart = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_cta_clicked', { cta_location: 'hero' })
    } catch {}

    try {
      // Collect UTM params from URL
      const params = new URLSearchParams(window.location.search)

      const res = await fetch('/api/answer-trap-check/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utm_source: params.get('utm_source'),
          utm_medium: params.get('utm_medium'),
          utm_campaign: params.get('utm_campaign'),
          source_url: window.location.href,
        }),
      })

      if (res.status === 429) {
        setError('You\'ve taken several checks recently. Please try again in an hour.')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to start check')
      }

      const data = await res.json()
      setSessionId(data.session_id)
      setAnonymousId(data.anonymous_id)
      setQuestions(data.questions)
      setCurrentIndex(0)
      setPhase('question')

      try {
        const posthog = require('posthog-js').default
        posthog.capture('answer_trap_check_started', {
          anonymous_session_id: data.anonymous_id,
          question_count: data.questions.length,
        })
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmitAnswer = useCallback(async () => {
    if (!sessionId || !selectedAnswer || !questions[currentIndex]) return
    setLoading(true)
    setError(null)

    const question = questions[currentIndex]

    try {
      const res = await fetch('/api/answer-trap-check/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          question_index: currentIndex,
          selected_answer: selectedAnswer,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit answer')
      }

      const feedback: AnswerFeedback = await res.json()
      setCurrentFeedback(feedback)
      setPhase('feedback')

      try {
        const posthog = require('posthog-js').default
        posthog.capture('answer_trap_question_answered', {
          anonymous_session_id: anonymousId,
          question_index: currentIndex,
          question_id: question.id,
          selected_answer: selectedAnswer,
          correct_answer: feedback.correct_answer,
          is_correct: feedback.is_correct,
          trap_type: feedback.trap_type,
          trap_display_name: feedback.trap_display_name,
        })
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sessionId, selectedAnswer, questions, currentIndex, anonymousId])

  const handleNextAfterFeedback = useCallback(async () => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_feedback_viewed', {
        anonymous_session_id: anonymousId,
        question_index: currentIndex,
        trap_type: currentFeedback?.trap_type,
      })
    } catch {}

    const nextIndex = currentIndex + 1

    if (nextIndex >= questions.length) {
      // All questions answered — complete the session
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/answer-trap-check/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to get results')
        }

        const trapResult: TrapResult = await res.json()
        setResult(trapResult)
        setPhase('results')

        try {
          const posthog = require('posthog-js').default
          posthog.capture('answer_trap_check_completed', {
            anonymous_session_id: anonymousId,
            score: trapResult.score,
            total: trapResult.total,
            all_correct: trapResult.all_correct,
            detected_trap: trapResult.detected_trap,
            detected_trap_display: trapResult.detected_trap_display,
          })
        } catch {}
      } catch (err: any) {
        setError(err.message || 'Failed to load results. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Move to next question
      setCurrentIndex(nextIndex)
      setSelectedAnswer(null)
      setCurrentFeedback(null)
      setPhase('question')
    }
  }, [currentIndex, questions.length, sessionId, anonymousId, currentFeedback])

  return (
    <div className="bg-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {error && <div role="alert" className="mx-auto max-w-lg px-4 pt-5 text-sm text-red-800">{error} Your place is kept; try the action again.</div>}
      {phase === 'landing' && (
        <TrapLanding onStart={handleStart} loading={loading} />
      )}

      {phase === 'question' && questions[currentIndex] && (
        <TrapQuestion
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={setSelectedAnswer}
          onSubmit={handleSubmitAnswer}
          loading={loading}
        />
      )}

      {phase === 'feedback' && currentFeedback && (
        <TrapFeedback
          feedback={currentFeedback}
          selectedAnswer={selectedAnswer!}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onNext={handleNextAfterFeedback}
          isLast={currentIndex >= questions.length - 1}
          loading={loading}
          onRetry={currentFeedback.retry_available ? () => handleRelatedRetry() : undefined}
        />
      )}

      {phase === 'retry-question' && retryQuestion && <>
        <TrapQuestion question={retryQuestion} questionNumber={currentIndex + 1} totalQuestions={questions.length}
          selectedAnswer={retryAnswer} onSelectAnswer={setRetryAnswer} onSubmit={() => handleRelatedRetry(true)} loading={loading} isRetry />
        <button onClick={handleNextAfterFeedback} disabled={loading} className="mx-auto mb-6 block min-h-11 px-4 text-sm text-slate-600 underline">Skip retry and continue</button>
      </>}
      {phase === 'retry-feedback' && retryFeedback && <TrapFeedback feedback={retryFeedback} selectedAnswer={retryAnswer!}
        questionNumber={currentIndex + 1} totalQuestions={questions.length} onNext={handleNextAfterFeedback}
        isLast={currentIndex >= questions.length - 1} loading={loading} isRetry />}
      {phase === 'results' && Object.keys(retryOutcomes).length > 0 && <div className="mx-auto max-w-lg px-4 pt-6">
        <div className="rounded-xl bg-teal-50 p-4"><h2 className="font-bold text-lg">Your related-question practice</h2>
          <ul className="mt-2 space-y-2 text-sm">{Object.entries(retryOutcomes).map(([id, outcome]) => <li key={id}>{outcome.topic}: {outcome.correct ? 'correct on the related question' : 'worth another review'}.</li>)}</ul>
          <p className="mt-3 text-xs text-slate-600">Practice after feedback, shown separately from your original score. This retry summary is for this visit only.</p>
        </div>
      </div>}
      {phase === 'results' && result && (
        result.all_correct ? (
          <TrapAllCorrect sessionId={sessionId}
            result={result}
            anonymousId={anonymousId}
          />
        ) : (
          <TrapResults
            result={result}
            sessionId={sessionId}
            anonymousId={anonymousId}
          />
        )
      )}
    </div>
  )
}
