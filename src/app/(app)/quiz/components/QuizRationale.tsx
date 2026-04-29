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
  sessionId: string
  questionId: string
  questionIndex: number
  onNext: () => void
  isLast: boolean
}

const clearTutorAutoSendState = () => {
  if (typeof window === 'undefined') return

  localStorage.removeItem('forgenursing-tutor-prefill')
  localStorage.removeItem('forgenursing-tutor-auto-send')
  localStorage.removeItem('forgenursing-tutor-has-images')
}

export default function QuizRationale({
  isCorrect, userAnswer, correctAnswer, options, rationaleCorrect,
  rationaleIncorrect, nclexCategory, difficulty, sessionId, questionId,
  questionIndex, onNext, isLast,
}: QuizRationaleProps) {
  const router = useRouter()
  const [isDiggingDeeper, setIsDiggingDeeper] = useState(false)
  const [digDeeperError, setDigDeeperError] = useState<string | null>(null)
  const correctOptionText = options.find(o => o.label === correctAnswer)?.text ?? ''

  const handleDigDeeper = async () => {
    if (isDiggingDeeper) return

    setIsDiggingDeeper(true)
    setDigDeeperError(null)
    clearTutorAutoSendState()

    try {
      try {
        const posthog = require('posthog-js').default
        posthog.capture('dig_deeper_clicked', {
          session_id: sessionId,
          question_id: questionId,
          question_index: questionIndex,
          nclex_category: nclexCategory,
          source: 'rationale_screen',
          user_answer: userAnswer,
          correct_answer: correctAnswer,
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
        console.error('[QuizRationale] Dig deeper handoff failed:', await response.text())
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
      console.error('[QuizRationale] Dig deeper error:', error)
      setDigDeeperError('Could not open tutor. Please try again.')
    } finally {
      setIsDiggingDeeper(false)
    }
  }

  return (
    <div className="space-y-4 pb-40 sm:pb-8">
      <div
        className="rounded-lg p-4 text-white"
        style={{ backgroundColor: isCorrect ? '#22C55E' : '#EF4444' }}
      >
        <p className="font-bold text-base">
          {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
        </p>
        {!isCorrect && (
          <div className="mt-1 text-sm">
            <p>You chose: {userAnswer}</p>
            <p>Correct answer: {correctAnswer}</p>
          </div>
        )}
        {isCorrect && (
          <p className="mt-1 text-sm">{correctAnswer}) {correctOptionText}</p>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>
          Why {correctAnswer} is correct
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{rationaleCorrect}</p>
      </div>

      {!isCorrect && rationaleIncorrect[userAnswer] && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>
            Why {userAnswer} is wrong
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{rationaleIncorrect[userAnswer]}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="px-2 py-1 rounded bg-gray-100">{nclexCategory}</span>
        <span>{'●'.repeat(difficulty)}{'○'.repeat(5 - difficulty)}</span>
      </div>

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

          {!isCorrect && (
            <button
              type="button"
              onClick={handleDigDeeper}
              disabled={isDiggingDeeper}
              className="block w-full rounded-lg border text-center font-semibold text-sm py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
            >
              {isDiggingDeeper ? 'Opening Tutor…' : 'Dig Deeper with Tutor →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
