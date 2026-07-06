'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import type { AnswerFeedback } from '@/lib/answer-trap'

interface TrapFeedbackProps {
  feedback: AnswerFeedback
  selectedAnswer: string
  questionNumber: number
  totalQuestions: number
  onNext: () => void
  isLast: boolean
}

export default function TrapFeedback({
  feedback,
  selectedAnswer,
  questionNumber,
  totalQuestions,
  onNext,
  isLast,
}: TrapFeedbackProps) {
  const { is_correct, correct_answer, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix } = feedback

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <div className="max-w-lg w-full mx-auto flex-1 flex flex-col">
        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wide" style={{ color: '#0D8F9C' }}>
              Question {questionNumber} of {totalQuestions}
            </span>
            <span>Feedback</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${(questionNumber / totalQuestions) * 100}%`,
                backgroundColor: '#0D8F9C',
              }}
            />
          </div>
        </div>

        {/* Correct/Incorrect banner */}
        <div
          className="rounded-xl p-4 text-white mb-5"
          style={{ backgroundColor: is_correct ? '#22C55E' : '#EF4444' }}
        >
          <div className="flex items-center gap-2">
            {is_correct ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="font-bold text-base">
              {is_correct ? 'Correct!' : 'Not quite.'}
            </p>
          </div>
          {!is_correct && (
            <p className="mt-2 text-sm text-white/90">
              You chose {selectedAnswer}. The better answer was {correct_answer}.
            </p>
          )}
        </div>

        {/* Feedback card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 flex-1">
          {/* Trap type badge (only on incorrect) */}
          {!is_correct && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-red-100">
              <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                {trap_display_name}
              </span>
            </div>
          )}

          {/* Key clinical cue */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
              Key clinical cue
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {key_cue}
            </p>
          </div>

          {/* Why correct works */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
              {is_correct ? 'Why you got it' : 'Why the better answer works'}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {why_correct_short}
            </p>
          </div>

          {/* Why wrong was tempting (only on incorrect) */}
          {!is_correct && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                Why your answer was tempting
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
                {why_wrong_short}
              </p>
            </div>
          )}

          {/* Think like a nurse */}
          <div className="rounded-lg bg-[#F7F9FB] border border-[#DDE5EE] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
              Think like a nurse
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B2545' }}>
              {one_line_fix}
            </p>
          </div>
        </div>

        {/* Next button */}
        <div className="mt-6 pb-4">
          <button
            onClick={onNext}
            className="w-full rounded-xl text-white font-semibold text-base"
            style={{ backgroundColor: '#0D8F9C', minHeight: '52px' }}
          >
            {isLast ? 'See My Answer Trap Result' : 'Next Question →'}
          </button>
        </div>
      </div>
    </div>
  )
}
