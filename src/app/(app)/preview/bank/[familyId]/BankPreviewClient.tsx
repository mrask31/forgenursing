'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SourceCheckedPacketData } from '@/lib/learning/source-checked-content'
import QuizQuestion from '../../../quiz/components/QuizQuestion'
import QuizRationale from '../../../quiz/components/QuizRationale'
import QuizProgress from '../../../quiz/components/QuizProgress'

export default function BankPreviewClient({ packet, initialRole = 'original' }: { packet: SourceCheckedPacketData; initialRole?: 'original' | 'retry' | 'review' }) {
  const [role, setRole] = useState<'original' | 'retry' | 'review'>(initialRole)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const question = role === 'original' ? packet.original : role === 'retry' ? packet.retry : packet.reviews[0]
  const reset = () => { setSelected(null); setSubmitted(false) }
  const changeRole = (next: typeof role) => { setRole(next); reset() }

  return <div className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
    <aside className="mb-5 space-y-2 text-xs text-slate-600" aria-label="Staging preview controls">
      <p><strong>Staging preview · {packet.packet_id}</strong> · No score or review schedule is saved.</p>
      <div className="flex flex-wrap gap-3">
        <label>Variant <select aria-label="Question variant" value={role} onChange={e => changeRole(e.target.value as typeof role)} className="rounded border p-1">
          <option value="original">Q001 Original</option><option value="retry">Q002 Immediate retry</option><option value="review">Q003 Delayed review</option>
        </select></label>
        <button type="button" onClick={reset} className="underline">Reset question</button>
        <Link href="/preview/bank" className="underline">All families</Link>
      </div>
    </aside>
    <section className="space-y-5" aria-label="Learner question preview">
      <QuizProgress current={0} total={1} />
      {!submitted ? <QuizQuestion sourceChecked stem={question.question_stem} options={question.options}
        selectedAnswer={selected} onSelect={setSelected} onSubmit={() => { if (selected) setSubmitted(true) }} submitting={false} />
        : <QuizRationale key={role} previewOnly sourceChecked sources={packet.references}
          isCorrect={selected === question.correct_answer} userAnswer={selected!} correctAnswer={question.correct_answer}
          options={question.options} rationaleCorrect={question.rationale_correct} rationaleIncorrect={question.rationale_incorrect}
          nclexCategory={question.nclex_category} difficulty={question.difficulty} keyCue={question.key_cue}
          oneLineFix={question.one_line_fix} sessionId="staging-preview" questionId={`${packet.packet_id}:${role}`}
          questionIndex={0} onNext={reset} isLast={false}
          onRetestWeakness={role === 'original' && selected !== question.correct_answer ? () => changeRole('retry') : undefined} />}
    </section>
  </div>
}
