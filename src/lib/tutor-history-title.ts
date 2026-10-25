/** Display-only normalization; stored learner history is never rewritten. */
export function tutorHistoryTitle(value: string | null | undefined): string {
 const text = (value || '').replace(/<[^>]*>/g, ' ').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*_`>]+/g, ' ').replace(/\s+/g, ' ').trim()
 if (!text || /^(?:ORIENT\b|I (?:won['’]t|cannot|can['’]t)\b|I am unable\b)/i.test(text)) return 'Tutor conversation'
 return text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text
}
