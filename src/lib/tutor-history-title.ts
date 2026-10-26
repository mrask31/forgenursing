/** Display-only normalization; stored learner history is never rewritten. */
export function tutorHistoryTitle(value: string | null | undefined): string {
 const text = (value || '').replace(/<[^>]*>/g, ' ').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*_`>]+/g, ' ').replace(/\s+/g, ' ').trim()
 if (!text || /^(?:ORIENT\b|(?:No[.!:]?\s+)?I (?:won['’]t|cannot|can['’]t|could not|couldn['’]t)\b|I am unable\b)/i.test(text)) return 'Tutor conversation'
 return text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text
}

/** Keep course-owned transcript navigation consistent with My Courses. */
export function tutorHistoryHref(sessionId: string, classId?: string | null): string {
 const params = new URLSearchParams({sessionId})
 if (classId && classId !== 'general') params.set('classId', classId)
 return `/tutor?${params.toString()}`
}
