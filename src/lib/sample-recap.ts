import { z } from 'zod'
import type { TrapResult } from './answer-trap'

export const SAMPLE_RECAP_KEY = 'forgenursing:sample-recap:v1'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const text = z.string().max(12000)
const resultSchema = z.object({
  score: z.number().int().min(0), total: z.number().int().positive().max(20),
  all_correct: z.boolean(), review_topics: z.array(text).max(20).optional(),
  detected_trap: text.nullable(), detected_trap_display: text.nullable(),
  trap_explanation: text.nullable(), trap_why_tempting: text.nullable(),
  trap_what_to_practice: text.nullable(), share_text: text,
}).refine(result => result.score <= result.total && result.all_correct === (result.score === result.total))
const recapSchema = z.object({
  version: z.literal(1), completedAt: z.number().finite(),
  sessionId: z.string().min(1).max(200), anonymousId: z.string().min(1).max(200),
  result: resultSchema,
  retryOutcomes: z.record(z.object({topic:text,correct:z.boolean()})),
})
export type SampleRecap = z.infer<typeof recapSchema>
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>

export function saveSampleRecap(storage: Storage, recap: {
  sessionId: string; anonymousId: string; result: TrapResult;
  retryOutcomes: SampleRecap['retryOutcomes'];
}, now = Date.now()): boolean {
  try {
    const parsed = recapSchema.parse({...recap,version:1,completedAt:now})
    storage.setItem(SAMPLE_RECAP_KEY, JSON.stringify(parsed))
    return true
  } catch { return false }
}
export function readSampleRecap(storage: Storage, now = Date.now()): SampleRecap | null {
  try {
    const raw = storage.getItem(SAMPLE_RECAP_KEY)
    if (!raw) return null
    const parsed = recapSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || now - parsed.data.completedAt > MAX_AGE_MS || parsed.data.completedAt > now + 60000) {
      storage.removeItem(SAMPLE_RECAP_KEY)
      return null
    }
    return parsed.data
  } catch { return null }
}
export function clearSampleRecap(storage: Storage): void {
  try { storage.removeItem(SAMPLE_RECAP_KEY) } catch { /* Storage is optional. */ }
}
