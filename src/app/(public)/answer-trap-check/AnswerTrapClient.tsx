'use client'

import { useState, useEffect, useCallback } from 'react'
import TrapLanding from './components/TrapLanding'
import TrapQuestion from './components/TrapQuestion'
import TrapFeedback from './components/TrapFeedback'
import TrapResults from './components/TrapResults'
import TrapAllCorrect from './components/TrapAllCorrect'
import type { PublicQuestion, AnswerFeedback, TrapResult } from '@/lib/answer-trap'

type Phase = 'landing' | 'question' | 'feedback' | 'results'

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

  const handleRetry = useCallback(() => {
    setError(null)
    setPhase('landing')
    setSessionId(null)
    setAnonymousId(null)
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setCurrentFeedback(null)
    setResult(null)
  }, [])

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-slate-700">{error}</p>
          <button
            onClick={handleRetry}
            className="px-5 py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: '#0D8F9C' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
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
        />
      )}

      {phase === 'results' && result && (
        result.all_correct ? (
          <TrapAllCorrect
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
