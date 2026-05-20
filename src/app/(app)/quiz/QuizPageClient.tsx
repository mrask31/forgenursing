'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import QuizSetup from './components/QuizSetup'
import QuizProgress from './components/QuizProgress'
import QuizQuestion from './components/QuizQuestion'
import QuizRationale from './components/QuizRationale'

type Phase = 'setup' | 'question' | 'rationale' | 'loading'

interface QuestionData {
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
}

interface AnswerResult {
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
}

export default function QuizPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const directSessionId = searchParams.get('sessionId')

  const [phase, setPhase] = useState<Phase>('setup')
  const [hasDocuments, setHasDocuments] = useState(false)
  const [sourceType, setSourceType] = useState<'document' | 'generic'>('generic')
  const [category, setCategory] = useState('All Categories')
  const [loading, setLoading] = useState(false)
  const [retestingWeakness, setRetestingWeakness] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionTotalQuestions, setSessionTotalQuestions] = useState(10)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)

  const [resumeSession, setResumeSession] = useState<any>(null)

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
    setPhase('loading')
    setError(null)
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

      prefetchQuestions(sessId, index + 1, 2)
    } catch (err: any) {
      setError(err.message || 'Failed to generate question. Please try again.')
      setPhase('setup')
    }
  }, [sourceType, category, prefetchQuestions])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: docs } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      setHasDocuments((docs?.length ?? 0) > 0)
      if ((docs?.length ?? 0) > 0) setSourceType('document')

      try {
        const res = await fetch('/api/quiz/sessions')
        if (!res.ok) return

        const { sessions } = await res.json()
        const directSession = directSessionId
          ? sessions?.find((s: any) => s.id === directSessionId)
          : null

        if (directSession) {
          setSessionId(directSession.id)
          setSessionTotalQuestions(directSession.total_questions || 10)
          setResumeSession(null)
          await generateQuestion(directSession.id, directSession.current_question_index || 0)
          return
        }

        const inProgress = sessions?.find((s: any) => s.status === 'in_progress')
        if (inProgress) setResumeSession(inProgress)
      } catch {}
    }
    init()
  }, [directSessionId, generateQuestion])

  const handleStart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          nclexCategory: category === 'All Categories' ? null : category,
        }),
      })

      if (!res.ok) throw new Error('Failed to create session')
      const { session } = await res.json()
      setSessionId(session.id)
      setSessionTotalQuestions(session.total_questions || 10)
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
        })
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
    setResumeSession(null)

    try {
      const posthog = (await import('posthog-js')).default
      posthog.capture('quiz_resumed', {
        session_id: resumeSession.id,
        questions_completed: resumeSession.current_question_index,
        total_questions: resumeSession.total_questions,
      })
    } catch {}

    await generateQuestion(resumeSession.id, resumeSession.current_question_index)
  }, [resumeSession, generateQuestion])

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
      setAnswerResult(result)
      setPhase('rationale')

      prefetchQuestions(sessionId, currentIndex + 1, 2)

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
        })
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer')
    } finally {
      setLoading(false)
    }
  }, [currentQuestion, selectedAnswer, sessionId, currentIndex, questionStartTime, sourceType, sessionTotalQuestions, prefetchQuestions])

  const handleRetestWeakness = useCallback(async () => {
    if (!currentQuestion || !sessionId || retestingWeakness) return

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
      setSessionId(session.id)
      setSessionTotalQuestions(session.total_questions || 1)
      setCurrentIndex(question.question_index ?? 0)
      setCurrentQuestion(question)
      setSelectedAnswer(null)
      setAnswerResult(null)
      setQuestionStartTime(Date.now())
      setResumeSession(null)
      setPhase('question')
      router.replace(`/quiz?sessionId=${session.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create targeted retest')
    } finally {
      setRetestingWeakness(false)
    }
  }, [currentQuestion, sessionId, retestingWeakness, currentIndex, answerResult, router])

  const handleNext = useCallback(async () => {
    if (!sessionId) return
    const nextIndex = currentIndex + 1

    if (nextIndex >= sessionTotalQuestions || answerResult?.session_complete) {
      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('quiz_completed', {
          session_id: sessionId,
          score: answerResult?.score ?? 0,
          total: sessionTotalQuestions,
          percentage: Math.round(((answerResult?.score ?? 0) / sessionTotalQuestions) * 100),
          source_type: sourceType,
        })
      } catch {}

      router.push(`/quiz/results?sessionId=${sessionId}`)
      return
    }

    await generateQuestion(sessionId, nextIndex)
  }, [sessionId, currentIndex, sessionTotalQuestions, answerResult, sourceType, router, generateQuestion])

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {phase === 'setup' && (
        <QuizSetup
          hasDocuments={hasDocuments}
          sourceType={sourceType}
          setSourceType={setSourceType}
          category={category}
          setCategory={setCategory}
          onStart={handleStart}
          loading={loading}
          resumeSession={resumeSession}
          onResume={handleResume}
        />
      )}

      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0D8F9C', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Generating your next question...</p>
        </div>
      )}

      {phase === 'question' && currentQuestion && (
        <div className="space-y-5">
          <QuizProgress current={currentIndex} total={sessionTotalQuestions} />
          <QuizQuestion
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
            sessionId={sessionId!}
            questionId={currentQuestion.id}
            questionIndex={currentIndex}
            onNext={handleNext}
            onRetestWeakness={handleRetestWeakness}
            isRetestingWeakness={retestingWeakness}
            isLast={currentIndex >= sessionTotalQuestions - 1}
          />
        </div>
      )}
    </div>
  )
}
