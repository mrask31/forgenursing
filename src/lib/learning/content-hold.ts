/** Temporary release hold from the 2026-10-14 clinical QA safety failure.
 * This is a containment rule, NOT a clinical accuracy classifier.
 * Do not remove without independent review of the affected question family.
 * An approval ID alone never bypasses this incident hold.
 */
export const CONTENT_HOLD_CODE = 'clinical_review_pending'
export const CONTENT_HOLD_MESSAGE = 'This question or session is temporarily unavailable while its clinical content is reviewed. Your saved answers have been retained. Please choose a different practice topic.'

const family = /\bCOPD\b|chronic\s+obstructive|\bemphysema\b|chronic\s+bronchitis/i
const clinicalFields = ['question_stem', 'options', 'rationale_correct', 'rationale_incorrect', 'key_cue', 'why_correct_short', 'why_wrong_short', 'one_line_fix', 'reasoning_trap', 'fix_instruction', 'retest_focus'] as const

export function contentOnHold(question: unknown): boolean {
  if (!question || typeof question !== 'object') return false
  const record = question as Record<string, unknown>
  return clinicalFields.some(field => family.test(JSON.stringify(record[field]) ?? ''))
}

export function contentHoldPayload() {
  return { error: CONTENT_HOLD_MESSAGE, code: CONTENT_HOLD_CODE }
}
