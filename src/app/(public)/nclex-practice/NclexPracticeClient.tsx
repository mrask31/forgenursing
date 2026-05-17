'use client'

import Link from 'next/link'
import { ArrowRight, Upload, CheckCircle, BookOpen, AlertTriangle, HelpCircle, FileQuestion, Target, RotateCcw } from 'lucide-react'

function trackEvent(eventName: string) {
  try {
    const posthog = require('posthog-js').default
    posthog.capture(eventName)
  } catch {}
}

/* ── Product Preview Card ── */
function QuizPreviewCard() {
  return (
    <div className="bg-white border border-[#DDE5EE] rounded-2xl shadow-xl shadow-[#0B2545]/8 overflow-hidden">
      {/* Chrome bar */}
      <div className="h-9 bg-[#0B2545] flex items-center px-4 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
        <span className="flex-1 text-center text-white/50 text-[10px] font-medium">
          Missed question review
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Question */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide">
              Two answers look right
            </span>
            <span className="text-[10px] text-[#1E2D3D]/40">Therapeutic Communication</span>
          </div>
          <p className="text-sm text-[#0B2545] font-medium leading-relaxed">
            A client says, “I am scared something will go wrong during my cardiac catheterization.” What is the nurse’s best response?
          </p>
        </div>

        {/* Missed choice */}
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
            You chose A
          </div>
          <p className="text-xs text-[#1E2D3D]/80 leading-relaxed">
            Provide detailed information about the procedure and possible complications.
          </p>
        </div>

        {/* Better answer */}
        <div className="bg-[#E0F4F6]/60 border border-[#0D8F9C]/30 rounded-lg p-3">
          <div className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide mb-1">
            Better answer: B
          </div>
          <p className="text-xs text-[#1E2D3D]/80 leading-relaxed">
            Acknowledge the client’s feelings and ask what concerns them most.
          </p>
        </div>

        {/* Mistake type */}
        <div className="bg-[#0B2545] rounded-lg p-3 text-white">
          <div className="text-[10px] font-bold uppercase tracking-wide mb-1 text-white/60">
            Mistake Type
          </div>
          <p className="text-sm font-bold mb-1">Therapeutic communication</p>
          <p className="text-xs text-white/85 leading-relaxed">
            You tried to educate before reducing anxiety. Forge helps you spot the thinking error, not just memorize the answer.
          </p>
        </div>

        {/* Fix weakness pill */}
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D8F9C] text-white rounded-full text-[11px] font-semibold">
            <Target className="w-3 h-3" />
            Fix this weakness
          </span>
        </div>
      </div>
    </div>
  )
}

export default function NclexPracticePage() {
  return (
    <div className="bg-[#F7F9FB]">
      {/* ── Hero (two-column on desktop) ── */}
      <section className="bg-white" aria-label="Hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Copy */}
            <div className="order-1">
              <p className="text-xs font-bold text-[#0D8F9C] uppercase tracking-widest mb-3">
                Clinical Judgment Trainer
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-[#0B2545] font-bold mb-4">
                Stop guessing between two nursing answers that both look right.
              </h1>
              <p className="text-base text-[#1E2D3D]/80 mb-6 leading-relaxed">
                ForgeNursing helps you practice from your notes, miss questions safely, and find the clinical judgment mistake behind each wrong answer — priority, safety, assessment, delegation, medication, or therapeutic communication.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Link
                  href="/signup"
                  onClick={() => trackEvent('nclex_practice_primary_cta_clicked')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                >
                  Start Free Practice Quiz
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  onClick={() => trackEvent('nclex_practice_secondary_cta_clicked')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#0B2545]/30 text-[#0B2545] rounded-lg text-sm font-semibold hover:border-[#0D8F9C] hover:text-[#0D8F9C] transition-colors"
                >
                  See Miss → Map → Fix
                </a>
              </div>

              <p className="text-xs text-[#1E2D3D]/50">
                7-day free trial · No credit card required · Built for ADN, BSN, LPN, and MSN students
              </p>
            </div>

            {/* Right: Product preview */}
            <div className="order-2 w-full max-w-[480px] mx-auto lg:mx-0">
              <QuizPreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain Section ── */}
      <section className="py-10 sm:py-14" aria-label="The problem">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-2">
            Getting it wrong is not the problem. Not knowing why you picked it is.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 text-center mb-8 max-w-xl mx-auto">
            Most practice tools stop at rationales. ForgeNursing goes one step deeper by mapping the thinking error behind the miss.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: AlertTriangle, text: 'I narrow it down to two answers and still pick wrong.' },
              { icon: HelpCircle, text: 'The rationale tells me the answer but not my mistake.' },
              { icon: FileQuestion, text: 'I keep missing the same kind of question.' },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white border border-[#DDE5EE] rounded-xl p-5 text-center"
              >
                <card.icon className="w-6 h-6 text-[#0D8F9C] mx-auto mb-3" />
                <p className="text-sm text-[#0B2545] font-medium">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution Section ── */}
      <section className="bg-white py-10 sm:py-14" aria-label="Solution">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-8">
            Miss one. Find the thinking error. Fix the pattern.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                title: 'Practice from your notes',
                body: 'Upload study guides, slides, or class material and generate NCLEX-style practice.',
              },
              {
                icon: Target,
                title: 'Map the mistake type',
                body: 'See if you missed priority, safety, assessment, delegation, medication, knowledge, or communication.',
              },
              {
                icon: RotateCcw,
                title: 'Retest the weakness',
                body: 'Practice the same judgment pattern again so you can recognize it next time.',
              },
            ].map((card, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#E0F4F6] flex items-center justify-center mx-auto mb-4">
                  <card.icon className="w-6 h-6 text-[#0D8F9C]" />
                </div>
                <h3 className="text-sm font-bold text-[#0B2545] mb-2">{card.title}</h3>
                <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-10 sm:py-14" aria-label="How it works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-8">
            The ForgeNursing loop
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { step: '1', text: 'Miss a question' },
              { step: '2', text: 'Map the mistake type' },
              { step: '3', text: 'Fix the reasoning' },
              { step: '4', text: 'Retest the weakness' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-2 p-4">
                <div className="w-9 h-9 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-[#0B2545] font-medium">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audience / Use-Case ── */}
      <section className="bg-white py-10 sm:py-14" aria-label="Who this is for">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-6">
            Built for nursing students who need clinical judgment practice
          </h2>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Two-right-answer questions',
              'Priority and safety',
              'Delegation',
              'Med-surg',
              'Pharmacology',
              'Fundamentals',
              'ADPIE reasoning',
              'Professor-specific material when uploaded',
            ].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-[#E0F4F6] text-[#0B2545] rounded-full text-xs sm:text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-12 sm:py-16" aria-label="Get started">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] mb-3">
            Stop collecting rationales. Start fixing the mistake.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 mb-6">
            Try ForgeNursing with your own notes or a nursing topic. No credit card required.
          </p>
          <Link
            href="/signup"
            onClick={() => trackEvent('nclex_practice_primary_cta_clicked')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0D8F9C] text-white rounded-lg text-base font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
          >
            Start Free Practice Quiz
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
