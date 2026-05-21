'use client'

import Link from 'next/link'
import { ArrowRight, Brain, CheckCircle2, PlayCircle, Target, TrendingUp } from 'lucide-react'

interface HeroProps {
  user: any
  betaFull?: boolean
}

function startHref(user: any, betaFull: boolean) {
  if (user) return '/quiz'
  if (betaFull) return '/signup'
  return '/signup?plan=monthly'
}

function ClinicalJudgmentMapMockup() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-[#DDE5EE] bg-white p-4 sm:p-5 shadow-2xl shadow-[#0B2545]/10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#0B2545]">Clinical Judgment Map</p>
            <p className="text-[11px] text-[#1E2D3D]/45">Forge learns how you answer</p>
          </div>
          <span className="text-[11px] font-semibold text-[#0D8F9C]">View full map →</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Confidence Builder</p>
            <p className="mt-2 text-lg font-bold text-[#0B2545]">Getting Stronger</p>
            <div className="mt-3 space-y-2 text-[11px] text-[#1E2D3D]/70">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#0D8F9C]" /> 18 questions mapped</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#0D8F9C]" /> 2 patterns improving</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#0D8F9C]" /> Next focus found</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Strongest Pattern</p>
            <p className="mt-2 text-sm font-bold text-[#0B2545]">Medication reasoning</p>
            <p className="mt-1 text-xl font-bold text-[#0D8F9C]">Improving</p>
            <div className="mt-3 h-2 rounded-full bg-[#DDE5EE]">
              <div className="h-2 w-3/4 rounded-full bg-[#0D8F9C]" />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[#DDE5EE] bg-white p-3">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Patterns to Train</p>
          {[
            ['Assessment-first', 'Building', '45%'],
            ['Medication reasoning', 'Improving', '78%'],
          ].map(([name, stage, width]) => (
            <div key={name} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#0B2545]">{name}</span>
                <span className="font-semibold text-[#0D8F9C]">{stage}</span>
              </div>
              <div className="h-2 rounded-full bg-[#EEF3F7]">
                <div className="h-2 rounded-full bg-[#0D8F9C]" style={{ width }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-8 left-4 w-[230px] rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-xl shadow-[#0B2545]/10 sm:-left-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E0F4F6]">
            <Target className="h-5 w-5 text-[#0D8F9C]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#0D8F9C]">Recommended Next Focus</p>
            <p className="mt-1 text-sm font-bold text-[#0B2545]">Assessment-first</p>
            <p className="mt-1 text-[11px] text-[#1E2D3D]/60">Build your habit of starting with assessment.</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-[#DDE5EE] p-3">
          <p className="text-sm font-bold text-[#0B2545]">3-Question Drill</p>
          <p className="text-[11px] text-[#1E2D3D]/55">Train this pattern now</p>
          <div className="mt-3 rounded-lg bg-[#0D8F9C] px-3 py-2 text-center text-[12px] font-bold text-white">Start Drill →</div>
        </div>
      </div>

      <div className="absolute -bottom-12 right-0 hidden w-[260px] rounded-2xl border border-[#DDE5EE] bg-white p-4 shadow-xl shadow-[#0B2545]/10 lg:block">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#0D8F9C]">Quick Why</p>
        <div className="space-y-2 text-[11px] leading-relaxed text-[#1E2D3D]/70">
          <p><strong className="text-[#0B2545]">Key cue:</strong> swallowing difficulty changes what the nurse should do first.</p>
          <p><strong className="text-[#0B2545]">Why it works:</strong> assessment comes before feeding interventions.</p>
          <p className="rounded-lg bg-[#F7F9FB] p-2"><strong className="text-[#0B2545]">Remember:</strong> assess first when safety risk is possible.</p>
        </div>
      </div>
    </div>
  )
}

export default function Hero({ user, betaFull = false }: HeroProps) {
  const href = startHref(user, betaFull)

  return (
    <section className="overflow-hidden bg-white" aria-label="Hero Section">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-14 lg:px-8 lg:pb-32">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/25 bg-[#E0F4F6] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0B2545]">
              <Brain className="h-4 w-4 text-[#0D8F9C]" />
              Clinical Judgment Trainer
            </div>

            <h1 className="font-display text-4xl leading-tight text-[#0B2545] sm:text-5xl md:text-[3.45rem]">
              Stop guessing between two nursing answers that both look right.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#1E2D3D]/75 sm:text-lg">
              ForgeNursing learns how you answer, pinpoints your clinical judgment mistakes, and gives you focused NCLEX practice to fix them before test day.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={href}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0a7d88]"
              >
                {user ? 'Start Practice' : 'Start Free Practice'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-forge-thinks"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#0B2545]/30 px-7 py-3.5 text-sm font-bold text-[#0B2545] transition-colors hover:border-[#0D8F9C] hover:text-[#0D8F9C]"
              >
                <PlayCircle className="h-4 w-4" />
                See How It Works
              </a>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-sm text-[#1E2D3D]/60 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#0D8F9C]" />7-day free trial</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#0D8F9C]" />No credit card required</span>
            </div>

            <div className="mt-10 rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#0D8F9C]" />
                <div>
                  <p className="font-bold text-[#0B2545]">Forge is learning how you answer.</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#1E2D3D]/65">
                    Every missed question helps Forge find the clinical judgment pattern to train next.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pb-14 lg:pb-20">
            <ClinicalJudgmentMapMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
