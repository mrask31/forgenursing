'use client'
import { CONTENT_HOLD_MESSAGE } from '@/lib/learning/content-hold'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { captureLoop } from '@/lib/analytics/learning-loop'
import { loopProperties } from '@/lib/learning/distinctions'
import { getBrowserClient } from '@/lib/supabase/client'
import QuizSetup from './components/QuizSetup'
import QuizProgress from './components/QuizProgress'
import QuizQuestion from './components/QuizQuestion'
import QuizRationale from './components/QuizRationale'

type Phase = 'setup' | 'question' | 'rationale' | 'loading'

type StartOptions = {
  nclexCategory?: string | null
  practiceSource?: 'bank' | 'generated'
  quizMode?: 'standard' | 'targeted_drill'
  targetMistakeType?: string | null
  targetFocus?: string | null
  totalQuestions?: number
}

interface QuestionData {
  distinction_id?: string | null
  source_question_id?: string | null
  learning_attempt?: number
  source_checked_content_id?: string | null
  clinical_content_id?: string | null
  id: string
  session_id: string
  question_index: number
  question_stem: string
  options: { label: string; text: string }[]
  nclex_category: string
  difficulty: number
  mistake_type?: string | null
  reasoning_trap?: string | null
  fix_instruction?: string | null
  retest_focus?: string | null
  key_cue?: string | null
  why_correct_short?: string | null
  why_wrong_short?: string | null
  one_line_fix?: string | null
}

interface AnswerResult {
  sources?: {title:string;url:string}[]
  learning?: Record<string, any>
  correct_answer: string
  rationale_correct: string
  rationale_incorrect: Record<string, string>
  is_correct: boolean
  user_answer: string
  session_complete: boolean
  score: number
  total_answered: number
  mistake_type?: string | null
  reasoning_trap?: string | null
  fix_instruction?: string | null
  retest_focus?: string | null
  key_cue?: string | null
  why_correct_short?: string | null
  why_wrong_short?: string | null
  one_line_fix?: string | null
}

export default function QuizPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const directSessionId = searchParams.get('sessionId')
  const feedbackQuestionId = searchParams.get('feedbackQuestionId')
  const returnSessionId = searchParams.get('returnSessionId')

  const [phase, setPhase] = useState<Phase>('setup')
  const [hasDocuments, setHasDocuments] = useState(false)
  const [sourceType, setSourceType] = useState<'document' | 'generic'>('generic')
  const [category, setCategory] = useState('All Categories')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [initializationFailed, setInitializationFailed] = useState(false)
  const [retestingWeakness, setRetestingWeakness] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionTotalQuestions, setSessionTotalQuestions] = useState(10)
  const [currentQuizMode, setCurrentQuizMode] = useState<string>('standard')
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)

  const [resumeSession, setResumeSession] = useState<any>(null)

  const startRequest = useRef<{id:string; key:string}|null>(null)
  const initRef = useRef(false)
  const prefetchingIndexesRef = useRef<Set<string>>(new Set())

  const prefetchQuestions = useCallback((sessId: string, startIndex: number, count = 2) => {
    for (let offset = 0; offset < count; offset++) {
      const targetIndex = startIndex + offset
      if (targetIndex < 0 || targetIndex >= sessionTotalQuestions) continue

      const prefetchKey = `${sessId}:${targetIndex}`
      if (prefetchingIndexesRef.current.has(prefetchKey)) continue
      prefetchingIndexesRef.current.add(prefetchKey)

      fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          questionIndex: targetIndex,
          sourceType,
          category: category === 'All Categories' ? null : category,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            console.warn('[Quiz Prefetch] Failed:', {
              sessionId: sessId,
              questionIndex: targetIndex,
              error: data.error || res.statusText,
            })
          }
        })
        .catch((err) => {
          console.warn('[Quiz Prefetch] Error:', {
            sessionId: sessId,
            questionIndex: targetIndex,
            error: err?.message || err,
          })
        })
        .finally(() => {
          prefetchingIndexesRef.current.delete(prefetchKey)
        })
    }
  }, [sourceType, category, sessionTotalQuestions])

  const generateQuestion = useCallback(async (sessId: string, index: number) => {
    setCurrentIndex(index)
    setPhase('loading')
    setError(null)
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setAnswerResult(null)

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          questionIndex: index,
          sourceType,
          category: category === 'All Categories' ? null : category,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate question')
      }

      const { question } = await res.json()
      setCurrentQuestion(question)
      setCurrentIndex(index)
      setQuestionStartTime(Date.now())
      setPhase('question')

      if (!question.source_checked_content_id) prefetchQuestions(sessId, index + 1, 2)
    } catch (err: any) {
      setError(err.message || 'Failed to generate question. Please try again.')
      setPhase('question')
    }
  }, [sourceType, category, prefetchQuestions])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      try {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please log in again to load your saved practice.')

      const { data: docs } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      setHasDocuments((docs?.length ?? 0) > 0)
      // Uploaded materials are an explicit secondary practice option.

      try {
        const res = await fetch('/api/quiz/sessions')
        if (!res.ok) throw new Error('Your saved practice could not load. Please retry before starting a new session.')

        const { sessions } = await res.json()
        const directSession = directSessionId
          ? sessions?.find((s: any) => s.id === directSessionId)
          : null

        if (directSession && feedbackQuestionId) {
          const response = await fetch(`/api/quiz/feedback?questionId=${encodeURIComponent(feedbackQuestionId)}`, { cache: 'no-store' })
          const saved = await response.json()
          if (!response.ok) throw new Error(saved.error || 'Saved feedback could not load.')
          if (saved.question.session_id !== directSession.id) throw new Error('This feedback does not belong to the selected session.')
          setSessionId(directSession.id)
          setSessionTotalQuestions(directSession.total_questions || 10)
          setCurrentQuizMode(directSession.quiz_mode || 'standard')
          setCurrentIndex(saved.question.question_index)
          setCurrentQuestion(saved.question)
          setSelectedAnswer(saved.answer.user_answer)
          setAnswerResult(saved.answer)
          setPhase('rationale')
          return
        }
        if (directSession) {
          if (directSession.status === 'completed') { router.replace(`/quiz/results?sessionId=${directSession.id}`); return }
          setSessionId(directSession.id)
          setSessionTotalQuestions(directSession.total_questions || 10)
          setCurrentQuizMode(directSession.quiz_mode || 'standard')
          setResumeSession(null)
          try {
            const posthog = (await import('posthog-js')).default
            posthog.capture('quiz_resumed', {
              session_id: directSession.id,
              source_type: sourceType,
              nclex_category: category === 'All Categories' ? null : category,
              has_documents: (docs?.length ?? 0) > 0,
              is_resume: true,
              source: 'direct_session_load',
              questions_completed: directSession.current_question_index || 0,
              total_questions: directSession.total_questions || 10,
              quiz_mode: directSession.quiz_mode || 'standard',
            })
          } catch {}
          await generateQuestion(directSession.id, directSession.current_question_index || 0)
          return
        }

        if (directSessionId) throw new Error('This session is unavailable. Open Home to choose your saved practice.')
        const inProgress = sessions?.find((s: any) => s.status === 'in_progress')
        if (inProgress) setResumeSession(inProgress)
      } catch (err) { throw err }
      } catch (err) {
        setInitializationFailed(true)
        setError(err instanceof Error ? err.message : 'Your saved practice could not load.')
      } finally { setInitializing(false) }
    }
    void init()
  }, [directSessionId, feedbackQuestionId, generateQuestion, sourceType, category])

  const handleStart = useCallback(async (options?: StartOptions) => {
    setLoading(true)
    setError(null)
    try {
      const quizMode = options?.quizMode || 'standard'
      const requestKey = JSON.stringify([sourceType,category,options])
      if (!startRequest.current || startRequest.current.key !== requestKey) startRequest.current = {id:crypto.randomUUID(),key:requestKey}
      const res = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: startRequest.current.id,
          sourceType,
          practiceSource: options?.practiceSource || 'bank',
          nclexCategory: options?.nclexCategory !== undefined ? options.nclexCategory : category === 'All Categories' ? null : category,
          quizMode,
          targetMistakeType: options?.targetMistakeType ?? null,
          targetFocus: options?.targetFocus ?? null,
          totalQuestions: options?.totalQuestions ?? (quizMode === 'targeted_drill' ? 3 : 10),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create session')
      }
      const { session } = await res.json()
      startRequest.current = null
      setSessionId(session.id)
      setSessionTotalQuestions(session.total_questions || 10)
      setCurrentQuizMode(session.quiz_mode || quizMode)
      setResumeSession(null)

      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('quiz_started', {
          session_id: session.id,
          source_type: sourceType,
          nclex_category: category === 'All Categories' ? null : category,
          has_documents: hasDocuments,
          is_resume: false,
          total_questions: session.total_questions || 10,
          quiz_mode: session.quiz_mode || quizMode,
          target_mistake_type: session.target_mistake_type || null,
          target_focus: session.target_focus || null,
        })
        if ((session.quiz_mode || quizMode) === 'targeted_drill') {
          posthog.capture('recommended_practice_started', {
            session_id: session.id,
            target_mistake_type: session.target_mistake_type || options?.targetMistakeType || null,
            target_focus: session.target_focus || options?.targetFocus || null,
          })
        }
      } catch {}

      await generateQuestion(session.id, 0)
    } catch (err: any) {
      setError(err.message || 'Failed to start quiz')
    } finally {
      setLoading(false)
    }
  }, [sourceType, category, hasDocuments, generateQuestion])

  const handleResume = useCallback(async () => {
    if (!resumeSession) return
    setSessionId(resumeSession.id)
    setSessionTotalQuestions(resumeSession.total_questions || 10)
    setCurrentQuizMode(resumeSession.quiz_mode || 'standard')
    setResumeSession(null)

    try {
      const posthog = (await import('posthog-js')).default
      posthog.capture('quiz_resumed', {
        session_id: resumeSession.id,
        questions_completed: resumeSession.current_question_index,
        total_questions: resumeSession.total_questions,
        quiz_mode: resumeSession.quiz_mode || 'standard',
      })
    } catch {}

    await generateQuestion(resumeSession.id, resumeSession.current_question_index)
  }, [resumeSession, generateQuestion])

  useEffect(() => {
    if (!sessionId || !currentQuestion) return
    const props = loopProperties(currentQuestion, sessionId)
    if (phase === 'rationale' && answerResult?.learning?.retry_eligible) captureLoop('related_retry_offered', { ...props, source_question_id: currentQuestion.id }, currentQuestion.id)
    if (phase === 'question' && currentQuestion.learning_attempt === 2) captureLoop('related_retry_loaded', props, currentQuestion.id)
  }, [phase, sessionId, currentQuestion, answerResult])

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !selectedAnswer || !sessionId) return
    setLoading(true)

    try {
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: selectedAnswer,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit answer')
      const result: AnswerResult = await res.json()
      captureLoop('question_answered', { ...(result.learning || loopProperties(currentQuestion, sessionId)), correct: result.is_correct }, currentQuestion.id)
      setAnswerResult(result)
      setPhase('rationale')

      if (!currentQuestion.source_checked_content_id) prefetchQuestions(sessionId, currentIndex + 1, 2)

      try {
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
        const posthog = (await import('posthog-js')).default
        posthog.capture('quiz_question_answered', {
          session_id: sessionId,
          question_id: currentQuestion.id,
          question_index: currentIndex,
          is_correct: result.is_correct,
          user_answer: selectedAnswer,
          correct_answer: result.correct_answer,
          nclex_category: currentQuestion.nclex_category,
          difficulty: currentQuestion.difficulty,
          mistake_type: result.mistake_type ?? currentQuestion.mistake_type ?? null,
          retest_focus: result.retest_focus ?? currentQuestion.retest_focus ?? null,
          time_spent_seconds: timeSpent,
          source_type: sourceType,
          total_questions: sessionTotalQuestions,
          quiz_mode: currentQuizMode,
        })
      } catch {}
    } catch (err: any) {
      if (currentQuestion.learning_attempt === 2) captureLoop('related_retry_failed', {...loopProperties(currentQuestion, sessionId), stage: 'answer', error_code: 'request_failed'})
      setError(err.message || 'Failed to submit answer')
    } finally {
      setLoading(false)
    }
  }, [currentQuestion, selectedAnswer, sessionId, currentIndex, questionStartTime, sourceType, sessionTotalQuestions, currentQuizMode, prefetchQuestions])

  const handleRetestWeakness = useCallback(async () => {
    if (!currentQuestion || !sessionId || retestingWeakness || !answerResult?.learning?.retry_eligible) return
    captureLoop('related_retry_started', { ...loopProperties(currentQuestion, sessionId), source_question_id: currentQuestion.id }, currentQuestion.id)

    setRetestingWeakness(true)
    setError(null)

    try {
      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('retest_weakness_clicked', {
          session_id: sessionId,
          question_id: currentQuestion.id,
          question_index: currentIndex,
          nclex_category: currentQuestion.nclex_category,
          mistake_type: currentQuestion.mistake_type ?? answerResult?.mistake_type ?? null,
          retest_focus: currentQuestion.retest_focus ?? answerResult?.retest_focus ?? null,
          source: 'rationale_screen',
        })
      } catch {}

      const res = await fetch('/api/quiz/retest-weakness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quizSessionId: sessionId,
          questionId: currentQuestion.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create targeted retest')
      }

      const { session, question } = await res.json()
      if (session.status === 'completed') {
        router.push(`/quiz/results?sessionId=${session.id}&returnSessionId=${encodeURIComponent(returnSessionId || sessionId)}`)
        return
      }
      setSessionId(session.id)
      setSessionTotalQuestions(session.total_questions || 1)
      setCurrentQuizMode(session.quiz_mode || 'retest')
      setCurrentIndex(question.question_index ?? 0)
      setCurrentQuestion(question)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setQuestionStartTime(Date.now())
      setResumeSession(null)
      setPhase('question')
      router.replace(`/quiz?sessionId=${session.id}&returnSessionId=${encodeURIComponent(returnSessionId || sessionId)}`)
    } catch (err: any) {
      captureLoop('related_retry_failed', { ...loopProperties(currentQuestion, sessionId), stage: 'load', error_code: 'request_failed' })
      setError(err.message || 'Failed to create targeted retest')
    } finally {
      setRetestingWeakness(false)
    }
  }, [currentQuestion, sessionId, retestingWeakness, currentIndex, answerResult, router, returnSessionId])

  const handleNext = useCallback(async () => {
    if (!sessionId) return
    const nextIndex = currentIndex + 1
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.delete('feedbackQuestionId')
    window.history.replaceState(null, '', nextUrl.pathname + nextUrl.search)

    if (nextIndex >= sessionTotalQuestions || answerResult?.session_complete) {
      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('quiz_completed', {
          session_id: sessionId,
          score: answerResult?.score ?? 0,
          total: sessionTotalQuestions,
          percentage: Math.round(((answerResult?.score ?? 0) / sessionTotalQuestions) * 100),
          source_type: sourceType,
          quiz_mode: currentQuizMode,
        })
      } catch {}

      router.push(`/quiz/results?sessionId=${sessionId}${returnSessionId ? `&returnSessionId=${encodeURIComponent(returnSessionId)}` : ''}`)
      return
    }

    await generateQuestion(sessionId, nextIndex)
  }, [sessionId, currentIndex, sessionTotalQuestions, answerResult, sourceType, currentQuizMode, router, generateQuestion, returnSessionId])

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {error && error !== CONTENT_HOLD_MESSAGE && sessionId && !currentQuestion && <button className="mb-4 rounded-lg bg-[#0D8F9C] px-4 py-3 text-white" onClick={() => generateQuestion(sessionId, currentIndex)}>Retry this question</button>}
      {error === CONTENT_HOLD_MESSAGE && <a href="/quiz" className="mb-4 block underline">Choose another practice topic</a>}
      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {initializing && <p role="status" className="mb-4 text-sm text-slate-600">Loading your saved practice…</p>}
      {initializationFailed && <button onClick={() => window.location.reload()} className="mb-4 underline">Retry loading saved practice</button>}
      {phase === 'setup' && (
        <QuizSetup
          hasDocuments={hasDocuments}
          sourceType={sourceType}
          setSourceType={setSourceType}
          category={category}
          setCategory={setCategory}
          onStart={handleStart}
          loading={loading || initializing || initializationFailed}
          resumeSession={resumeSession}
          onResume={handleResume}
        />
      )}

      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0D8F9C', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Loading your next question...</p>
        </div>
      )}

      {phase === 'question' && currentQuestion && (
        <div className="space-y-5">
          <QuizProgress current={currentIndex} total={sessionTotalQuestions} />
          <QuizQuestion
            sourceChecked={!!currentQuestion.source_checked_content_id}
            stem={currentQuestion.question_stem}
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            onSelect={setSelectedAnswer}
            onSubmit={handleSubmitAnswer}
            submitting={loading}
          />
        </div>
      )}

      {phase === 'rationale' && currentQuestion && answerResult && (
        <div className="space-y-5">
          <QuizProgress current={currentIndex} total={sessionTotalQuestions} />
          <QuizRationale
            sourceChecked={!!currentQuestion.source_checked_content_id}
            reviewed={!!currentQuestion.clinical_content_id}
            sources={answerResult.sources}
            isCorrect={answerResult.is_correct}
            userAnswer={answerResult.user_answer}
            correctAnswer={answerResult.correct_answer}
            options={currentQuestion.options}
            rationaleCorrect={answerResult.rationale_correct}
            rationaleIncorrect={answerResult.rationale_incorrect}
            nclexCategory={currentQuestion.nclex_category}
            difficulty={currentQuestion.difficulty}
            mistakeType={answerResult.mistake_type ?? currentQuestion.mistake_type}
            reasoningTrap={answerResult.reasoning_trap ?? currentQuestion.reasoning_trap}
            fixInstruction={answerResult.fix_instruction ?? currentQuestion.fix_instruction}
            retestFocus={answerResult.retest_focus ?? currentQuestion.retest_focus}
            keyCue={answerResult.key_cue ?? currentQuestion.key_cue}
            whyCorrectShort={answerResult.why_correct_short ?? currentQuestion.why_correct_short}
            whyWrongShort={answerResult.why_wrong_short ?? currentQuestion.why_wrong_short}
            oneLineFix={answerResult.one_line_fix ?? currentQuestion.one_line_fix}
            sessionId={sessionId!}
            questionId={currentQuestion.id}
            questionIndex={currentIndex}
            onNext={handleNext}
            onRetestWeakness={answerResult.learning?.retry_eligible ? handleRetestWeakness : undefined}
            isRetestingWeakness={retestingWeakness}
            isLast={currentIndex >= sessionTotalQuestions - 1}
          />
        </div>
      )}
    </div>
  )
}
