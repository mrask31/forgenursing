'use client'

import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'

interface HeroProps {
  user: any
  betaFull?: boolean
}

export default function Hero({ user, betaFull = false }: HeroProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-white" aria-label="Hero Section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-14 sm:pb-20 md:pt-18 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left: Text Content — order-1 on mobile so headline is above fold */}
            <div className="order-1 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E0F4F6] border border-[#0D8F9C]/30 text-[#0B2545] rounded-full text-xs font-semibold mb-5">
                <div className="w-2 h-2 rounded-full bg-[#0D8F9C]" />
                Clinical Judgment Trainer for Nursing Students
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-[3.25rem] leading-tight text-[#0B2545] mb-5">
                Stop guessing between two nursing answers that both look right.
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-[#1E2D3D]/80 mb-6 leading-relaxed">
                Practice from your notes. Miss a question. ForgeNursing shows the clinical judgment mistake behind it — priority, safety, assessment, delegation, medication, or therapeutic communication — then helps you fix it.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {user ? (
                  <Link
                    href="/quiz"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                  >
                    Start Practice
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : betaFull ? (
                  <>
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                    >
                      Start 7-Day Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#how-forge-thinks"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#0B2545]/30 text-[#0B2545] rounded-lg text-sm font-semibold hover:border-[#0D8F9C] hover:text-[#0D8F9C] transition-colors"
                    >
                      See Miss → Map → Fix → Retest
                    </a>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signup?plan=monthly"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                    >
                      Start 7-Day Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#how-forge-thinks"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#0B2545]/30 text-[#0B2545] rounded-lg text-sm font-semibold hover:border-[#0D8F9C] hover:text-[#0D8F9C] transition-colors"
                    >
                      See Miss → Map → Fix → Retest
                    </a>
                  </>
                )}
              </div>

              <p className="text-xs text-[#1E2D3D]/50">
                7-day free trial · No credit card required · Built for BSN, ADN, LPN, and MSN students
              </p>
            </div>

            {/* Right: Mistake-type preview */}
            <div className="order-2 lg:order-2 w-full max-w-[560px] mx-auto lg:mx-0">
              <div className="bg-white border border-[#DDE5EE] rounded-2xl shadow-xl shadow-[#0B2545]/10 overflow-hidden">

                {/* App chrome bar */}
                <div className="h-10 bg-[#0B2545] flex items-center px-4 gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-white/60 text-xs font-medium">ForgeNursing · Missed Question Review</span>
                  </div>
                </div>

                {/* Header */}
                <div className="bg-[#F7F9FB] border-b border-[#DDE5EE] px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B2545] to-[#0D8F9C] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">Fx</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B2545]">Forge</div>
                    <div className="text-[10px] text-[#0D8F9C] font-semibold">Clinical Judgment Trainer</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#E0F4F6] rounded-full">
                    <Target className="w-3 h-3 text-[#0D8F9C]" />
                    <span className="text-[10px] text-[#0D8F9C] font-medium">Mistake Type</span>
                  </div>
                </div>

                <div className="bg-[#F7F9FB] p-4 space-y-3">
                  {/* Question */}
                  <div className="bg-white border border-[#DDE5EE] rounded-2xl px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide mb-1">NCLEX-style priority question</div>
                    <p className="text-xs text-[#0B2545] font-medium leading-relaxed">
                      A client scheduled for a cardiac catheterization says, “I am scared something will go wrong.” What is the nurse’s best response?
                    </p>
                  </div>

                  {/* Missed answer */}
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">You chose A</div>
                    <p className="text-xs text-[#1E2D3D] leading-relaxed">
                      Provide detailed information about the procedure and possible complications.
                    </p>
                  </div>

                  {/* Better answer */}
                  <div className="bg-[#E0F4F6] border border-[#0D8F9C]/20 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide mb-1">Better answer: B</div>
                    <p className="text-xs text-[#1E2D3D] leading-relaxed">
                      Acknowledge the client’s feelings and encourage them to express specific concerns.
                    </p>
                  </div>

                  {/* Mistake map */}
                  <div className="bg-[#0B2545] rounded-xl p-3 text-white">
                    <div className="text-[10px] font-bold uppercase tracking-wide mb-1 text-white/70">You missed this because</div>
                    <p className="text-sm font-bold mb-1">Mistake Type: Therapeutic communication</p>
                    <p className="text-xs text-white/85 leading-relaxed">
                      You tried to educate before reducing anxiety. When a client is fearful, the priority is to acknowledge feelings before giving more information.
                    </p>
                  </div>

                  {/* Fix */}
                  <div className="bg-white border border-[#DDE5EE] rounded-xl p-3">
                    <div className="text-[10px] font-bold text-[#0B2545] uppercase tracking-wide mb-1">Next move</div>
                    <p className="text-xs text-[#1E2D3D] leading-relaxed">
                      Try another therapeutic communication question to fix the pattern — not just memorize this answer.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D8F9C] text-white rounded-full text-[11px] font-semibold">
                      Fix this weakness
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
