/** Operator-only staging. No runtime route or publication function imports this module. */
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { distinctionId } from './distinctions'
import { contentOnHold } from './content-hold'

const text = z.string().trim().min(1)
const labels = ['A', 'B', 'C', 'D'] as const
const choices = z.object({ A: text, B: text, C: text, D: text }).strict()
const urls = z.array(z.string().url().startsWith('https://')).min(1)
export const DraftItem = z.object({
  id: text, family_id: text, role: z.enum(['original', 'retry', 'delayed_review']),
  question: text, options: choices, answer: z.enum(labels), rationales: choices,
  distinction: text, category: text, source_urls: urls,
  status: z.literal('draft_ai_reviewed'), eligible_for_production: z.literal(false),
  independent_clinical_validation: z.literal(false), source_check_date: z.string().date(),
  parent_original_id: text.nullable(), content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
export type DraftQuestion = z.infer<typeof DraftItem>
const Bank = z.object({
  schema_version: z.literal('draft-2'), revision: z.number().int().positive(), date: z.string().date(),
  hash_algorithm: z.literal('sha256-canonical-json-utf8-v1'),
  status: z.literal('draft_not_published'), scheduling_implemented: z.literal(false),
  families: z.array(z.object({ family_id: text, distinction: text, category: text, sources: urls, scope_note: text.optional() }).strict()).min(1),
  questions: z.array(DraftItem).min(1),
}).strict()
export type DraftBank = z.infer<typeof Bank>
export function canonicalHash(value: unknown): string {
  const sorted = (v: unknown): unknown => Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, val]) => [k, sorted(val)])) : v
  return createHash('sha256').update(JSON.stringify(sorted(value))).digest('hex')
}
export function draftContentHash(q: DraftQuestion) {
  return canonicalHash({ question: q.question, options: q.options, answer: q.answer, rationales: q.rationales })
}
export function parseDraftBank(raw: unknown): DraftBank {
  const bank = Bank.parse(raw)
  const ids = new Set<string>(), stems = new Set<string>()
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const families = new Map(bank.families.map(f => [f.family_id, f]))
  if (families.size !== bank.families.length) throw new Error('Duplicate family ID')
  for (const q of bank.questions) {
    if (ids.has(q.id) || stems.has(normalize(q.question))) throw new Error(`Duplicate item or stem: ${q.id}`)
    ids.add(q.id); stems.add(normalize(q.question))
    if (new Set(Object.values(q.options).map(normalize)).size !== 4) throw new Error(`Duplicate options: ${q.id}`)
    if (draftContentHash(q) !== q.content_sha256) throw new Error(`Content hash mismatch: ${q.id}`)
    const f = families.get(q.family_id)
    if (!f || f.distinction !== q.distinction || f.category !== q.category || canonicalHash(f.sources) !== canonicalHash(q.source_urls)) throw new Error(`Family metadata mismatch: ${q.id}`)
    if (q.parent_original_id !== (q.role === 'original' ? null : q.family_id)) throw new Error(`Invalid parent: ${q.id}`)
    if (q.role === 'original' && q.id !== q.family_id) throw new Error(`Invalid original ID: ${q.id}`)
  }
  for (const f of Array.from(families.values())) {
    const roles = bank.questions.filter(q => q.family_id === f.family_id).map(q => q.role).sort()
    if (roles.join(',') !== 'delayed_review,original,retry') throw new Error(`Incomplete or ambiguous family: ${f.family_id}`)
  }
  return bank
}

/** Matches display/grading field names, while leaving unauthored clinical fields absent. */
export function stageQuestion(q: DraftQuestion) {
  return {
    draft_item_id: q.id, family_id: q.family_id, role: q.role,
    draft_distinction_id: q.distinction, distinction_id: distinctionId(q.distinction),
    clinical_content_id: null, eligible_for_production: false as const,
    content_sha256: q.content_sha256, source_question_id: q.parent_original_id,
    question_stem: q.question,
    options: labels.map(label => ({ label, text: q.options[label] })),
    correct_answer: q.answer, rationale_correct: q.rationales[q.answer],
    rationale_incorrect: Object.fromEntries(labels.filter(l => l !== q.answer).map(l => [l, q.rationales[l]])),
    nclex_category: q.category, source_urls: q.source_urls,
  }
}

export function draftImportReport(bank: DraftBank) {
  const questions = bank.questions.map(stageQuestion)
  return {
    mode: 'dry_run_only', revision: bank.revision, bank_sha256: canonicalHash(bank),
    question_count: questions.length, family_count: bank.families.length,
    publishable_count: 0, database_writes: 0,
    held_item_ids: questions.filter(contentOnHold).map(q => q.draft_item_id),
    families: bank.families.map(f => ({
      family_id: f.family_id, draft_distinction_id: f.distinction,
      runtime_distinction_id: distinctionId(f.distinction),
      delayed_variant_count: bank.questions.filter(q => q.family_id === f.family_id && q.role === 'delayed_review').length,
      blockers: ['Draft content has no publication approval',
        ...(!distinctionId(f.distinction) ? ['No exact runtime taxonomy entry; do not guess a broad mapping'] : []),
        'Current ClinicalPacket requires at least three delayed variants; draft contains one',
        'Difficulty, key_cue, one_line_fix and full packet provenance/reference details are not authored'],
    })),
    questions,
  }
}

/** Content-only preview selection. Does not create a scheduled review or analytics event. */
export function selectDraftVariant(bank: DraftBank, familyId: string, role: DraftQuestion['role'], seenIds: ReadonlySet<string>) {
  return bank.questions.find(q => q.family_id === familyId && q.role === role && !seenIds.has(q.id) && !contentOnHold(stageQuestion(q))) ?? null
}
