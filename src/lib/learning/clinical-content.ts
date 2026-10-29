import { z } from 'zod'
import { createHash } from 'node:crypto'
import { distinctionId } from './distinctions'

const text = z.string().trim().min(1)
const labels = ['A', 'B', 'C', 'D'] as const
export const ClinicalQuestion = z.object({
  question_stem: text, options: z.array(z.object({ label: z.enum(labels), text })).length(4),
  correct_answer: z.enum(labels), rationale_correct: text, rationale_incorrect: z.record(z.string(), text),
  nclex_category: text, difficulty: z.number().int().min(1).max(5), key_cue: text, one_line_fix: text,
}).strict().superRefine((q, ctx) => {
  if (new Set(q.options.map(o => o.label)).size !== 4) ctx.addIssue({ code: 'custom', message: 'Options must have distinct A–D labels' })
  for (const label of labels) if (label !== q.correct_answer && !q.rationale_incorrect[label]) ctx.addIssue({ code: 'custom', message: `Missing rationale for ${label}` })
})
export const ClinicalPacket = z.object({
  packet_id: text, version: z.number().int().positive(), distinction_id: text.refine(v => !!distinctionId(v), 'Unknown distinction'),
  learner_level: z.literal('NCLEX-RN'), taxonomy_version: text,
  provenance: z.object({ model: text, prompt_version: text, generated_at: z.string().datetime() }).strict(),
  references: z.array(z.object({ title: text, url: z.string().url().startsWith('https://'), section: text, checked_at: z.string().date() }).strict()).min(1),
  original: ClinicalQuestion, retry: ClinicalQuestion, reviews: z.array(ClinicalQuestion).min(3).max(10),
}).strict().superRefine((p, ctx) => {
  const stems = [p.original, p.retry, ...p.reviews].map(q => q.question_stem.toLowerCase().replace(/\s+/g, ' ').trim())
  if (new Set(stems).size !== stems.length) ctx.addIssue({ code: 'custom', message: 'Every variant must have a distinct stem; reviewer must also verify clinical transfer' })
})
export type ClinicalPacketData = z.infer<typeof ClinicalPacket>
export function packetHash(packet: ClinicalPacketData) {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical((value as Record<string, unknown>)[k])])) : value
  return createHash('sha256').update(JSON.stringify(canonical(packet))).digest('hex')
}
export const ClinicalApproval = z.object({
  packet_sha256: z.string().regex(/^[a-f0-9]{64}$/), rubric_version: z.literal('0.2'), reviewer_name: text,
  license_jurisdiction: text, license_verification_record: text, license_verified_at: z.string().date(),
  reviewer_independent: z.literal(true), approved_at: z.string().datetime(), decision: z.literal('approved'),
  all_criteria_resolved: z.literal(true), review_record: text,
}).strict()
export function validatePublication(rawPacket: unknown, rawApproval: unknown) {
  const packet = ClinicalPacket.parse(rawPacket), approval = ClinicalApproval.parse(rawApproval)
  if (approval.packet_sha256 !== packetHash(packet)) throw new Error('Approval does not match this exact packet')
  if (Date.parse(approval.approved_at) > Date.now()) throw new Error('Approval cannot be future dated')
  return { packet, approval }
}
