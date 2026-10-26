import sourceCheckedLabels from './source-checked-distinction-labels.json'
/** Versioned, intentionally narrow concepts. Broad mistake categories are not distinctions. */
export const DISTINCTIONS = {
  ...sourceCheckedLabels,
  'potassium-direction-ecg': 'Distinguish ECG patterns associated with elevated versus low potassium; ECG alone cannot exclude an imbalance.',
  'uap-routine-stable-care': 'Match routine data collection on stable patients to explicitly stated UAP training; retain RN assessment and teaching.',
  'new-urgent-symptoms': 'Prioritize a new potentially urgent change over routine care when the scenario supplies the necessary cues.',
  'digoxin-toxicity-cues': 'Recognize the specified digoxin adverse-effect cues and the need for evaluation before further administration.',
  'ppe-contamination-removal': 'Avoid self-contamination when removing the PPE specified in a scenario.',
  'staff-scope-stability': 'Match RN/LPN/UAP assignments to stated scope, competence and patient stability.',
  'threatened-airway-cues': 'Recognize signs of a threatened airway and prioritize prompt escalation over routine care.',
  'mealtime-insulin-food-availability': 'Check meal availability and the specified insulin timing before administration.',
} as const
export type DistinctionId = keyof typeof DISTINCTIONS
export const TAXONOMY_VERSION = '2026-10-26-v4'
export function distinctionId(value: unknown): DistinctionId | null {
  return typeof value === 'string' && Object.hasOwn(DISTINCTIONS, value) ? value as DistinctionId : null
}
export const DISTINCTION_PROMPT = `\nFor measurement only, include distinction_id: one key from this controlled taxonomy only when the question directly tests that exact concept; otherwise null. Do not infer it from the broad category. ${JSON.stringify(DISTINCTIONS)}\n`
export function opportunityId(experience: 'free_sample' | 'signed_in', originalId: string, sessionId?: string | null) {
  return experience === 'free_sample' ? `sample:${sessionId}:${originalId}` : `practice:${originalId}`
}
export function loopProperties(question: { id: string; source_question_id?: string | null; distinction_id?: string | null; clinical_content_id?: string | null; source_checked_content_id?: string | null; learning_attempt?: number }, sessionId: string) {
  const source = question.source_question_id || question.id
  return { loop_version: 2, experience: 'signed_in', retry_ui_version: 'retry-first-v2', quiz_session_id: sessionId,
    question_id: question.id, source_question_id: question.source_question_id || null,
    retry_opportunity_id: opportunityId('signed_in', source), distinction_id: distinctionId(question.distinction_id),
    distinction_status: question.source_checked_content_id ? 'ai_source_checked' : question.clinical_content_id ? 'reviewed' : distinctionId(question.distinction_id) ? 'provisional' : 'unmapped',
    content_version: question.source_checked_content_id || question.clinical_content_id || null, attempt: question.learning_attempt || 1 }
}
