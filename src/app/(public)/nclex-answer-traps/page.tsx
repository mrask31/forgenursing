import type { Metadata } from 'next'
import SeoHelpPage from '../_components/SeoHelpPage'

export const metadata: Metadata = {
  title: 'NCLEX Answer Traps: Why Wrong Answers Feel Right | ForgeNursing',
  description:
    'Learn the common NCLEX Answer Traps behind missed questions, including assessment, priority, safety, delegation, medication, and content traps.',
  alternates: {
    canonical: '/nclex-answer-traps',
  },
  openGraph: {
    title: 'NCLEX Answer Traps: Why Wrong Answers Feel Right',
    description:
      'ForgeNursing explains the reasoning traps that can make wrong NCLEX answers feel right.',
    url: '/nclex-answer-traps',
    siteName: 'ForgeNursing',
    type: 'article',
  },
}

export default function Page() {
  return (
    <SeoHelpPage
      eyebrow="Answer Trap guide"
      title="The NCLEX Answer Traps that make wrong answers feel right"
      subtitle="An Answer Trap is the reasoning pattern behind a miss. It helps explain why an option looked safe, caring, or logical in the moment but was not the best answer for the scenario."
      primaryCtaHref="/answer-trap-check?ref=seo_answer_traps"
      sections={[
        {
          eyebrow: 'Core idea',
          title: 'Do not only ask what topic you missed. Ask what trap pulled you in.',
          body: [
            'Two students can miss the same cardiac question for different reasons. One may not know the content. Another may know the content but choose an intervention before assessing the unstable cue.',
            'That is why pattern tracking matters. The topic tells you what chapter to review. The Answer Trap tells you how your decision broke down.',
          ],
          bullets: [
            'Assessment Trap: acting before gathering the data needed to act safely.',
            'Priority Trap: choosing a good action that is not the first or safest action.',
            'Safety Trap: missing the option that prevents harm.',
            'Delegation Trap: assigning work outside the right scope, stability, or complexity.',
            'Medication Trap: missing a medication safety cue or contraindication.',
            'Content Trap: needing to strengthen the underlying concept before strategy can help.',
          ],
        },
        {
          eyebrow: 'Example',
          title: 'The wrong answer often feels right because it is partly right.',
          body: [
            'The NCLEX rarely rewards an answer just because it is something a nurse could eventually do. The question usually asks what the nurse should do first, next, or most safely.',
          ],
          example: {
            scenario:
              'A client with diabetes is shaky, sweating, and reports feeling weak. Which action should the nurse take first?',
            temptingAnswer:
              'Give orange juice immediately because the symptoms suggest hypoglycemia.',
            betterMove:
              'Check the capillary blood glucose level before deciding the next action, unless the scenario says treatment cannot wait.',
            why:
              'The symptoms point toward possible hypoglycemia, but the safest decision is usually to confirm the value when assessment is available and the client is not described as unable to swallow or severely unstable.',
          },
        },
        {
          eyebrow: 'Practice method',
          title: 'Name the trap, then drill the pattern.',
          body: [
            'If you miss a delegation question, doing random pharmacology questions will not fix the decision pattern. The fastest practice loop is to identify the trap, study the rule, and immediately practice that same type of decision again.',
            'ForgeNursing uses the Answer Trap language to help students turn a missed question into a next practice target.',
          ],
          bullets: [
            'Review the clinical cue that should have changed your decision.',
            'Explain why the tempting answer pulled you in.',
            'Practice another question that tests the same decision pattern.',
          ],
        },
      ]}
      relatedLinks={[
        {
          href: '/why-do-i-get-nclex-questions-down-to-two-answers',
          label: 'Down to two answers',
          description: 'Understand why the final two options feel so close.',
        },
        {
          href: '/nclex-delegation-questions',
          label: 'Delegation questions',
          description: 'Learn the scope, stability, and complexity cues behind delegation.',
        },
        {
          href: '/nclex-priority-vs-assessment',
          label: 'Priority vs assessment',
          description: 'Separate assessment-first questions from immediate priority questions.',
        },
      ]}
    />
  )
}
