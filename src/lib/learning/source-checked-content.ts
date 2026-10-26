import { z } from 'zod'
import { normalizeNclexCategory as normalizeBankCategory } from '@/lib/nclex-categories'
export { normalizeBankCategory }
import { ClinicalQuestion } from './clinical-content'
import { canonicalHash, type DraftBank } from './draft-bank'
import { contentOnHold } from './content-hold'

const text = z.string().trim().min(1)
export const SourceCheckedPacket = z.object({
  packet_id: text, version: z.number().int().positive(), distinction_id: text,
  learner_level: z.literal('NCLEX-RN'), publication_kind: z.literal('ai_source_checked'),
  independent_clinical_validation: z.literal(false), difficulty_status: z.literal('provisional'),
  source_check_date: z.string().date(), draft_bank_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  editorial_method: z.literal('AI-assisted source checking and editorial review'),
  focus: text, references: z.array(z.object({ title: text, url: z.string().url().startsWith('https://') }).strict()).min(1),
  original: ClinicalQuestion, retry: ClinicalQuestion, reviews: z.array(ClinicalQuestion).length(1),
}).strict().superRefine((packet, ctx) => {
  const items = [packet.original, packet.retry, ...packet.reviews]
  if (new Set(items.map(q => q.question_stem.toLowerCase().replace(/\s+/g, ' ').trim())).size !== 3) ctx.addIssue({ code: 'custom', message: 'Variants must have distinct stems' })
  if (items.some(contentOnHold)) ctx.addIssue({ code: 'custom', message: 'Content incident hold applies' })
})
export type SourceCheckedPacketData = z.infer<typeof SourceCheckedPacket>
export type TeachingPoint = { takeaway: string; cues: [string, string, string]; focus?: string }
export function sourceCheckedPackets(bank: DraftBank, points: Record<string, TeachingPoint>) {
  const bankHash = canonicalHash(bank)
  return bank.families.map(family => {
    const point = points[family.family_id]
    if (!point?.takeaway || point.cues.length !== 3 || point.cues.some(cue => !cue.trim())) throw new Error(`Missing teaching points: ${family.family_id}`)
    const category = normalizeBankCategory(family.category)
    const roles = ['original', 'retry', 'delayed_review'] as const
    const items = roles.map((role, index) => {
      const q = bank.questions.find(item => item.family_id === family.family_id && item.role === role)!
      return {
        question_stem: q.question, options: Object.entries(q.options).map(([label, value]) => ({ label, text: value })),
        correct_answer: q.answer, rationale_correct: q.rationales[q.answer],
        rationale_incorrect: Object.fromEntries(Object.entries(q.rationales).filter(([label]) => label !== q.answer)),
        nclex_category: category, difficulty: 2, key_cue: point.cues[index], one_line_fix: point.takeaway,
      }
    })
    const focus = point.focus || (family.family_id.startsWith('qb1-d') ? 'Delegation' : family.family_id.startsWith('qb2-') ? 'Medication reasoning'
      : category === 'Psychosocial Integrity' ? 'Therapeutic communication'
      : category === 'Safety and Infection Control' ? 'Safety'
      : category === 'Physiological Adaptation' || category === 'Reduction of Risk Potential' ? 'Priority-setting' : 'Patient education')
    return SourceCheckedPacket.parse({
      packet_id: family.family_id, version: bank.revision, distinction_id: family.distinction,
      learner_level: 'NCLEX-RN', publication_kind: 'ai_source_checked', independent_clinical_validation: false,
      difficulty_status: 'provisional', source_check_date: bank.date, draft_bank_sha256: bankHash,
      editorial_method: 'AI-assisted source checking and editorial review', focus,
      references: family.sources.map(url => ({ title: new URL(url).hostname.replace(/^www\./, ''), url })),
      original: items[0], retry: items[1], reviews: [items[2]],
    })
  })
}
