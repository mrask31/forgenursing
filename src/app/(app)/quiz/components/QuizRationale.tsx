'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, FileSearch, Loader2, RefreshCw, Target, XCircle } from 'lucide-react'

interface QuizRationaleProps {
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  options: { label: string; text: string }[]
  rationaleCorrect: string
  rationaleIncorrect: Record<string, string>
  nclexCategory: string
  difficulty: number
  mistakeType?: string | null
  reasoningTrap?: string | null
  fixInstruction?: string | null
  retestFocus?: string | null
  keyCue?: string | null
  whyCorrectShort?: string | null
  whyWrongShort?: string | null
  oneLineFix?: string | null
  sessionId: string
  questionId: string
  questionIndex: number
  onNext: () => void
  onRetestWeakness?: () => void
  isRetestingWeakness?: boolean
  isLast: boolean
}

function fallbackMistakeType(category: string) {
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

const clearTutorAutoSendState = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('forgenursing-tutor-prefill')
  localStorage.removeItem('forgenursing-tutor-auto-send')
  localStorage.removeItem('forgenursing-tutor-has-images')
}

export default function QuizRationale({
  isCorrect,
  userAnswer,
  correctAnswer,
  options,
  rationaleCorrect,
  rationaleIncorrect,
  nclexCategory,
  difficulty,
  mistakeType,
  reasoningTrap,
  fixInstruction,
  retestFocus,
  keyCue,
  whyCorrectShort,
  whyWrongShort,
  oneLineFix,
  sessionId,
  questionId,
  questionIndex,
  onNext,
  onRetestWeakness,
  isRetestingWeakness = false,
  isLast,
}: QuizRationaleProps) {
  const router = useRouter()
  const [showFullRationale, setShowFullRationale] = useState(false)
  const [isOpeningCoach, setIsOpeningCoach] = useState(false)
  const [coachError, setCoachError] = useState<string | null>(null)

  const correctOptionText = options.find(o => o.label === correctAnswer)?.text ?? ''
  const userOptionText = options.find(o => o.label === userAnswer)?.text ?? ''
  const displayedMistakeType = mistakeType || fallbackMistakeType(nclexCategory)
  const temptingExplanation = whyWrongShort || rationaleIncorrect[userAnswer] || reasoningTrap || 'This option was plausible, but it did not match the safest or most important cue in the stem.'

  const openAutopsyCoach = async () => {
    if (isOpeningCoach) return
    setIsOpeningCoach(true)
    setCoachError(null)
    clearTutorAutoSendState()

    try {
      try {
        const posthog = require('posthog-js').default
        posthog.capture('answer_autopsy_coach_clicked', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          nclex_category: nclexCategory,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          mistake_type: displayedMistakeType,
          retest_focus: retestFocus ?? null,
        })
      } catch {}

      const response = await fetch('/api/quiz/dig-deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quizSessionId: sessionId,
          questionId,
        }),
      })

      if (!response.ok) {
        setCoachError('Could not open the Answer Autopsy Coach. Please try again.')
        return
      }

      const data = await response.json()
      if (!data.chatId) {
        setCoachError('Could not open the Answer Autopsy Coach. Please try again.')
        return
      }

      clearTutorAutoSendState()
      router.push(`/tutor?sessionId=${data.chatId}`)
    } catch (error) {
      console.error('[QuizRationale] Answer Autopsy Coach error:', error)
      setCoachError('Could not open the Answer Autopsy Coach. Please try again.')
    } finally {
      setIsOpeningCoach(false)
    }
  }

  const toggleFullRationale = () => {
    setShowFullRationale(prev => !prev)
    try {
      const posthog = require('posthog-js').default
      posthog.capture('full_rationale_toggled', {
        session_id: sessionId,
        question_id: questionId,
        question_index: questionIndex,
        is_opening: !showFullRationale,
        nclex_category: nclexCategory,
        mistake_type: displayedMistakeType,
        source: 'answer_autopsy',
      })
    } catch {}
  }

  return (
    <div className="space-y-4 pb-48 sm:pb-8">
      <div className="rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">Answer Autopsy</p>
            <h1 className="mt-1 text-xl font-bold" style={{ color: '#0B2545' }}>
              {isCorrect ? 'You got this one right.' : 'You missed this one — now find the pattern.'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">
              {isCorrect
                ? 'Still review the cue and decision rule so you can repeat it under pressure.'
                : 'The value is not just knowing the correct answer. The value is knowing why the tempting answer lost.'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#DDE5EE] bg-white p-4 space-y-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>
          Answer decision
        </p>
        {!isCorrect && (
          <div className="grid gap-3">
            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">You picked</p>
              <p className="mt-1 text-sm font-semibold text-red-900">{userAnswer}{userOptionText ? ` — ${userOptionText}` : ''}</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-green-600">Better answer</p>
              <p className="mt-1 text-sm font-semibold text-green-900">{correctAnswer}{correctOptionText ? ` — ${correctOptionText}` : ''}</p>
            </div>
          </div>
        )}
        {isCorrect && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-green-600">Correct answer</p>
            <p className="mt-1 text-sm font-semibold text-green-900">{correctAnswer}{correctOptionText ? ` — ${correctOptionText}` : ''}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#DDE5EE] bg-white p-4 space-y-4 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">What the question was testing</p>
          <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{nclexCategory}</p>
        </div>

        {keyCue && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Cue to notice next time</p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{keyCue}</p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            Why the better answer works
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
            {whyCorrectShort || rationaleCorrect}
          </p>
        </div>

        {!isCorrect && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Why your answer was tempting</p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {temptingExplanation}
            </p>
          </div>
        )}

        {oneLineFix && (
          <div className="rounded-xl bg-[#F7F9FB] border border-[#DDE5EE] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Decision rule</p>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: '#0B2545' }}>{oneLineFix}</p>
          </div>
        )}
      </div>

      {!isCorrect && (
        <div className="rounded-2xl p-4 text-white shadow-sm" style={{ backgroundColor: '#0B2545' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
            Mistake Pattern Map signal
          </p>
          <p className="text-lg font-bold mb-2">{displayedMistakeType}</p>
          {reasoningTrap && (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">The trap</p>
              <p className="text-sm leading-relaxed text-white/90">{reasoningTrap}</p>
            </div>
          )}
          {fixInstruction && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">How to fix it</p>
              <p className="text-sm leading-relaxed text-white/90">{fixInstruction}</p>
            </div>
          )}
        </div>
      )}

      {retestFocus && (
        <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0D8F9C' }}>
            Next retake focus
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Practice this pattern next: <span className="font-semibold" style={{ color: '#0B2545' }}>{retestFocus}</span>
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={toggleFullRationale}
        className="w-full rounded-lg border text-sm font-semibold py-3"
        style={{ borderColor: '#DDE5EE', color: '#0B2545', minHeight: '44px' }}
      >
        {showFullRationale ? 'Hide full rationale' : 'Show full rationale'}
      </button>

      {showFullRationale && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>
              Full rationale for {correctAnswer}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{rationaleCorrect}</p>
          </div>

          {!isCorrect && rationaleIncorrect[userAnswer] && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>
                Full rationale for why {userAnswer} was wrong
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{rationaleIncorrect[userAnswer]}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="px-2 py-1 rounded bg-gray-100">{nclexCategory}</span>
        <span>{'●'.repeat(difficulty)}{'○'.repeat(5 - difficulty)}</span>
      </div>

      <p className="text-center text-[10px] leading-snug text-gray-400">
        AI-generated study support. Educational use only. No exam outcome guaranteed.
      </p>

      {coachError && <p className="text-xs text-red-600">{coachError}</p>}

      <div className="sticky bottom-0 z-20 bg-white px-1 pt-3 pb-6 sm:static sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {!isCorrect && (
            <button
              type="button"
              onClick={openAutopsyCoach}
              disabled={isOpeningCoach}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0B2545] px-3 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {isOpeningCoach ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              Autopsy Coach
            </button>
          )}

          {!isCorrect && onRetestWeakness && (
            <button
              type="button"
              onClick={onRetestWeakness}
              disabled={isRetestingWeakness}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-[#0D8F9C] bg-white px-3 py-3 text-sm font-bold text-[#0D8F9C] disabled:opacity-60"
            >
              {isRetestingWeakness ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retest Pattern
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0D8F9C] px-3 py-3 text-sm font-bold text-white sm:col-auto"
          >
            {isLast ? 'View Recovery Report' : 'Next Question'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
