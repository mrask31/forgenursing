import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import batch from '../content/drafts/question-bank-5.json'
import compiled from '../content/source-checked-bank.json'
import { parseDraftBank } from '../src/lib/learning/draft-bank'
import { NCLEX_CATEGORIES, nclexCategoryProgress } from '../src/lib/nclex-categories'

it('preserves the blind-audited stems, keys and options except the two authorized distractors', () => {
  const submitted = readFileSync('docs/clinical/bank-5-audit/author-keys.md', 'utf8')
  const parsed = parseDraftBank(batch)
  expect(parsed.families).toHaveLength(10)
  expect(parsed.questions).toHaveLength(30)
  for (const q of parsed.questions) {
    const heading = `## ${q.id} · `
    const section = submitted.slice(submitted.indexOf(heading)).split('\n\n## ')[0]
    expect(section).toContain(q.question)
    expect(section).toContain(`**Author key: ${q.answer}**`)
    for (const label of ['A','B','C','D'] as const) {
      if (q.id === 'qb5-h10' && (label === 'B' || label === 'C')) continue
      expect(section).toContain(`${label}. ${q.options[label]}`)
      expect(section).toContain(q.rationales[label])
    }
  }
  const edited = parsed.questions.find(q => q.id === 'qb5-h10')!
  expect(edited.answer).toBe('D')
  expect(edited.options.B).toBe('The tracing indicates hyperkalemia, because flattened T waves reflect potassium excess.')
  expect(edited.options.C).toBe('The client has hypokalemia, but prominent U waves show the potassium is returning to normal.')
  expect(edited.rationales.C).toContain('do not show that potassium is returning to normal')
})

it('uses the exact live categories and reconciles original-only category counts for all ten families', () => {
  const packets = compiled.filter(row => row.packet.packet_id.startsWith('qb5-')).map(row => row.packet)
  const counts: Record<string, number> = {}
  for (const p of packets) {
    const category = p.original.nclex_category!
    expect(NCLEX_CATEGORIES).toContain(category)
    expect(p.retry.nclex_category).toBe(category)
    expect(p.reviews[0].nclex_category).toBe(category)
    counts[category] = (counts[category] || 0) + 1
  }
  expect(counts).toEqual({'Basic Care and Comfort':2,'Psychosocial Integrity':2,'Health Promotion and Maintenance':2,'Reduction of Risk Potential':2,'Pharmacological Therapies':1,'Physiological Adaptation':1})
  const originals = packets.map((p, i) => ({nclex_category:p.original.nclex_category,is_correct:i !== 9}))
  const progress = nclexCategoryProgress(originals)
  expect(progress.reduce((n, c) => n + c.attempted, 0)).toBe(10)
  expect(progress.reduce((n, c) => n + c.correct, 0)).toBe(9)
  expect(progress.find(c => c.category === 'Physiological Adaptation')).toMatchObject({attempted:1,correct:0})
})
