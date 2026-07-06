'use client'

import { Loader2 } from 'lucide-react'
import type { PublicQuestion } from '@/lib/answer-trap'

interface TrapQuestionProps {
  question: PublicQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | null
  onSelectAnswer: (answer: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function TrapQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  loading,
}: TrapQuestionProps) {
  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <div className="max-w-lg w-full mx-auto flex-1 flex flex-col">
        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wide" style={{ color: '#0D8F9C' }}>
              Question {questionNumber} of {totalQuestions}
            </span>
            <span>Answer Trap Check</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${(questionNumber / totalQuestions) * 100}%`,
                backgroundColor: '#0D8F9C',
              }}
            />
          </div>
        </div>

        {/* Question stem */}
        <div className="mb-6">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#0B2545' }}>
            {question.question_stem}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.label
            return (
              <button
                key={option.label}
                onClick={() => onSelectAnswer(option.label)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-[#0D8F9C] bg-[#E0F4F6]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                style={{ minHeight: '52px' }}
              >
                <div className="flex gap-3">
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-[#0D8F9C] text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5" style={{ color: '#0B2545' }}>
                    {option.text}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Submit button */}
        <div className="mt-6 pb-4">
          <button
            onClick={onSubmit}
            disabled={!selectedAnswer || loading}
            className="w-full rounded-xl text-white font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#0B2545', minHeight: '52px' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Submit Answer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
