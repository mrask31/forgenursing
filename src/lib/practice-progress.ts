export type PracticeTrend = 'insufficient' | 'improving' | 'steady' | 'declining'

// Newest answers first. Two complete, non-overlapping samples are required.
// This describes observed practice accuracy, never exam readiness or mastery.
export function practiceTrend(answers: boolean[]): PracticeTrend {
  if (answers.length < 6) return 'insufficient'
  const recent = answers.slice(0, 3).filter(Boolean).length
  const earlier = answers.slice(3, 6).filter(Boolean).length
  return recent > earlier ? 'improving' : recent < earlier ? 'declining' : 'steady'
}
export function practiceStage(attempted: number, improving: number): string {
  if (attempted < 6) return 'Building a baseline'
  return improving > 0 ? 'Recent improvement observed' : 'Keep practicing and reviewing'
}
export function selectedAnswerComparison(selected: string, options: {label: string; text: string}[], correct: string): string {
  const option = options.find(item => item.label === selected)
  return `You chose ${selected}${option ? `: ${option.text}` : ''}. Compare this choice with answer ${correct} and the key cue above.`
}
