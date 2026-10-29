export const REVIEW_ELIGIBILITY_COPY = 'A missed original from an eligible source-checked question family adds a fresh review you can take anytime. Revisiting it after about 24 hours is a recommendation, not a lock. Generated questions and retry misses do not create scheduled reviews. Review scores stay separate from original and retry scores.'
export type ReviewSummary = { available: boolean; due: {id:string}[]; next_due_at: string | null; exhausted_count?: number;pending_count?:number }
export function reviewSummary(status: ReviewSummary): string {
  if (status.pending_count) return `${status.pending_count} review${status.pending_count===1?'':'s'} available anytime. Results are scored separately; the suggested timing is optional.`
  if (status.due.length) return 'Try a fresh related question about an earlier miss. It is scored separately.'
  if (status.next_due_at) return `Next review: ${new Intl.DateTimeFormat(undefined, { year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short' }).format(new Date(status.next_due_at))}.`
  if (status.exhausted_count) return 'You have finished the available delayed questions for earlier misses. Saved explanations remain available; more reviews need fresh content.'
  if (status.available) return 'Nothing due yet. Eligible missed originals appear here immediately; suggested review timing is optional.'
  return 'No eligible question sets are available for scheduled review yet. You can revisit your saved explanations.'
}
