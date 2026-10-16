import { z } from 'zod'
import type { AnswerFeedback } from './answer-trap'

const feedbackSchema = z.object({
  is_correct: z.boolean(), correct_answer: z.enum(['A', 'B', 'C', 'D']),
  trap_type: z.string(), trap_display_name: z.string(), key_cue: z.string(),
  why_correct_short: z.string(), why_wrong_short: z.string(), one_line_fix: z.string(),
  distinction_id: z.string().nullable().optional(), retry_available: z.boolean().optional(),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
})
export class AnswerSubmissionError extends Error {
  constructor(readonly code: 'network' | 'timeout' | 'http' | 'invalid_response', readonly requestId: string, readonly status: number | null = null) {
    super(`We couldn’t confirm your answer was saved. Your choice is still selected—please try again. Reference: ${requestId}`)
    this.name = 'AnswerSubmissionError'
  }
}

/** No automatic replay: the learner keeps their selection and decides when to retry. */
export async function submitSampleAnswer(payload: { session_id: string; question_id: string; question_index: number; selected_answer: string }): Promise<AnswerFeedback> {
  const requestId = crypto.randomUUID()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  let status: number | null = null
  try {
    const response = await fetch('/api/answer-trap-check/answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId },
      body: JSON.stringify(payload), signal: controller.signal,
    })
    status = response.status
    if (!response.ok) throw new AnswerSubmissionError('http', requestId, status)
    const parsed = feedbackSchema.safeParse(await response.json().catch(() => null))
    if (!parsed.success) throw new AnswerSubmissionError('invalid_response', requestId, status)
    return parsed.data
  } catch (error) {
    if (error instanceof AnswerSubmissionError) throw error
    throw new AnswerSubmissionError(controller.signal.aborted ? 'timeout' : 'network', requestId, status)
  } finally {
    clearTimeout(timer)
  }
}
