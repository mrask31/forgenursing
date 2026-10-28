import { pageMetadata } from '@/lib/seo'
import SeoHelpPage from '../_components/SeoHelpPage'

export const metadata = pageMetadata("Failed the NCLEX? What to Do Next", "Plan your next NCLEX-RN attempt: review your Candidate Performance Report, choose a study focus, and learn from missed practice questions.", "/failed-nclex-what-to-do-next")

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
            'Use your Candidate Performance Report to identify areas needing attention; it is not a question-by-question diagnosis.',
            'Create a mistake log that captures why the wrong answer felt right.',
            'Group missed questions by reasoning pattern before choosing drills.',
          ],
        },
        {
          eyebrow: 'Your mistake log',
          title: 'Write a useful note after each practice question.',
          body: [
            'Keep a simple notebook or document. A useful entry records the decision you made, the detail you missed, and what you will check on a related question. You do not need to copy the entire question.',
            'Fictional study example: “I chose an answer before noticing that the question asked for the first action. Next time I will restate the task before comparing the options.” This describes a review habit, not a clinical rule or an explanation of an exam result.',
          ],
          bullets: [
            'Topic: What knowledge or skill was this practice question testing?',
            'My choice: Why did that answer seem right at the time?',
            'Missed detail: What information in the explanation changes my reasoning?',
            'Reference check: Which course or nursing reference will I use if the explanation is unclear?',
            'Next attempt: Can I explain my choice on a different question testing the same skill?',
          ],
        },
        {
          eyebrow: 'Recovery loop',
          title: 'Adapt this example week to your study needs.',
          body: [
            'A practical recovery plan does not need to be complicated. Each week, pick the top one or two patterns that are costing you points, review the rule, and practice questions that test that same pattern.',
            'This is a sample review routine, not a seven-day retake schedule or a readiness assessment. Adjust the pace with your instructor or tutor, and continue reviewing other exam content areas.',
          ],
          bullets: [
            'Day 1: review your report and choose one topic to revisit.',
            'Days 2-4: practice focused questions in that pattern.',
            'Day 5: retest the pattern with mixed questions.',
            'Day 6: review why tempting answers pulled you in.',
            'Day 7: reset your next target based on what still repeats.',
          ],
        },
      ]}
      relatedLinks={[
        {
          href: 'https://www.nclex.com/candidate-performance-report.page',
          label: 'Official Candidate Performance Report guidance',
          description: 'Read what the report can and cannot tell you about your exam performance.',
        },
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
