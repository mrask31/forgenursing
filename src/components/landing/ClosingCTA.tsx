'use client'

import Link from 'next/link'
import { ArrowRight, Brain, CheckCircle2, FileText, Target } from 'lucide-react'

interface ClosingCTAProps {
  betaFull?: boolean
}

export default function ClosingCTA({ betaFull = false }: ClosingCTAProps) {
  const href = '/answer-trap-check?ref=closing_cta'

  return (
    <section className="bg-white py-12 sm:py-16" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B2545] p-6 shadow-2xl shadow-[#0B2545]/15 sm:p-8 lg:p-10">
          <div className="absolute left-0 top-0 hidden h-full w-64 opacity-30 sm:block">
            <div className="grid grid-cols-8 gap-2 p-8">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0BBCD4]" />
              ))}
            </div>
          </div>

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0BBCD4]">
                <Brain className="h-4 w-4" />
                Clinical judgment practice
              </div>
              <h2 id="cta-heading" className="font-display text-3xl leading-tight text-white sm:text-4xl md:text-[2.75rem]">
                Turn your study materials into NCLEX practice in minutes.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                Upload notes, generate practice questions, and see why each answer is right or wrong before test day.
              </p>

              <div className="mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <FileText className="h-5 w-5 text-[#0BBCD4]" />
                  <p className="mt-3 text-sm font-bold text-white">1. Upload notes</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">Use a study guide, lecture notes, or textbook chapter.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <Target className="h-5 w-5 text-[#0BBCD4]" />
                  <p className="mt-3 text-sm font-bold text-white">2. Practice questions</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">Forge turns your material into NCLEX-style practice.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#0BBCD4]" />
                  <p className="mt-3 text-sm font-bold text-white">3. Learn the why</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">Get step-by-step clinical reasoning explanations.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-[320px]">
              <Link
                href={href}
                className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-8 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#0a7d88]"
              >
                Find My Answer Trap
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#clinical-judgment-map"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-[#0BBCD4] hover:text-[#0BBCD4]"
              >
                <Target className="h-4 w-4" />
                Explore the Clinical Judgment Map
              </a>
              <p className="text-center text-xs text-white/60">
                7-day free trial · No credit card required · 100+ NCLEX-style questions completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
