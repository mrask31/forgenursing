'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ClipboardCheck, Map as MapIcon, RotateCcw, Target } from 'lucide-react'

type Question = {
  id: string
  label: string
  helper: string
  options: Array<{
    label: string
    value: string
    patterns: string[]
  }>
}

const questions: Question[] = [
  {
    id: 'attempts',
    label: 'How many NCLEX attempts are you recovering from?',
    helper: 'This helps frame how urgent and specific the plan should be.',
    options: [
      { label: 'One attempt', value: 'one', patterns: ['Retake planning'] },
      { label: 'Two attempts', value: 'two', patterns: ['Repeated pattern risk'] },
      { label: 'Three or more attempts', value: 'three_plus', patterns: ['Repeated pattern risk', 'Retake confidence'] },
    ],
  },
  {
    id: 'stuck_point',
    label: 'What feels most frustrating right now?',
    helper: 'Choose the answer that sounds most like your study sessions.',
    options: [
      { label: 'I narrow it down to two and pick wrong.', value: 'down_to_two', patterns: ['Priority vs. true answer', 'Second-guessing'] },
      { label: 'I read rationales, but my scores do not move.', value: 'rationales', patterns: ['Passive rationale review'] },
      { label: 'My score report is too vague to plan from.', value: 'score_report', patterns: ['Retake planning'] },
      { label: 'I panic or rush when questions feel unfamiliar.', value: 'panic', patterns: ['Retake confidence', 'Reading cues too fast'] },
    ],
  },
  {
    id: 'question_type',
    label: 'Which question type keeps hurting you most?',
    helper: 'This becomes the first area to test in your diagnostic set.',
    options: [
      { label: 'Priority / first action', value: 'priority', patterns: ['Priority vs. true answer', 'Safety and first action'] },
      { label: 'SATA / multiple response', value: 'sata', patterns: ['SATA overselecting'] },
      { label: 'Delegation / scope', value: 'delegation', patterns: ['Delegation and scope'] },
      { label: 'Meds, labs, or disease content', value: 'content', patterns: ['Content gap vs. reasoning gap'] },
    ],
  },
  {
    id: 'answer_habit',
    label: 'Which answer habit sounds most familiar?',
    helper: 'A retake plan should fix habits, not only review topics.',
    options: [
      { label: 'I change answers and regret it.', value: 'change_answers', patterns: ['Second-guessing'] },
      { label: 'I choose an answer that is true but not best.', value: 'true_not_best', patterns: ['Priority vs. true answer'] },
      { label: 'I act before assessing, or assess when action is needed.', value: 'adpie', patterns: ['Assessment vs. intervention'] },
      { label: 'I miss small wording cues.', value: 'cues', patterns: ['Reading cues too fast'] },
    ],
  },
]

const patternDescriptions: Record<string, string> = {
  'Retake planning': 'Your next attempt may need a more specific plan than simply adding more question volume.',
  'Repeated pattern risk': 'Repeated attempts often mean the same decision pattern is showing up in different question formats.',
  'Retake confidence': 'Your review plan should protect confidence while still being honest about the pattern to fix.',
  'Priority vs. true answer': 'You may be choosing answers that are clinically true, but not the safest or highest-priority answer.',
  'Second-guessing': 'You may be changing away from your first clinical judgment or overcorrecting when two answers feel close.',
  'Passive rationale review': 'You may be reading rationales without extracting the decision rule that would help on the next similar question.',
  'Reading cues too fast': 'You may be missing timing, stability, priority, or safety cues hidden in the question wording.',
  'Safety and first action': 'You may need focused work on immediate risk, first action, and what must happen before anything else.',
  'SATA overselecting': 'You may be selecting options that are partly true instead of only options directly supported by the stem.',
  'Delegation and scope': 'You may need to separate RN responsibilities from tasks that can be delegated safely.',
  'Content gap vs. reasoning gap': 'You may need to know whether the miss was a true knowledge gap or a decision-process issue.',
  'Assessment vs. intervention': 'You may be mixing up when to assess first versus when the situation already requires action.',
}

async function capture(event: string, properties: Record<string, unknown>) {
  try {
    const posthog = (await import('posthog-js')).default
    posthog.capture(event, properties)
  } catch {}
}

export default function RetakeRecoveryCheckClient() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [hasStarted, setHasStarted] = useState(false)

  const answeredCount = Object.keys(answers).length
  const complete = answeredCount === questions.length

  const rankedPatterns = useMemo(() => {
    const counts = new Map<string, number>()

    questions.forEach((question) => {
      const selected = answers[question.id]
      const option = question.options.find((candidate) => candidate.value === selected)
      option?.patterns.forEach((pattern) => counts.set(pattern, (counts.get(pattern) || 0) + 1))
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([pattern, count]) => ({ pattern, count, description: patternDescriptions[pattern] }))
  }, [answers])

  const handleSelect = (questionId: string, value: string) => {
    const nextAnswers = { ...answers, [questionId]: value }
    setAnswers(nextAnswers)

    if (!hasStarted) {
      setHasStarted(true)
      capture('retake_recovery_check_started', {
        source: 'retake_recovery_check_page',
      })
    }

    if (Object.keys(nextAnswers).length === questions.length) {
      const completedPatterns = questions.flatMap((question) => {
        const selected = nextAnswers[question.id]
        return question.options.find((option) => option.value === selected)?.patterns ?? []
      })

      capture('retake_recovery_check_completed', {
        source: 'retake_recovery_check_page',
        patterns: completedPatterns,
      })
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#0B2545]">
      <section className="bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] py-14 sm:py-20" aria-labelledby="recovery-check-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-bold text-[#0D8F9C] hover:text-[#0a7d88]">
            ← Back to ForgeNursing
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/30 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">
                Free Starting Snapshot
              </p>
              <h1 id="recovery-check-heading" className="mt-5 font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[#0B2545]">
                Start your NCLEX Retake Recovery Check.
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#1E2D3D]/75">
                Answer four quick questions and ForgeNursing will show a starting snapshot of the mistake patterns that may need attention before your next attempt.
              </p>
              <div className="mt-6 rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#0D8F9C]" />
                  <div>
                    <p className="font-bold text-[#0B2545]">This is not a pass prediction.</p>
                    <p className="mt-1 text-sm leading-6 text-[#1E2D3D]/70">
                      It is a starting point for a better retake plan. The full paid pass adds diagnostic sets, Answer Autopsies, a pattern map, and fix plans.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#DDE5EE] bg-white p-4 sm:p-6 shadow-xl shadow-[#0B2545]/10">
              <div className="flex items-center justify-between gap-4 border-b border-[#DDE5EE] pb-4">
                <div>
                  <p className="text-sm font-bold text-[#0B2545]">Recovery Check</p>
                  <p className="text-xs text-[#1E2D3D]/60">{answeredCount} of {questions.length} answered</p>
                </div>
                <div className="h-2 w-28 rounded-full bg-[#E8EEF5]">
                  <div className="h-2 rounded-full bg-[#0D8F9C] transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                </div>
              </div>

              <div className="mt-5 space-y-6">
                {questions.map((question) => (
                  <fieldset key={question.id} className="space-y-3">
                    <legend className="font-bold text-[#0B2545]">{question.label}</legend>
                    <p className="text-sm text-[#1E2D3D]/65">{question.helper}</p>
                    <div className="grid gap-2">
                      {question.options.map((option) => {
                        const selected = answers[question.id] === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(question.id, option.value)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                              selected
                                ? 'border-[#0D8F9C] bg-[#E0F4F6] text-[#0B2545]'
                                : 'border-[#DDE5EE] bg-white text-[#1E2D3D] hover:border-[#0D8F9C]'
                            }`}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F9FB] py-14 sm:py-16" aria-labelledby="snapshot-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[#DDE5EE] bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">Your starting snapshot</p>
                <h2 id="snapshot-heading" className="mt-2 font-display text-3xl font-bold text-[#0B2545]">
                  {complete ? 'Likely retake risk patterns' : 'Complete the check to see your likely patterns'}
                </h2>
              </div>
              <RotateCcw className="hidden h-10 w-10 text-[#0D8F9C] sm:block" />
            </div>

            {complete ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {rankedPatterns.map(({ pattern, description }) => (
                  <div key={pattern} className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-5">
                    <div className="flex items-start gap-3">
                      <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                      <div>
                        <h3 className="font-bold text-[#0B2545]">{pattern}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-[#BFD7DF] bg-[#F7F9FB] p-6 text-center text-[#1E2D3D]/65">
                Your snapshot will appear here after all four answers are selected.
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-[#0D8F9C]/25 bg-[#E0F4F6] p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#0B2545]">Ready for the full 90-day Retake Recovery Pass?</h3>
                  <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">
                    The full pass turns your snapshot into diagnostic question sets, Answer Autopsies, a Mistake Pattern Map, and a focused fix plan.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                  <Link href="/pricing" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a7d88]">
                    View $19.99 Pass
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/how-it-works" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#DDE5EE] bg-white px-5 py-3 text-sm font-bold text-[#0B2545] transition hover:border-[#0D8F9C] hover:text-[#0D8F9C]">
                    See How It Works
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MiniFeature icon={<ClipboardCheck className="h-5 w-5" />} title="Recovery Check" body="Find a likely starting pattern before paying." />
            <MiniFeature icon={<MapIcon className="h-5 w-5" />} title="Pattern Map" body="Track what your missed answers are really showing." />
            <MiniFeature icon={<CheckCircle2 className="h-5 w-5" />} title="Fix Plan" body="Turn the pattern into a focused retake plan." />
          </div>
        </div>
      </section>
    </main>
  )
}

function MiniFeature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F4F6] text-[#0D8F9C]">{icon}</div>
      <h3 className="mt-4 font-bold text-[#0B2545]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">{body}</p>
    </div>
  )
}
