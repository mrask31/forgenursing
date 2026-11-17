import batch6 from '../../content/supplement-preview/batch-6.json'

/**
 * Supplement questions are NOT part of the audited bank (content/source-checked-bank.json).
 * They are screens-only: no scoring, no attempt storage, no review scheduling.
 */
export type SupplementQuestion = {
  id: string
  q: string
  topic: string
  nclex_category: string
  question_stem: string
  options: { label: string; text: string }[]
  correct_answer: string
  rationale_correct: string
  rationale_incorrect: Record<string, string>
}

export const SUPPLEMENT_BATCH_6: { batch: string; label: 'supplement'; questions: SupplementQuestion[] } =
  batch6 as unknown as { batch: string; label: 'supplement'; questions: SupplementQuestion[] }

export function supplementQuestion(id: string) {
  return SUPPLEMENT_BATCH_6.questions.find(question => question.id === id) ?? null
}
