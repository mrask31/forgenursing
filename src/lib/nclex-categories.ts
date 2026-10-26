/** Display/filter labels. Legacy CPR storage keys remain unchanged. */
export const NCLEX_CATEGORIES = [
  'Management of Care', 'Safety and Infection Control',
  'Health Promotion and Maintenance', 'Psychosocial Integrity',
  'Basic Care and Comfort', 'Pharmacological Therapies',
  'Reduction of Risk Potential', 'Physiological Adaptation',
] as const
export function normalizeNclexCategory(category: string | null | undefined): string | null {
  if (!category || category === 'All Categories') return null
  if (category === 'Safety and Infection Prevention and Control') return 'Safety and Infection Control'
  if (category === 'Pharmacological and Parenteral Therapies') return 'Pharmacological Therapies'
  return category
}
export function nclexCategoryLabel(category: string | null | undefined): string {
  return normalizeNclexCategory(category) || 'Uncategorized'
}
export function nclexCategoryProgress(rows: ReadonlyArray<{nclex_category?: string | null; is_correct?: boolean | null}>) {
  const counts = new Map<string, {attempted:number; correct:number}>()
  for (const row of rows) {
    const normalized = normalizeNclexCategory(row.nclex_category)
    const category = NCLEX_CATEGORIES.some(c => c === normalized) ? normalized! : 'Other recorded categories'
    const count = counts.get(category) || {attempted:0,correct:0}
    count.attempted += 1
    if (row.is_correct === true) count.correct += 1
    counts.set(category,count)
  }
  return [...NCLEX_CATEGORIES, 'Other recorded categories'].flatMap(category => {
    const count = counts.get(category)
    return count ? [{category,...count,accuracy:Math.round(count.correct/count.attempted*100)}] : []
  })
}
