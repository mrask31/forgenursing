'use client'

import { useState, useEffect, useCallback } from 'react'
import { submitSampleAnswer, AnswerSubmissionError } from '@/lib/submit-sample-answer'
import { captureLoop } from '@/lib/analytics/learning-loop'
import { opportunityId } from '@/lib/learning/distinctions'
import { captureSample, measurementContext } from '@/lib/analytics/measurement'
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

  function loopProps(distinction = currentFeedback?.distinction_id) {
    return { experience: 'free_sample', sample_session_id: sessionId, retry_opportunity_id: opportunityId('free_sample', questions[currentIndex]?.id || '', sessionId),
      distinction_id: distinction || null, distinction_status: distinction ? 'provisional' : 'unmapped' }
  }
  useEffect(() => {
    if (phase === 'feedback' && currentFeedback?.retry_available && !currentFeedback.is_correct && questions[currentIndex]) {
      captureLoop('related_retry_offered', {...loopProps(), question_id: questions[currentIndex].id, source_question_id: questions[currentIndex].id}, `${sessionId}:${questions[currentIndex].id}`)
    }
    if (phase === 'retry-question' && retryQuestion) captureLoop('related_retry_loaded', {...loopProps(retryQuestion.distinction_id), question_id: retryQuestion.id, source_question_id: questions[currentIndex].id}, `${sessionId}:${questions[currentIndex].id}`)
  }, [phase, currentFeedback, retryQuestion, currentIndex, sessionId, questions])

  async function handleRelatedRetry(submit = false) {
    if (loading || !questions[currentIndex] || (submit && !retryAnswer)) return
    setLoading(true)
    setError(null)
    if (!submit) captureLoop('related_retry_started', { ...loopProps(), question_id: questions[currentIndex].id, source_question_id: questions[currentIndex].id }, `${sessionId}:${questions[currentIndex].id}`)
    try {
      const res = await fetch('/api/answer-trap-check/retry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, anonymous_id: anonymousId,
          question_id: questions[currentIndex].id, ...(submit ? { selected_answer: retryAnswer } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load the related question.')
      if (submit) {
        captureLoop('question_answered', { ...loopProps(data.feedback.distinction_id), question_id: retryQuestion?.id || `${questions[currentIndex].id}-retry`, source_question_id: questions[currentIndex].id, correct: data.feedback.is_correct, attempt: 2, retry_eligible: false }, `retry:${sessionId}:${questions[currentIndex].id}`)
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
      captureLoop('related_retry_failed', { ...loopProps(), source_question_id: questions[currentIndex].id, stage: submit ? 'answer' : 'load', error_code: 'request_failed' })
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

  useEffect(() => {
    if (phase === 'results' && result) captureSample('sample_completed', { score: `${result.score}/${result.total}`, score_correct: result.score, total: result.total, retry_correct_count: Object.values(retryOutcomes).filter(outcome => outcome.correct).length, sample_session_id: sessionId }, `result:${sessionId}`)
  }, [phase, result, retryOutcomes, sessionId])

  const handleStart = useCallback(async () => {
    captureSample('quiz_started')
    setLoading(true)
    setError(null)

    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_cta_clicked', { cta_location: 'hero' })
    } catch {}

    try {
      // Collect UTM params from URL
      const attribution = measurementContext()

      const res = await fetch('/api/answer-trap-check/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utm_source: attribution.utm_source || null,
          utm_medium: attribution.utm_medium || null,
          utm_campaign: attribution.utm_campaign || null,
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
      const feedback = await submitSampleAnswer({
        session_id: sessionId,
        question_id: question.id,
        question_index: currentIndex,
        selected_answer: selectedAnswer,
      })
      captureLoop('question_answered', { experience: 'free_sample', sample_session_id: sessionId, retry_opportunity_id: opportunityId('free_sample', question.id, sessionId), distinction_id: feedback.distinction_id || null, distinction_status: feedback.distinction_id ? 'provisional' : 'unmapped', question_id: question.id, source_question_id: null, correct: feedback.is_correct, attempt: 1, retry_eligible: !feedback.is_correct && !!feedback.retry_available }, `answer:${sessionId}:${question.id}`)
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
    } catch (err: unknown) {
      if (err instanceof AnswerSubmissionError) {
        captureLoop('question_answer_failed', {
          experience: 'free_sample', sample_session_id: sessionId, question_id: question.id,
          attempt: 1, request_id: err.requestId, error_code: err.code, http_status: err.status,
        })
      }
      setError(err instanceof Error ? err.message : 'Unable to save your answer. Please try again.')
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
        <button onClick={handleNextAfterFeedback} disabled={loading} className="mx-auto mb-6 block min-h-11 px-4 text-sm text-slate-600 underline">Continue →</button>
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
