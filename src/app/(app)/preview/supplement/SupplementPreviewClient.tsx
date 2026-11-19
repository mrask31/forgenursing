'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SupplementQuestion } from '@/lib/supplement-preview'
import QuizQuestion from '../../quiz/components/QuizQuestion'
import QuizProgress from '../../quiz/components/QuizProgress'
import SupplementFeedback from './SupplementFeedback'

function SupplementBadge() {
  return <p className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600" data-testid="supplement-label">
    Supplement question
  </p>
}

export default function SupplementPreviewClient({ question }: { question: SupplementQuestion }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const reset = () => { setSelected(null); setSubmitted(false) }

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
        : <SupplementFeedback question={question} selected={selected!} onReset={reset} />}
    </section>
  </div>
}
