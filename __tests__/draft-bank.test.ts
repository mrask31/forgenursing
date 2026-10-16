import { describe, expect, it } from 'vitest'
import raw from '../content/drafts/question-bank-v1.json'
import { draftContentHash, parseDraftBank, draftImportReport, selectDraftVariant, stageQuestion } from '../src/lib/learning/draft-bank'
import { validatePublication } from '../src/lib/learning/clinical-content'

const bank = parseDraftBank(raw)
const copy = () => structuredClone(bank)
describe('draft bank staging boundary', () => {
  it('stages all 180 questions with their exact key, options and choice-specific feedback', () => {
    expect(bank.questions).toHaveLength(180)
    expect(bank.families).toHaveLength(60)
    for (const q of bank.questions) {
      const row = stageQuestion(q)
      expect(row.correct_answer).toBe(q.answer)
      expect(row.options.find(o => o.label === row.correct_answer)?.text).toBe(q.options[q.answer])
      for (const label of ['A', 'B', 'C', 'D'] as const) expect(label === q.answer ? row.rationale_correct : row.rationale_incorrect[label]).toBe(q.rationales[label])
      expect(row).not.toHaveProperty('difficulty')
      expect(row.clinical_content_id).toBeNull()
    }
  })
  it('keeps drafts out of the existing publication boundary and reports concrete gaps', () => {
    const report = draftImportReport(bank)
    expect(report.publishable_count).toBe(0)
    expect(report.held_item_ids).toEqual([])
    expect(report.families.every(f => f.delayed_variant_count === 1 && f.runtime_distinction_id !== null)).toBe(true)
    expect(() => validatePublication(bank, {})).toThrow()
    const promoted = copy(); promoted.questions[0].eligible_for_production = true as never
    expect(() => parseDraftBank(promoted)).toThrow()
  })
  it('rejects stale hashes, mismatched parents and family tags', () => {
    const changed = copy(); changed.questions[0].rationales.A = 'Changed'
    expect(() => parseDraftBank(changed)).toThrow('hash')
    const parent = copy(); parent.questions[1].parent_original_id = 'qb1-d02'
    expect(() => parseDraftBank(parent)).toThrow('parent')
    const tag = copy(); tag.questions[1].distinction = 'some-other-lesson'
    expect(() => parseDraftBank(tag)).toThrow('metadata')
  })
  it('rejects duplicate IDs, normalized stems/options, incomplete families and missing rationales', () => {
    const duplicate = copy(); duplicate.questions.push(duplicate.questions[0])
    expect(() => parseDraftBank(duplicate)).toThrow('Duplicate')
    const stem = copy(); stem.questions[1].question = '  ' + stem.questions[0].question.toUpperCase()
    stem.questions[1].content_sha256 = draftContentHash(stem.questions[1])
    expect(() => parseDraftBank(stem)).toThrow('Duplicate')
    const options = copy(); options.questions[0].options.A = options.questions[0].options.B
    expect(() => parseDraftBank(options)).toThrow('Duplicate options')
    const missing = copy(); missing.questions.pop()
    expect(() => parseDraftBank(missing)).toThrow('Incomplete')
    const rationale = copy(); rationale.questions[0].rationales.A = ''
    expect(() => parseDraftBank(rationale)).toThrow()
  })
  it('does not recycle seen variants or select unrelated families', () => {
    for (const f of bank.families) {
      const seen = new Set<string>()
      for (const role of ['original', 'retry', 'delayed_review'] as const) {
        const q = selectDraftVariant(bank, f.family_id, role, seen)!
        expect(q.family_id).toBe(f.family_id); expect(q.role).toBe(role)
        seen.add(q.id)
        expect(selectDraftVariant(bank, f.family_id, role, seen)).toBeNull()
      }
    }
    expect(selectDraftVariant(bank, 'unknown', 'retry', new Set())).toBeNull()
  })
  it('applies the existing safety hold even to draft content with a fresh hash', () => {
    const held = copy(); held.questions[1].question = 'An unsafe COPD example'
    held.questions[1].content_sha256 = draftContentHash(held.questions[1])
    const parsed = parseDraftBank(held)
    expect(selectDraftVariant(parsed, 'qb1-d01', 'retry', new Set())).toBeNull()
    expect(draftImportReport(parsed).held_item_ids).toContain('qb1-d01-r1')
  })
  it('retains balanced keys within each role', () => {
    for (const role of ['original', 'retry', 'delayed_review']) for (const label of ['A', 'B', 'C', 'D']) {
      expect(bank.questions.filter(q => q.role === role && q.answer === label)).toHaveLength(15)
    }
  })
})
