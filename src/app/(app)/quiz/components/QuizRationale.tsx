'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  sessionId: string
  questionId: string
  questionIndex: number
  onNext: () => void
  onRetestWeakness?: () => void
  isRetestingWeakness?: boolean
  isLast: boolean
}

const clearTutorAutoSendState = () => {
  if (typeof window === 'undefined') return

  localStorage.removeItem('forgenursing-tutor-prefill')
  localStorage.removeItem('forgenursing-tutor-auto-send')
  localStorage.removeItem('forgenursing-tutor-has-images')
}

function fallbackMistakeType(category: string) {
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

export default function QuizRationale({
  isCorrect, userAnswer, correctAnswer, options, rationaleCorrect,
  rationaleIncorrect, nclexCategory, difficulty, mistakeType, reasoningTrap,
  fixInstruction, retestFocus, sessionId, questionId, questionIndex, onNext,
  onRetestWeakness, isRetestingWeakness = false, isLast,
}: QuizRationaleProps) {
  const router = useRouter()
  const [isDiggingDeeper, setIsDiggingDeeper] = useState(false)
  const [digDeeperError, setDigDeeperError] = useState<string | null>(null)
  const correctOptionText = options.find(o => o.label === correctAnswer)?.text ?? ''
  const userOptionText = options.find(o => o.label === userAnswer)?.text ?? ''
  const displayedMistakeType = mistakeType || fallbackMistakeType(nclexCategory)
  const showMistakeMap = !isCorrect && displayedMistakeType

  const handleFixWeakness = async () => {
    if (isDiggingDeeper) return

    setIsDiggingDeeper(true)
    setDigDeeperError(null)
    clearTutorAutoSendState()

    try {
      try {
        const posthog = require('posthog-js').default
        posthog.capture('fix_weakness_clicked', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          nclex_category: nclexCategory,
          source: 'rationale_screen',
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          mistake_type: displayedMistakeType,
          retest_focus: retestFocus ?? null,
        })
        posthog.capture('dig_deeper_clicked', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          nclex_category: nclexCategory,
          source: 'rationale_screen',
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
        console.error('[QuizRationale] Fix weakness handoff failed:', await response.text())
        setDigDeeperError('Could not open tutor. Please try again.')
        return
      }

      const data = await response.json()
      if (!data.chatId) {
        setDigDeeperError('Could not open tutor. Please try again.')
        return
      }

      clearTutorAutoSendState()
      router.push(`/tutor?sessionId=${data.chatId}`)
    } catch (error) {
      console.error('[QuizRationale] Fix weakness error:', error)
      setDigDeeperError('Could not open tutor. Please try again.')
    } finally {
      setIsDiggingDeeper(false)
    }
  }

  return (
    <div className="space-y-4 pb-48 sm:pb-8">
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: isCorrect ? '#22C55E' : '#EF4444' }}
      >
        <p className="font-bold text-base">
          {isCorrect ? '✓ Correct!' : '✗ Missed this one'}
        </p>
        {!isCorrect && (
          <div className="mt-2 space-y-1 text-sm">
            <p>You chose: <span className="font-semibold">{userAnswer}{userOptionText ? ` — ${userOptionText}` : ''}</span></p>
            <p>Better answer: <span className="font-semibold">{correctAnswer}{correctOptionText ? ` — ${correctOptionText}` : ''}</span></p>
          </div>
        )}
        {isCorrect && (
          <p className="mt-1 text-sm">{correctAnswer}) {correctOptionText}</p>
        )}
      </div>

      {showMistakeMap && (
        <div className="rounded-xl p-4 text-white" style={{ backgroundColor: '#0B2545' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
            You missed this because
          </p>
          <p className="text-lg font-bold mb-2">Mistake Type: {displayedMistakeType}</p>
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

      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>
          Why {correctAnswer} is better
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{rationaleCorrect}</p>
      </div>

      {!isCorrect && rationaleIncorrect[userAnswer] && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>
            Why {userAnswer} pulled you in
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{rationaleIncorrect[userAnswer]}</p>
        </div>
      )}

      {showMistakeMap && retestFocus && (
        <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0D8F9C' }}>
            Next move
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Practice this weakness next: <span className="font-semibold" style={{ color: '#0B2545' }}>{retestFocus}</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="px-2 py-1 rounded bg-gray-100">{nclexCategory}</span>
        <span>{'●'.repeat(difficulty)}{'○'.repeat(5 - difficulty)}</span>
      </div>

      <p className="text-center text-[10px] leading-snug text-gray-400">
        AI-generated rationale • Educational use only
      </p>

      {digDeeperError && (
        <p className="text-xs text-red-600">{digDeeperError}</p>
      )}

      <div className="sticky bottom-0 z-20 bg-white px-1 pt-3 pb-6 sm:static sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2">
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 sm:border-0 sm:p-0">
          <button
            onClick={onNext}
            className="w-full rounded-lg text-white font-semibold text-base transition-all shadow-sm"
            style={{ backgroundColor: '#0D8F9C', minHeight: '52px' }}
          >
            {isLast ? 'See Results' : 'Next Question →'}
          </button>

          {!isCorrect && onRetestWeakness && (
            <button
              type="button"
              onClick={onRetestWeakness}
              disabled={isRetestingWeakness}
              className="block w-full rounded-lg text-white text-center font-semibold text-sm py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}
            >
              {isRetestingWeakness ? 'Building Retest…' : 'Retest this weakness →'}
            </button>
          )}

          {!isCorrect && (
            <button
              type="button"
              onClick={handleFixWeakness}
              disabled={isDiggingDeeper}
              className="block w-full rounded-lg border text-center font-semibold text-sm py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
            >
              {isDiggingDeeper ? 'Opening Tutor…' : 'Fix with Tutor →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
