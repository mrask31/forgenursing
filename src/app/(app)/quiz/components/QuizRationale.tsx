'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain } from 'lucide-react'

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
  fixInstruction, retestFocus, keyCue, whyCorrectShort, oneLineFix,
  sessionId, questionId, questionIndex, onNext,
  onRetestWeakness, isRetestingWeakness = false, isLast,
}: QuizRationaleProps) {
  const router = useRouter()
  const [isDiggingDeeper, setIsDiggingDeeper] = useState(false)
  const [showFullRationale, setShowFullRationale] = useState(false)
  const [digDeeperError, setDigDeeperError] = useState<string | null>(null)
  const correctOptionText = options.find(o => o.label === correctAnswer)?.text ?? ''
  const userOptionText = options.find(o => o.label === userAnswer)?.text ?? ''
  const displayedMistakeType = mistakeType || fallbackMistakeType(nclexCategory)
  const showMistakeMap = !isCorrect && displayedMistakeType

  const handleToggleFullRationale = () => {
    setShowFullRationale(prev => !prev)
    try {
      const posthog = require('posthog-js').default
      posthog.capture('show_full_rationale_clicked', {
        session_id: sessionId,
        question_id: questionId,
        question_index: questionIndex,
        is_opening: !showFullRationale,
        nclex_category: nclexCategory,
        mistake_type: displayedMistakeType,
      })
    } catch {}
  }

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
    <div className="space-y-4 pb-6">
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: isCorrect ? '#15803D' : '#9A3412' }}
      >
        <p className="font-bold text-base">
          {isCorrect ? '✓ Correct!' : 'Let’s review this choice.'}
        </p>
        {!isCorrect && (
          <div className="mt-2 space-y-1 text-sm">
            <p>You chose: <span className="font-semibold">{userAnswer}{userOptionText ? ` — ${userOptionText}` : ''}</span></p>
            <p>Correct answer: <span className="font-semibold">{correctAnswer}{correctOptionText ? ` — ${correctOptionText}` : ''}</span></p>
          </div>
        )}
        {isCorrect && (
          <p className="mt-1 text-sm">{correctAnswer}) {correctOptionText}</p>
        )}
      </div>

      <div className="rounded-xl border border-[#DDE5EE] bg-white p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>
          Quick why
        </p>
        {keyCue && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Key clinical cue</p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{keyCue}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            {isCorrect ? 'Why this answer fits' : 'Why this answer fits'}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
            {whyCorrectShort || rationaleCorrect}
          </p>
        </div>
        {!isCorrect && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">About your selected answer</p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {rationaleIncorrect[userAnswer] || 'Compare your selected answer with the correct-answer explanation and key cue above.'}
            </p>
          </div>
        )}
        {oneLineFix && (
          <div className="rounded-lg bg-[#F7F9FB] border border-[#DDE5EE] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Put it into practice</p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B2545' }}>{oneLineFix}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggleFullRationale}
        className="w-full rounded-lg border text-sm font-semibold py-3"
        style={{ borderColor: '#DDE5EE', color: '#0B2545', minHeight: '44px' }}
      >
        {showFullRationale ? 'Hide full rationale' : 'Show full rationale'}
      </button>

      {showFullRationale && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>
              Why {correctAnswer} is better
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{rationaleCorrect}</p>
          </div>

          {!isCorrect && rationaleIncorrect[userAnswer] && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>
                Why {userAnswer} does not fit
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
        AI-generated rationale • Educational use only
      </p>

      {digDeeperError && (
        <p className="text-xs text-red-600">{digDeeperError}</p>
      )}

      <div className="bg-white pt-3 pb-4">
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 sm:border-0 sm:p-0">
          <button
            onClick={onNext}
            className="w-full rounded-lg border font-semibold text-base transition-all"
            style={{ color: !isCorrect && onRetestWeakness ? "#0B2545" : "white", backgroundColor: !isCorrect && onRetestWeakness ? 'white' : '#0D8F9C', minHeight: '52px' }}
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
              {isRetestingWeakness ? 'Building Retest…' : 'Try a related question →'}
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
              {isDiggingDeeper ? 'Opening Tutor…' : 'Talk through this with the tutor →'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
