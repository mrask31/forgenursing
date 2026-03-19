/**
 * Infers the effective course type from a course code and name using keyword matching.
 * Returns the inferred type string, or null if no match is found.
 * Used to resolve chip sets and course-scoped AI behavior when the stored type
 * is 'other' or doesn't reflect the actual course content.
 *
 * Keyword precedence (most specific first):
 *   pathophysiology → community_health → peds → ob → psych → pharm
 *   → fundamentals → med_surg
 */
export function inferCourseType(code: string, name: string): string | null {
  const text = `${code} ${name}`.toLowerCase()

  if (/pathophysiology/.test(text)) return 'pathophysiology'
  if (/community|public health|population health/.test(text)) return 'community_health'
  if (/pediatric|peds|child health/.test(text)) return 'peds'
  if (/obstetric|ob\/gyn|maternity|maternal|newborn|postpartum/.test(text)) return 'ob'
  if (/psychiatr|mental health|behavioral health/.test(text)) return 'psych'
  if (/pharmacolog/.test(text)) return 'pharm'
  if (/fundamentals|foundations/.test(text)) return 'fundamentals'
  if (/adult health|medical.?surgical|med.?surg/.test(text)) return 'med_surg'

  return null
}
