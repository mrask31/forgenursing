'use client'

import Link from 'next/link'

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

export default function QuizRationale({
  isCorrect, userAnswer, correctAnswer, options, rationaleCorrect,
  rationaleIncorrect, nclexCategory, difficulty, sessionId, questionId,
  questionIndex, onNext, isLast,
}: QuizRationaleProps) {
  const correctOptionText = options.find(o => o.label === correctAnswer)?.text ?? ''

  const handleDigDeeper = () => {
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
  }

  return (
    <div className="space-y-4">
      {/* Result banner */}
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

      {/* Correct rationale */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>
          Why {correctAnswer} is correct
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{rationaleCorrect}</p>
      </div>

      {/* Incorrect rationale (only show user's wrong answer explanation) */}
      {!isCorrect && rationaleIncorrect[userAnswer] && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>
            Why {userAnswer} is wrong
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{rationaleIncorrect[userAnswer]}</p>
        </div>
      )}

      {/* Category & difficulty */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="px-2 py-1 rounded bg-gray-100">{nclexCategory}</span>
        <span>{'●'.repeat(difficulty)}{'○'.repeat(5 - difficulty)}</span>
      </div>

      {/* Dig Deeper (only on wrong answers) */}
      {!isCorrect && (
        <div className="border-t border-b border-gray-200 py-3 space-y-2">
          <p className="text-sm text-gray-600">🧠 Want to understand deeper?</p>
          <Link
            href={`/tutor?intent=dig-deeper:${sessionId}:${questionId}`}
            onClick={handleDigDeeper}
            className="block w-full rounded-lg text-center text-white font-semibold text-sm py-3 transition-all"
            style={{ backgroundColor: '#0B2545', minHeight: '44px' }}
          >
            Dig Deeper with Tutor →
          </Link>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full rounded-lg text-white font-semibold text-base transition-all"
        style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
      >
        {isLast ? 'See Results' : 'Next Question →'}
      </button>
    </div>
  )
}
