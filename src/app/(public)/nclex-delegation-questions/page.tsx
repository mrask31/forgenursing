import type { Metadata } from 'next'
import SeoHelpPage from '../_components/SeoHelpPage'

export const metadata: Metadata = {
  title: 'NCLEX Delegation Questions: Scope, Stability, Complexity | ForgeNursing',
  description:
    'Learn how to approach NCLEX delegation questions by checking scope of practice, client stability, task complexity, and supervision needs.',
  alternates: {
    canonical: '/nclex-delegation-questions',
  },
  openGraph: {
    title: 'NCLEX Delegation Questions: Scope, Stability, Complexity',
    description:
      'A practical guide to the Delegation Trap on NCLEX-style questions.',
    url: '/nclex-delegation-questions',
    siteName: 'ForgeNursing',
    type: 'article',
  },
}

export default function Page() {
  return (
    <SeoHelpPage
      eyebrow="Delegation Trap"
      title="NCLEX delegation questions: scope, stability, and complexity"
      subtitle="Delegation questions are not just about who is available. They test whether you can match the right task to the right team member while protecting client safety."
      primaryCtaHref="/answer-trap-check?ref=seo_delegation"
      sections={[
        {
          eyebrow: 'Core rule',
          title: 'Before you delegate, check scope, stability, complexity, and predictability.',
          body: [
            'A task may seem simple, but it may still be unsafe to delegate if the client is unstable, the assessment is incomplete, or the task requires nursing judgment.',
            'The Delegation Trap happens when the answer focuses on helping the nurse get work done instead of matching the task to the safest role.',
          ],
          bullets: [
            'Scope: Is this task allowed for the team member?',
            'Stability: Is the client predictable and stable enough for delegation?',
            'Complexity: Does the task require assessment, teaching, evaluation, or judgment?',
            'Supervision: Does the nurse still need to follow up and evaluate outcomes?',
          ],
        },
        {
          eyebrow: 'Example',
          title: 'Stable routine tasks are usually safer to delegate than assessment decisions.',
          body: [
            'Many delegation misses happen because the task sounds quick. NCLEX-style questions care less about speed and more about whether the task requires nursing judgment.',
          ],
          example: {
            scenario:
              'The nurse is caring for four clients and has an assistive personnel available. Which task is most appropriate to delegate?',
            temptingAnswer:
              'Ask the assistive personnel to assess a client who reports new shortness of breath.',
            betterMove:
              'Ask the assistive personnel to obtain routine vital signs on a stable client who is scheduled for discharge teaching later.',
            why:
              'New shortness of breath requires nursing assessment. Routine data collection on a stable client is more appropriate to delegate, while the nurse remains responsible for interpreting findings and following up.',
          },
        },
        {
          eyebrow: 'Study method',
          title: 'When you miss delegation, write the role issue instead of just the topic.',
          body: [
            'A weak review note says “delegation.” A better note says “I gave an assessment task to assistive personnel” or “I missed that the client was unstable.” That turns the miss into a clear rule.',
            'The goal is to make the next delegation question feel less like memorized hierarchy and more like a safety decision.',
          ],
          bullets: [
            'Name the role that was safest for the task.',
            'Identify whether the issue was scope, stability, complexity, or supervision.',
            'Practice a similar delegation question immediately after the review.',
          ],
        },
      ]}
      relatedLinks={[
        {
          href: '/nclex-answer-traps',
          label: 'NCLEX Answer Traps',
          description: 'See how delegation fits into the broader Answer Trap system.',
        },
        {
          href: '/nclex-priority-vs-assessment',
          label: 'Priority vs assessment',
          description: 'Compare delegation decisions with assessment-first decisions.',
        },
        {
          href: '/failed-nclex-what-to-do-next',
          label: 'Failed the NCLEX?',
          description: 'Build a safer review plan after a failed attempt.',
        },
      ]}
    />
  )
}
