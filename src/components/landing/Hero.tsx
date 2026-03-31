'use client'

import Link from 'next/link'
import { ArrowRight, Mic } from 'lucide-react'

interface HeroProps {
  user: any
}

export default function Hero({ user }: HeroProps) {
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
                AI Clinical Preceptor for Nursing Students
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-[3.25rem] leading-tight text-[#0B2545] mb-5">
                Meet Forge. The AI clinical preceptor built for nursing students.
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-[#1E2D3D]/80 mb-6 leading-relaxed">
                Forge teaches you to think like a nurse — using your own textbooks, your own notes, and the ADPIE framework your professors actually test. Voice included.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {user ? (
                  <Link
                    href="/tutor"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                  >
                    Go to Tutor
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup?plan=monthly"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                    >
                      Join Free Beta
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#how-forge-thinks"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#0B2545]/30 text-[#0B2545] rounded-lg text-sm font-semibold hover:border-[#0D8F9C] hover:text-[#0D8F9C] transition-colors"
                    >
                      See how Forge thinks →
                    </a>
                  </>
                )}
              </div>

              <p className="text-xs text-[#1E2D3D]/50">
                Free access for beta testers · No credit card required
              </p>
            </div>

            {/* Right: ADPIE Interface Mockup — order-2 on mobile so it's below CTA */}
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
                    <span className="text-white/60 text-xs font-medium">ForgeNursing · Clinical Tutor</span>
                  </div>
                </div>

                {/* Tutor header */}
                <div className="bg-[#F7F9FB] border-b border-[#DDE5EE] px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B2545] to-[#0D8F9C] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">Fx</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B2545]">Forge</div>
                    <div className="text-[10px] text-[#0D8F9C] font-semibold">Clinical Preceptor · NP</div>
                  </div>
                  {/* Voice waveform active */}
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#E0F4F6] rounded-full">
                    <Mic className="w-3 h-3 text-[#0D8F9C]" />
                    <div className="flex items-end gap-0.5 h-3">
                      <div className="w-0.5 bg-[#0D8F9C] rounded-full animate-pulse" style={{height:'40%'}}></div>
                      <div className="w-0.5 bg-[#0D8F9C] rounded-full animate-pulse" style={{height:'100%', animationDelay:'0.1s'}}></div>
                      <div className="w-0.5 bg-[#0D8F9C] rounded-full animate-pulse" style={{height:'60%', animationDelay:'0.2s'}}></div>
                      <div className="w-0.5 bg-[#0D8F9C] rounded-full animate-pulse" style={{height:'80%', animationDelay:'0.15s'}}></div>
                      <div className="w-0.5 bg-[#0D8F9C] rounded-full animate-pulse" style={{height:'40%', animationDelay:'0.05s'}}></div>
                    </div>
                    <span className="text-[10px] text-[#0D8F9C] font-medium">NP Voice</span>
                  </div>
                </div>

                {/* Chat area */}
                <div className="bg-[#F7F9FB] p-4 space-y-3">
                  {/* Student message */}
                  <div className="flex justify-end">
                    <div className="bg-[#0B2545] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-sm">
                      <p className="text-xs font-medium">What are the priority assessments for a patient with heart failure?</p>
                    </div>
                  </div>

                  {/* Forge ADPIE response */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#DDE5EE] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[95%] shadow-sm space-y-2.5">

                      {/* ORIENT */}
                      <div className="bg-[#E0F4F6] rounded-lg p-2.5">
                        <div className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide mb-1">ORIENT</div>
                        <p className="text-xs text-[#1E2D3D]">Heart failure = impaired cardiac output → fluid backs up into lungs and periphery. Let's build the picture before we prioritize.</p>
                      </div>

                      {/* REASONING */}
                      <div className="bg-[#F7F9FB] border border-[#DDE5EE] rounded-lg p-2.5">
                        <div className="text-[10px] font-bold text-[#0B2545] uppercase tracking-wide mb-1">REASONING</div>
                        <p className="text-xs text-[#1E2D3D]">What tells you this patient is in distress right now? Think ABCs — which system is most threatened with fluid overload?</p>
                      </div>

                      {/* TRAP */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">TRAP</div>
                        <p className="text-xs text-[#1E2D3D]">Common NCLEX mistake: jumping to diuretics before confirming respiratory status. Airway always comes before intervention.</p>
                      </div>

                      {/* CHECK */}
                      <div className="bg-[#0B2545]/5 rounded-lg p-2.5">
                        <div className="text-[10px] font-bold text-[#0B2545] uppercase tracking-wide mb-1">CHECK</div>
                        <p className="text-xs text-[#1E2D3D]">Which vital sign finding would prompt you to call rapid response immediately?</p>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="bg-white border-t border-[#DDE5EE] px-4 py-3">
                  <div className="bg-[#F7F9FB] border border-[#DDE5EE] rounded-full px-4 py-2.5 flex items-center gap-3">
                    <span className="flex-1 text-xs text-[#1E2D3D]/40">Ask a clinical question...</span>
                    <div className="w-7 h-7 bg-[#0D8F9C] rounded-full flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
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
