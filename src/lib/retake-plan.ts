import { z } from 'zod'

export const CPR_CATEGORIES = [
  'Management of Care', 'Safety and Infection Prevention and Control',
  'Health Promotion and Maintenance', 'Psychosocial Integrity',
  'Basic Care and Comfort', 'Pharmacological and Parenteral Therapies',
  'Reduction of Risk Potential', 'Physiological Adaptation',
] as const
export const DIFFICULTIES = ['Content gaps', 'Choosing between two answers', 'Prioritization', 'Pacing', 'Confidence after the exam'] as const
export const retakePlanSchema = z.object({
  targetDate: z.string().refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)), 'Enter a valid date').default(''),
  previousPrep: z.string().trim().max(300).default(''),
  difficulty: z.enum(DIFFICULTIES).nullable().default(null),
  cpr: z.record(z.enum(CPR_CATEGORIES), z.enum(['Below', 'Near', 'Above'])).default({}),
  completed: z.boolean().default(false),
})
export type RetakePlan = z.infer<typeof retakePlanSchema>
export const EMPTY_RETAKE_PLAN: RetakePlan = { targetDate: '', previousPrep: '', difficulty: null, cpr: {}, completed: false }
export function readRetakePlan(value: unknown): RetakePlan {
  const parsed = retakePlanSchema.safeParse(value)
  return parsed.success ? parsed.data : EMPTY_RETAKE_PLAN
}
export function cprPracticeCategory(plan: RetakePlan): string | null {
  const category = CPR_CATEGORIES.find(c => plan.cpr[c] === 'Below') || CPR_CATEGORIES.find(c => plan.cpr[c] === 'Near')
  if (category === 'Safety and Infection Prevention and Control') return 'Safety and Infection Control'
  if (category === 'Pharmacological and Parenteral Therapies') return 'Pharmacological Therapies'
  return category || null
}
