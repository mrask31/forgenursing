'use client'

import Link from 'next/link'
import { ArrowRight, Upload, CheckCircle, BookOpen, AlertTriangle, HelpCircle, FileQuestion } from 'lucide-react'

function trackEvent(eventName: string) {
  try {
    const posthog = require('posthog-js').default
    posthog.capture(eventName)
  } catch {}
}

export default function NclexPracticePage() {
  return (
    <div className="bg-[#F7F9FB]">
      {/* ── Hero ── */}
      <section className="bg-white" aria-label="Hero">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-16 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight text-[#0B2545] mb-4">
            Turn Your Nursing Notes Into NCLEX-Style Practice Questions
          </h1>
          <p className="text-base sm:text-lg text-[#1E2D3D]/80 mb-8 leading-relaxed max-w-2xl mx-auto">
            Upload your study guide or choose a nursing topic. ForgeNursing creates
            practice questions, shows rationales, and helps you understand every
            missed answer using clinical judgment.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
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
      </section>

      {/* ── Pain Section ── */}
      <section className="py-12 sm:py-16" aria-label="The problem">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl text-[#0B2545] text-center mb-3">
            More questions are not enough if you do not understand why you missed them.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 text-center mb-10 max-w-xl mx-auto">
            Test banks can show you the answer. ForgeNursing helps you reason
            through the question so you can recognize the pattern next time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: AlertTriangle,
                text: 'I keep missing priority questions.',
              },
              {
                icon: HelpCircle,
                text: 'The rationale still does not make sense.',
              },
              {
                icon: FileQuestion,
                text: 'My class notes do not match generic question banks.',
              },
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
      <section className="bg-white py-12 sm:py-16" aria-label="Solution">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl text-[#0B2545] text-center mb-10">
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
      <section id="how-it-works" className="py-12 sm:py-16" aria-label="How it works">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl text-[#0B2545] text-center mb-10">
            How ForgeNursing works
          </h2>

          <div className="space-y-6 max-w-md mx-auto">
            {[
              { step: '1', text: 'Upload notes or pick a topic' },
              { step: '2', text: 'Start a short practice quiz' },
              { step: '3', text: 'Review rationales after each answer' },
              { step: '4', text: 'Dig deeper on missed questions' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-sm sm:text-base text-[#0B2545] font-medium pt-1">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audience / Use-Case ── */}
      <section className="bg-white py-12 sm:py-16" aria-label="Who this is for">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl text-[#0B2545] text-center mb-8">
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
      <section className="py-14 sm:py-20" aria-label="Get started">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-[#0B2545] mb-3">
            Start with one free quiz.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 mb-8">
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
