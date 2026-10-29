export const EVIDENCE_RECHECK_MESSAGE = 'I could not give a sufficiently supported explanation for this question. Please check the complete question and its source with your instructor. You can share the relevant source passage so we can compare the reasoning without guessing at legal rules or exam standards.'
export const INCOMPLETE_TUTOR_MESSAGE = 'The explanation did not finish, so I have not shown a partial answer. Please try again.'

export function isTutorFallback(content: string): boolean {
  return [EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE].includes(content.trim())
}
