import type { Metadata } from 'next'
import SeoHelpPage from '../_components/SeoHelpPage'

export const metadata: Metadata = {
  title: 'NCLEX Priority vs Assessment Questions | ForgeNursing',
  description:
    'Learn how to tell when an NCLEX-style question wants assessment first versus immediate priority action.',
  alternates: {
    canonical: '/nclex-priority-vs-assessment',
  },
  openGraph: {
    title: 'NCLEX Priority vs Assessment Questions',
    description:
      'A practical guide to separating assessment-first decisions from priority action decisions on NCLEX-style questions.',
    url: '/nclex-priority-vs-assessment',
    siteName: 'ForgeNursing',
    type: 'article',
  },
}

export default function Page() {
  return (
    <SeoHelpPage
      eyebrow="Clinical judgment strategy"
      title="NCLEX priority vs assessment: when should you assess first?"
      subtitle="Assessment is often the safest first move, but not always. The key is reading whether the question gives you enough data to act or whether it is asking you to gather the missing data first."
      primaryCtaHref="/answer-trap-check?ref=seo_priority_assessment"
      sections={[
        {
          eyebrow: 'Decision rule',
          title: 'Assess first when the problem is unclear or the data is incomplete.',
          body: [
            'If the question gives symptoms but not enough information to choose a safe intervention, assessment is often the best first move. This is especially true when several causes could explain the same symptom.',
            'Priority action becomes more likely when the question already gives clear evidence of an immediate threat or when delaying action would put the client at risk.',
          ],
          bullets: [
            'Choose assessment when you need vital signs, focused assessment findings, or confirmation before acting.',
            'Choose priority action when the client is clearly unstable and the question already provides the critical data.',
            'Watch for words like first, priority, immediate, most appropriate, and further assessment.',
          ],
        },
        {
          eyebrow: 'Example',
          title: 'Pain alone may need comfort. Pain plus instability cues needs assessment.',
          body: [
            'The same symptom can point to different answers depending on the rest of the scenario. That is why cue recognition matters more than memorizing one rule.',
          ],
          example: {
            scenario:
              'A postoperative client reports increasing abdominal pain. The client is pale, restless, and says the pain feels worse than before. What should the nurse do first?',
            temptingAnswer:
              'Administer prescribed pain medication because the client reports increasing pain.',
            betterMove:
              'Assess blood pressure, heart rate, and the surgical site or dressing.',
            why:
              'Pain medication may treat discomfort, but pallor and restlessness raise concern for a complication. The nurse needs assessment data before deciding whether this is expected pain or a sign of instability.',
          },
        },
        {
          eyebrow: 'Common trap',
          title: 'The Assessment Trap and Priority Trap are opposites.',
          body: [
            'In an Assessment Trap, you act too soon. In a Priority Trap, you pick something reasonable but not urgent enough. The goal is not to always assess or always act. The goal is to match the action to the cue pattern.',
            'After each missed question, ask: Did I have enough data to act? Or did the question already give me enough data and I delayed the priority intervention?',
          ],
          bullets: [
            'If the cause is unclear, assessment usually comes first.',
            'If the threat is clear and immediate, act to protect the client.',
            'If two answers both sound right, compare which one is safer right now.',
          ],
        },
      ]}
      relatedLinks={[
        {
          href: '/nclex-answer-traps',
          label: 'NCLEX Answer Traps',
          description: 'See the broader set of reasoning traps behind missed answers.',
        },
        {
          href: '/why-do-i-get-nclex-questions-down-to-two-answers',
          label: 'Down to two answers',
          description: 'Understand why the last two answer choices can feel so close.',
        },
        {
          href: '/nclex-delegation-questions',
          label: 'Delegation questions',
          description: 'Practice another high-frequency clinical judgment pattern.',
        },
      ]}
    />
  )
}
