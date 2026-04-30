'use client'

import Link from 'next/link'
import { ArrowRight, Upload, CheckCircle, BookOpen, AlertTriangle, HelpCircle, FileQuestion } from 'lucide-react'

function trackEvent(eventName: string) {
  try {
    const posthog = require('posthog-js').default
    posthog.capture(eventName)
  } catch {}
}

/* ── Product Preview Card ── */
function QuizPreviewCard() {
  const options = [
    { label: 'A', text: 'Encourage oral fluids', correct: false },
    { label: 'B', text: 'Raise the head of the bed and assess respiratory status', correct: true },
    { label: 'C', text: 'Document the finding and reassess in one hour', correct: false },
    { label: 'D', text: 'Teach incentive spirometer use', correct: false },
  ]

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
          NCLEX-style practice preview
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Question */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide">
              Sample Question
            </span>
            <span className="text-[10px] text-[#1E2D3D]/40">Priority Setting · Difficulty 3</span>
          </div>
          <p className="text-sm text-[#0B2545] font-medium leading-relaxed">
            A postoperative client reports shortness of breath and has an oxygen
            saturation of 88%. What is the priority nursing action?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt) => (
            <div
              key={opt.label}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${
                opt.correct
                  ? 'border-[#0D8F9C] bg-[#E0F4F6]/60'
                  : 'border-[#DDE5EE] bg-[#F7F9FB]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-px ${
                  opt.correct
                    ? 'bg-[#0D8F9C] text-white'
                    : 'bg-[#DDE5EE] text-[#1E2D3D]/60'
                }`}
              >
                {opt.label}
              </span>
              <span className={`leading-snug ${opt.correct ? 'text-[#0B2545] font-semibold' : 'text-[#1E2D3D]/70'}`}>
                {opt.text}
              </span>
              {opt.correct && (
                <CheckCircle className="w-4 h-4 text-[#0D8F9C] flex-shrink-0 ml-auto mt-px" />
              )}
            </div>
          ))}
        </div>

        {/* Rationale */}
        <div className="bg-[#E0F4F6]/40 border border-[#0D8F9C]/20 rounded-lg p-3">
          <div className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide mb-1">
            Rationale
          </div>
          <p className="text-xs text-[#1E2D3D]/80 leading-relaxed">
            Priority questions start with airway and breathing. This client has
            acute oxygenation concerns, so the nurse should position the client
            and assess respiratory status immediately.
          </p>
        </div>

        {/* Dig Deeper pill */}
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2545] text-white rounded-full text-[11px] font-semibold">
            <BookOpen className="w-3 h-3" />
            Dig Deeper with Tutor
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
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-[#0B2545] font-bold mb-4">
                Turn Your Nursing Notes Into NCLEX-Style Practice Questions
              </h1>
              <p className="text-base text-[#1E2D3D]/80 mb-6 leading-relaxed">
                Upload your study guide or choose a nursing topic. ForgeNursing
                creates practice questions, shows rationales, and helps you
                understand every missed answer using clinical judgment.
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
                  See How It Works
                </a>
              </div>

              <p className="text-xs text-[#1E2D3D]/50">
                Free beta access · No credit card required · Built for ADN, BSN, LPN, and MSN students
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
            More questions are not enough if you do not understand why you missed them.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 text-center mb-8 max-w-xl mx-auto">
            Test banks can show you the answer. ForgeNursing helps you reason
            through the question so you can recognize the pattern next time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: AlertTriangle, text: 'I keep missing priority questions.' },
              { icon: HelpCircle, text: 'The rationale still does not make sense.' },
              { icon: FileQuestion, text: 'My class notes do not match generic question banks.' },
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
            Practice from your material. Learn from your mistakes.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                title: 'Practice from your notes',
                body: 'Upload study guides, slides, or class material and generate NCLEX-style questions.',
              },
              {
                icon: CheckCircle,
                title: 'Get rationales immediately',
                body: 'See why the correct answer is right and why the other options are wrong.',
              },
              {
                icon: BookOpen,
                title: 'Dig deeper with the tutor',
                body: 'When you miss one, ForgeNursing opens the question in the tutor so you can work through it step by step.',
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
            How ForgeNursing works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { step: '1', text: 'Upload notes or pick a topic' },
              { step: '2', text: 'Start a short practice quiz' },
              { step: '3', text: 'Review rationales after each answer' },
              { step: '4', text: 'Dig deeper on missed questions' },
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
              'NCLEX-style questions',
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
            Start with one free quiz.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 mb-6">
            Try ForgeNursing with your own notes or a nursing topic. No credit
            card required.
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
