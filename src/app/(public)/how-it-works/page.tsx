import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardCheck, FileSearch, Map, ShieldCheck, Target } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How ForgeNursing Retake Recovery Works',
  description: 'See how ForgeNursing helps NCLEX retakers move from missed answers to Answer Autopsies, mistake patterns, and a focused retake plan.',
  alternates: {
    canonical: '/how-it-works',
  },
}

const steps = [
  {
    icon: ClipboardCheck,
    title: '1. Retake Recovery Check',
    body: 'Start with a quick assessment of your failed attempt, retake timeline, study habits, and the question types that keep causing trouble.',
  },
  {
    icon: Target,
    title: '2. Diagnostic Question Set',
    body: 'Work through original NCLEX-style diagnostic questions built to expose reasoning patterns, not just measure topic recall.',
  },
  {
    icon: FileSearch,
    title: '3. Answer Autopsy',
    body: 'For every missed diagnostic question, see why the wrong answer was tempting, what cue was missed, and what pattern caused the miss.',
  },
  {
    icon: Map,
    title: '4. Mistake Pattern Map',
    body: 'ForgeNursing groups misses into patterns like priority vs. true answer, SATA overselecting, delegation, safety, content gap, and second-guessing.',
  },
]

const whatItIs = [
  'A retake recovery system for students who already know they need to change something before the next attempt.',
  'A way to diagnose why answers are being missed, not just which topics were weak.',
  'A focused 90-day study aid for one retake window.',
]

const whatItIsNot = [
  'Not a pass guarantee.',
  'Not a replacement for UWorld, Archer, ATI, HESI, Bootcamp, or your nursing program.',
  'Not a place to paste full copyrighted questions from other study tools.',
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-[#0B2545]">
      <section className="bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] py-14 sm:py-20" aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-bold text-[#0D8F9C] hover:text-[#0a7d88]">
            ← Back to Home
          </Link>
          <div className="mt-8 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/30 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">
              Miss → Autopsy → Pattern → Fix Plan → Retest
            </p>
            <h1 id="how-heading" className="mt-5 font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[#0B2545]">
              How ForgeNursing helps retakers prepare differently.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#1E2D3D]/75">
              Most retakers do more questions. ForgeNursing helps you understand what your missed answers are trying to tell you before you retake.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18" aria-labelledby="workflow-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">The workflow</p>
            <h2 id="workflow-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
              Built around the question retakers actually ask: “What do I fix now?”
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="rounded-3xl border border-[#DDE5EE] bg-[#F7F9FB] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F4F6] text-[#0D8F9C]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#0B2545]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#1E2D3D]/70">{step.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F7F9FB] py-14 sm:py-18" aria-labelledby="autopsy-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">Answer Autopsy</p>
              <h2 id="autopsy-heading" className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#0B2545]">
                The explanation retakers usually do not get from a rationale.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#1E2D3D]/70">
                A rationale tells you the correct answer. An Answer Autopsy shows why your wrong answer felt right, what cue mattered, and what decision pattern to watch next time.
              </p>
            </div>
            <div className="rounded-[2rem] border border-[#DDE5EE] bg-white p-6 shadow-xl shadow-[#0B2545]/8">
              <div className="space-y-4">
                <AutopsyRow label="Wrong answer was tempting because" value="It was clinically true, but it did not address the immediate risk first." />
                <AutopsyRow label="Likely pattern" value="Priority vs. true answer" />
                <AutopsyRow label="Cue to watch next time" value="Words like first, priority, immediate, unstable, and safest." />
                <AutopsyRow label="Fix drill" value="Practice labeling answers as true-but-not-first or priority before selecting." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18" aria-labelledby="guardrails-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-[#DDE5EE] bg-[#F7F9FB] p-6 sm:p-8">
              <h2 id="guardrails-heading" className="font-display text-2xl font-bold text-[#0B2545]">What ForgeNursing is</h2>
              <div className="mt-5 space-y-3">
                {whatItIs.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-[#1E2D3D]/75">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-[#DDE5EE] bg-[#F7F9FB] p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold text-[#0B2545]">What ForgeNursing is not</h2>
              <div className="mt-5 space-y-3">
                {whatItIsNot.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-[#1E2D3D]/75">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B2545] py-14 sm:py-16 text-white" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-heading" className="font-display text-3xl sm:text-4xl font-bold">
            Ready to see your starting retake pattern?
          </h2>
          <p className="mt-4 text-lg leading-8 text-white/75">
            Start with the free Retake Recovery Check, then decide whether the full 90-day pass is worth it.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/retake-recovery-check" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#0B2545] transition hover:bg-white/90">
              Start Free Check
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition hover:bg-white/10">
              View $19.99 Pass
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function AutopsyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#0B2545]">{value}</p>
    </div>
  )
}
