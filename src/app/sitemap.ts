import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Deliberately omit lastModified rather than reporting every build as a content edit.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/pricing", "/faq", "/answer-trap-check", "/nclex-practice", "/failed-nclex-what-to-do-next", "/why-do-i-get-nclex-questions-down-to-two-answers", "/nclex-answer-traps", "/nclex-priority-vs-assessment", "/nclex-delegation-questions", "/privacy", "/terms"].map(path => ({ url: `${SITE_URL}${path === '/' ? '' : path}` }))
}
