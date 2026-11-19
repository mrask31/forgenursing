'use client'

import { useState } from 'react'
import { nclexCategoryLabel } from '@/lib/nclex-categories'
import type { SupplementQuestion } from '@/lib/supplement-preview'

export default function SupplementFeedback({ question, selected, onReset }: { question: SupplementQuestion; selected: string; onReset: () => void }) {
  const [showFull, setShowFull] = useState(false)
  const isCorrect = selected === question.correct_answer
  const optionText = (label: string | null) => question.options.find(option => option.label === label)?.text ?? ''
  const wrongOptions = question.options.filter(option => option.label !== question.correct_answer)

  return <div className="space-y-4 pb-6">
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
        <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>{question.rationale_incorrect[selected]}</p>
      </div>}
    </div>

    <div className="rounded-xl border border-[#DDE5EE] bg-white p-4 space-y-3" data-testid="other-options-feedback">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9A3412' }}>Why the other options do not fit</p>
      <ul className="space-y-3">
        {wrongOptions.map(option => <li key={option.label}>
          <p className="text-xs font-bold" style={{ color: '#0B2545' }}>{option.label}) {option.text}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">{question.rationale_incorrect[option.label]}</p>
        </li>)}
      </ul>
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
        <p className="text-sm text-gray-700 leading-relaxed">{question.rationale_incorrect[selected]}</p>
      </div>}
    </div>}

    <div className="flex items-center gap-3 text-xs text-gray-400">
      <span className="px-2 py-1 rounded bg-gray-100">{nclexCategoryLabel(question.nclex_category)}</span>
    </div>
    <p className="text-center text-[10px] leading-snug text-gray-400">
      Supplement explanation • AI-assisted • Not independently clinically validated • Misses here do not schedule bank reviews
    </p>
    <button type="button" onClick={onReset} className="w-full rounded-lg py-3 text-sm font-bold text-white" style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}>
      Try again
    </button>
  </div>
}
