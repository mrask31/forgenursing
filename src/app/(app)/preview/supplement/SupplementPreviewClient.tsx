'use client'

import { useState } from 'react'
import Link from 'next/link'
import { nclexCategoryLabel } from '@/lib/nclex-categories'
import type { SupplementQuestion } from '@/lib/supplement-preview'
import QuizQuestion from '../../quiz/components/QuizQuestion'
import QuizProgress from '../../quiz/components/QuizProgress'

function SupplementBadge() {
  return <p className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600" data-testid="supplement-label">
    Supplement question
  </p>
}

export default function SupplementPreviewClient({ question }: { question: SupplementQuestion }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showFull, setShowFull] = useState(false)
  const reset = () => { setSelected(null); setSubmitted(false); setShowFull(false) }
  const isCorrect = selected === question.correct_answer
  const optionText = (label: string | null) => question.options.find(option => option.label === label)?.text ?? ''

  return <div className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
    <aside className="mb-5 space-y-2 text-xs text-slate-600" aria-label="Staging preview controls">
      <p><strong>Staging preview · {question.id}</strong> · No score or review schedule is saved.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="underline">Reset question</button>
        <Link href="/preview/supplement" className="underline">All supplement questions</Link>
      </div>
    </aside>
    <section className="space-y-5" aria-label="Learner question preview">
      <SupplementBadge />
      <QuizProgress current={0} total={1} />
      {!submitted
        ? <QuizQuestion stem={question.question_stem} options={question.options}
            selectedAnswer={selected} onSelect={setSelected} onSubmit={() => { if (selected) setSubmitted(true) }} submitting={false} />
        : <div className="space-y-4 pb-6">
          <div className="rounded-xl p-4 text-white" style={{ backgroundColor: isCorrect ? '#15803D' : '#9A3412' }}>
            <p className="font-bold text-base">{isCorrect ? '✓ Correct!' : 'Let’s review this choice.'}</p>
            {!isCorrect
              ? <div className="mt-2 space-y-1 text-sm">
                <p>You chose: <span className="font-semibold">{selected} — {optionText(selected)}</span></p>
                <p>Correct answer: <span className="font-semibold">{question.correct_answer} — {optionText(question.correct_answer)}</span></p>
              </div>
              : <p className="mt-1 text-sm">{question.correct_answer}) {optionText(question.correct_answer)}</p>}
          </div>

          <div className="rounded-xl border border-[#DDE5EE] bg-white p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>Quick why</p>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Why this answer fits</p>
              <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{question.rationale_correct}</p>
            </div>
            {!isCorrect && <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">About your selected answer</p>
              <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{question.rationale_incorrect[selected!]}</p>
            </div>}
          </div>

          <button type="button" onClick={() => setShowFull(value => !value)} className="w-full rounded-lg border text-sm font-semibold py-3"
            style={{ borderColor: '#DDE5EE', color: '#0B2545', minHeight: '44px' }}>
            {showFull ? 'Hide full rationale' : 'Show full rationale'}
          </button>
          {showFull && <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0B2545' }}>Why {question.correct_answer} is better</p>
              <p className="text-sm text-gray-700 leading-relaxed">{question.rationale_correct}</p>
            </div>
            {!isCorrect && <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#EF4444' }}>Why {selected} does not fit</p>
              <p className="text-sm text-gray-700 leading-relaxed">{question.rationale_incorrect[selected!]}</p>
            </div>}
          </div>}

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="px-2 py-1 rounded bg-gray-100">{nclexCategoryLabel(question.nclex_category)}</span>
          </div>
          <p className="text-center text-[10px] leading-snug text-gray-400">
            Supplement explanation • AI-assisted • Not independently clinically validated • Misses here do not schedule bank reviews
          </p>
          <button type="button" onClick={reset} className="w-full rounded-lg py-3 text-sm font-bold text-white" style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}>
            Try again
          </button>
        </div>}
    </section>
  </div>
}
