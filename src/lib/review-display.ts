export const REVIEW_ELIGIBILITY_COPY = 'A missed original from an eligible source-checked question family schedules a fresh review 24 hours later. Generated questions and retry misses do not create scheduled reviews. Review scores stay separate from original and retry scores.'
export type ReviewSummary = { available: boolean; due: {id:string}[]; next_due_at: string | null; exhausted_count?: number }
export function reviewSummary(status: ReviewSummary): string {
  if (status.due.length) return 'Try a fresh related question about an earlier miss. It is scored separately.'
  if (status.next_due_at) return `Next review: ${new Intl.DateTimeFormat(undefined, { year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short' }).format(new Date(status.next_due_at))}.`
  if (status.exhausted_count) return 'You have finished the available delayed questions for earlier misses. Saved explanations remain available; more reviews need fresh content.'
  if (status.available) return 'Nothing due yet. Eligible missed originals will appear here when due.'
  return 'No eligible question sets are available for scheduled review yet. You can revisit your saved explanations.'
}
