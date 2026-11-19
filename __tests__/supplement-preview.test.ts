import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { SUPPLEMENT_BATCH_6, supplementQuestion } from '@/lib/supplement-preview'

const bank = JSON.parse(readFileSync('content/source-checked-bank.json', 'utf8'))

describe('batch 6 supplement questions (screens-only)', () => {
  it('carries six labeled supplement questions q37–q42', () => {
    expect(SUPPLEMENT_BATCH_6.label).toBe('supplement')
    expect(SUPPLEMENT_BATCH_6.questions.map(q => q.q)).toEqual(['q37', 'q38', 'q39', 'q40', 'q41', 'q42'])
    expect(SUPPLEMENT_BATCH_6.questions.map(q => q.id)).toEqual(['q37', 'q38', 'q39', 'q40', 'q41', 'q42'].map(q => `supp-b6-${q}`))
    expect(supplementQuestion('supp-b6-q40')?.q).toBe('q40')
    expect(supplementQuestion('nope')).toBeNull()
  })

  it('has four options, a valid key, and distinct feedback for every wrong option', () => {
    for (const question of SUPPLEMENT_BATCH_6.questions) {
      expect(question.options.map(option => option.label)).toEqual(['A', 'B', 'C', 'D'])
      expect(question.options.map(option => option.label)).toContain(question.correct_answer)
      const wrong = question.options.map(option => option.label).filter(label => label !== question.correct_answer)
      expect(Object.keys(question.rationale_incorrect).sort()).toEqual(wrong)
      expect(new Set(Object.values(question.rationale_incorrect)).size).toBe(3)
      expect(question.rationale_correct.trim()).not.toBe('')
    }
  })

  it('stays out of the audited bank so its 80-packet / 240-question count is unchanged', () => {
    expect(bank).toHaveLength(80)
    const stems = new Set(bank.flatMap((row: any) => [row.packet.original, row.packet.retry, ...row.packet.reviews].map((q: any) => q.question_stem)))
    for (const question of SUPPLEMENT_BATCH_6.questions) expect(stems.has(question.question_stem)).toBe(false)
    expect(JSON.stringify(bank)).not.toContain('supp-b6-')
  })
})

describe('supplement feedback screen renders every wrong-option explanation', () => {
  it('shows all three wrong-option explanations for every question, whichever answer is selected', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: SupplementFeedback } = await import('../src/app/(app)/preview/supplement/SupplementFeedback')
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
    for (const question of SUPPLEMENT_BATCH_6.questions) {
      for (const option of question.options) {
        const html = renderToStaticMarkup(createElement(SupplementFeedback, { question, selected: option.label, onReset: () => {} }))
        for (const [label, text] of Object.entries(question.rationale_incorrect)) {
          expect(html, `${question.id} selected ${option.label}: missing ${label} feedback`).toContain(escape(text))
        }
        expect(html).toContain('Why the other options do not fit')
      }
    }
  })

  it('q37 feedback includes the vitamin K explanations even when the correct answer is selected', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: SupplementFeedback } = await import('../src/app/(app)/preview/supplement/SupplementFeedback')
    const question = supplementQuestion('supp-b6-q37')!
    const html = renderToStaticMarkup(createElement(SupplementFeedback, { question, selected: 'A', onReset: () => {} }))
    expect(html).toContain('vitamin K is a provider-ordered decision')
    expect(html).toContain('dietary vitamin K works against warfarin')
  })
})
