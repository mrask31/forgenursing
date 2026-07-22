import type { Metadata } from 'next'
import SeoHelpPage from '../_components/SeoHelpPage'

export const metadata: Metadata = {
  title: 'Failed the NCLEX? What to Do Next | ForgeNursing',
  description:
    'A pattern-based NCLEX recovery plan for students who failed and need to understand what to study next without guessing.',
  alternates: {
    canonical: '/failed-nclex-what-to-do-next',
  },
  openGraph: {
    title: 'Failed the NCLEX? What to Do Next',
    description:
      'Learn how to review a failed NCLEX attempt by identifying patterns behind missed questions, not just redoing random content.',
    url: '/failed-nclex-what-to-do-next',
    siteName: 'ForgeNursing',
    type: 'article',
  },
}

export default function Page() {
  return (
    <SeoHelpPage
      eyebrow="NCLEX recovery plan"
      title="Failed the NCLEX? What to do next without guessing again"
      subtitle="A failed attempt can make every topic feel urgent. The better next step is to separate content gaps from reasoning traps so your next study plan is specific."
      primaryCtaHref="/answer-trap-check?ref=seo_failed_nclex"
      sections={[
        {
          eyebrow: 'First step',
          title: 'Do not restart by doing random questions immediately.',
          body: [
            'After failing the NCLEX, it is natural to want to do more questions right away. More practice can help, but only if it is connected to the reason you missed previous questions.',
            'A stronger recovery plan starts by asking what kind of miss happened: content knowledge, assessment-first thinking, priority setting, safety, delegation, medication reasoning, or another repeatable pattern.',
          ],
          bullets: [
            'Review your candidate performance report, but do not stop at broad categories.',
            'Create a mistake log that captures why the wrong answer felt right.',
            'Group missed questions by reasoning pattern before choosing drills.',
          ],
        },
        {
          eyebrow: 'Example',
          title: 'A failed attempt can hide multiple kinds of misses.',
          body: [
            'The same score can come from very different problems. One student may need more pharmacology content. Another may know the facts but choose the wrong first action under pressure.',
          ],
          example: {
            scenario:
              'A client taking a new medication reports dizziness and has a low blood pressure reading. What should the nurse do first?',
            temptingAnswer:
              'Teach the client to rise slowly because dizziness can happen with blood pressure medication.',
            betterMove:
              'Assess the client further, confirm the blood pressure, and identify whether the medication should be held or the provider notified based on the scenario details.',
            why:
              'Teaching may be useful later, but low blood pressure plus symptoms requires assessment and safety thinking first. The miss may be medication reasoning, safety, or assessment-first depending on the full question.',
          },
        },
        {
          eyebrow: 'Recovery loop',
          title: 'Use a pattern-based weekly review plan.',
          body: [
            'A practical recovery plan does not need to be complicated. Each week, pick the top one or two patterns that are costing you points, review the rule, and practice questions that test that same pattern.',
            'The goal is to reduce repeat misses. If you keep missing the same way, changing the number of questions is less important than changing the review loop after each miss.',
          ],
          bullets: [
            'Day 1: identify your top Answer Trap signal.',
            'Days 2-4: practice focused questions in that pattern.',
            'Day 5: retest the pattern with mixed questions.',
            'Day 6: review why tempting answers pulled you in.',
            'Day 7: reset your next target based on what still repeats.',
          ],
        },
      ]}
      relatedLinks={[
        {
          href: '/why-do-i-get-nclex-questions-down-to-two-answers',
          label: 'Down to two answers',
          description: 'See why close answer choices can expose reasoning patterns.',
        },
        {
          href: '/nclex-answer-traps',
          label: 'NCLEX Answer Traps',
          description: 'Use trap language to organize your next study plan.',
        },
        {
          href: '/nclex-delegation-questions',
          label: 'Delegation questions',
          description: 'Review one of the most common clinical judgment patterns.',
        },
      ]}
    />
  )
}
