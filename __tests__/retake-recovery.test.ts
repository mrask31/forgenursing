import { describe, expect, it } from 'vitest'
import { practiceStage, practiceTrend, selectedAnswerComparison } from '../src/lib/practice-progress'
import { cprPracticeCategory, readRetakePlan, retakePlanSchema } from '../src/lib/retake-plan'

describe('honest practice progress', () => {
  it('never describes all-wrong answers as improvement', () => {
    expect(practiceStage(5, 0)).toBe('Building a baseline')
    expect(practiceStage(20, 0)).toBe('Keep practicing and reviewing')
    expect(practiceTrend(Array(20).fill(false))).toBe('steady')
  })
  it('requires two complete comparison samples', () => {
    expect(practiceTrend([true, true, true, false, false])).toBe('insufficient')
    expect(practiceTrend([true, true, true, false, false, false])).toBe('improving')
    expect(practiceTrend([false, false, false, true, true, true])).toBe('declining')
    expect(practiceTrend(Array(6).fill(true))).toBe('steady')
  })
  it('describes the selected option without assigning another option’s rationale', () => {
    const comparison = selectedAnswerComparison('A', [{ label: 'A', text: 'UAP' }, { label: 'C', text: 'New graduate RN' }], 'D')
    expect(comparison).toContain('A: UAP')
    expect(comparison).toContain('answer D')
    expect(comparison).not.toContain('New graduate')
  })
})

describe('optional retake preferences', () => {
  it('allows starting without a date, prior prep, or report', () => {
    expect(retakePlanSchema.parse({ completed: true })).toEqual({ completed: true, targetDate: '', previousPrep: '', difficulty: null, cpr: {} })
    expect(cprPracticeCategory(readRetakePlan(undefined))).toBeNull()
  })
  it('prioritizes Below ahead of Near while mapping legacy category names', () => {
    expect(cprPracticeCategory(readRetakePlan({ cpr: { 'Management of Care': 'Near', 'Pharmacological and Parenteral Therapies': 'Below' } }))).toBe('Pharmacological Therapies')
    expect(cprPracticeCategory(readRetakePlan({ cpr: { 'Safety and Infection Prevention and Control': 'Below' } }))).toBe('Safety and Infection Control')
  })
  it('does not turn Above-only ratings into a weakness', () => {
    expect(cprPracticeCategory(readRetakePlan({ cpr: { 'Management of Care': 'Above' } }))).toBeNull()
  })
  it('rejects unknown report categories, ratings, and oversized text', () => {
    expect(retakePlanSchema.safeParse({ cpr: { Unknown: 'Below' } }).success).toBe(false)
    expect(retakePlanSchema.safeParse({ cpr: { 'Management of Care': 'Fail' } }).success).toBe(false)
    expect(retakePlanSchema.safeParse({ previousPrep: 'a'.repeat(301) }).success).toBe(false)
    expect(retakePlanSchema.safeParse({ targetDate: 'garbage' }).success).toBe(false)
  })
})
