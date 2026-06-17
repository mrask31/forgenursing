'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle, HelpCircle, FileQuestion, Target, RotateCcw } from 'lucide-react'

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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide">
              Two answers look right
            </span>
            <span className="text-[10px] text-[#1E2D3D]/40">Assessment-first</span>
          </div>
          <p className="text-sm text-[#0B2545] font-medium leading-relaxed">
            A client reports new shortness of breath and is speaking in short phrases. What should the nurse do first?
          </p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
            You chose C
          </div>
          <p className="text-xs text-[#1E2D3D]/80 leading-relaxed">
            Teach the client to use pursed-lip breathing.
          </p>
        </div>

        <div className="bg-[#E0F4F6]/60 border border-[#0D8F9C]/30 rounded-lg p-3">
          <div className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-wide mb-1">
            Better answer: A
          </div>
          <p className="text-xs text-[#1E2D3D]/80 leading-relaxed">
            Assess oxygen saturation and lung sounds before choosing the next intervention.
          </p>
        </div>

        <div className="bg-[#0B2545] rounded-lg p-3 text-white">
          <div className="text-[10px] font-bold uppercase tracking-wide mb-1 text-white/60">
            Pattern Detected
          </div>
          <p className="text-sm font-bold mb-1">Assessment before intervention</p>
          <p className="text-xs text-white/85 leading-relaxed">
            Forge shows the reasoning mistake behind the answer so you can fix the pattern, not just memorize the rationale.
          </p>
        </div>

        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D8F9C] text-white rounded-full text-[11px] font-semibold">
            <Target className="w-3 h-3" />
            Retest this pattern
          </span>
        </div>
      </div>
    </div>
  )
}

function ProductProofSection() {
  return (
    <section className="bg-white py-12 sm:py-16" aria-label="Product proof">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-9">
          <p className="text-xs font-bold text-[#0D8F9C] uppercase tracking-widest mb-3">
            Real ForgeNursing loop
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] mb-3">
            See the mistake. Learn the why. Retest the pattern.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 leading-relaxed">
            The screenshots you take after practice should not just show a score. They should show what thinking pattern cost you points and what to practice next.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 shadow-sm">
            <div className="rounded-xl bg-white border border-[#DDE5EE] p-4 mb-4">
              <div className="text-xs font-semibold text-[#0B2545] mb-3">Question 3 of 3</div>
              <div className="rounded-xl bg-red-500 text-white p-4 mb-4">
                <p className="font-bold mb-3">✗ Missed this one</p>
                <p className="text-sm leading-relaxed mb-2">You chose: D — Review the client's insulin administration record.</p>
                <p className="text-sm leading-relaxed font-semibold">Better answer: A — Check the client's capillary blood glucose level.</p>
              </div>
              <div className="rounded-xl border border-[#DDE5EE] p-4">
                <p className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-widest mb-2">Quick why</p>
                <p className="text-sm text-[#0B2545] leading-relaxed">Shaky and diaphoretic are clinical cues for possible hypoglycemia. Confirm the glucose before deciding the next action.</p>
              </div>
            </div>
            <h3 className="font-bold text-[#0B2545] mb-1">Understand why you missed it</h3>
            <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">Forge turns a wrong answer into a clear clinical judgment correction.</p>
          </div>

          <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 shadow-sm">
            <div className="rounded-xl bg-white border border-[#DDE5EE] p-4 mb-4">
              <div className="text-xs font-semibold text-[#0B2545] mb-3">Question 2 of 3</div>
              <div className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 mb-3">
                <p className="text-sm text-[#0B2545] leading-relaxed">A postoperative client reports increasing abdominal pain 2 hours after surgery. The client is pale and restless. Which action should the nurse take first?</p>
              </div>
              <div className="space-y-2 text-sm text-[#0B2545]">
                <div className="rounded-lg border border-[#DDE5EE] p-3">A) Check blood pressure, heart rate, and surgical dressing.</div>
                <div className="rounded-lg border border-[#DDE5EE] p-3">B) Administer prescribed opioid pain medication.</div>
                <div className="rounded-lg border border-[#DDE5EE] p-3">C) Reposition and apply a warm blanket.</div>
                <div className="rounded-lg border border-[#DDE5EE] p-3">D) Document expected postoperative pain.</div>
              </div>
            </div>
            <h3 className="font-bold text-[#0B2545] mb-1">Practice clinical judgment</h3>
            <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">Train the exact decision points that make NCLEX questions feel vague or close.</p>
          </div>

          <div className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 shadow-sm">
            <div className="rounded-xl bg-white border border-[#DDE5EE] p-4 mb-4">
              <div className="rounded-xl bg-[#E0F4F6] border border-[#0D8F9C]/40 p-4 mb-4">
                <p className="text-[10px] font-bold text-[#0D8F9C] uppercase tracking-widest mb-2">Recommended</p>
                <h4 className="font-bold text-[#0B2545] mb-2">Practice Assessment-first</h4>
                <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">Assessment-first is your next growth pattern. A short drill will help Forge strengthen this area.</p>
              </div>
              <div className="rounded-lg bg-[#0D8F9C] text-white text-center py-3 font-semibold mb-3">Start 3-Question Drill</div>
              <div className="rounded-lg border border-[#0B2545]/20 text-[#0B2545] text-center py-3 font-semibold">Retest this pattern →</div>
            </div>
            <h3 className="font-bold text-[#0B2545] mb-1">Fix weak patterns immediately</h3>
            <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">After a miss, Forge gives you a focused retest instead of sending you back to random questions.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function NclexPracticePage() {
  return (
    <div className="bg-[#F7F9FB]">
      {/* ── Hero (two-column on desktop) ── */}
      <section className="bg-white" aria-label="Hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-1">
              <p className="text-xs font-bold text-[#0D8F9C] uppercase tracking-widest mb-3">
                NCLEX Readiness + Clinical Judgment Practice
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-[#0B2545] font-bold mb-4">
                Stop getting NCLEX questions down to two answers and picking the wrong one.
              </h1>
              <p className="text-base text-[#1E2D3D]/80 mb-6 leading-relaxed">
                ForgeNursing identifies the reasoning mistakes behind your wrong answers and shows exactly what to practice next — so you can build confidence before exam day.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Link
                  href="/signup"
                  onClick={() => trackEvent('nclex_practice_primary_cta_clicked')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
                >
                  Find My Weak Spots
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  onClick={() => trackEvent('nclex_practice_secondary_cta_clicked')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#0B2545]/30 text-[#0B2545] rounded-lg text-sm font-semibold hover:border-[#0D8F9C] hover:text-[#0D8F9C] transition-colors"
                >
                  See How Forge Works
                </a>
              </div>

              <p className="text-xs text-[#1E2D3D]/50">
                No credit card required · 7-day free trial · Built for ADN, BSN, LPN, and MSN students
              </p>
            </div>

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
            Most students do not need another pile of questions. They need to know why they keep missing them.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 text-center mb-8 max-w-xl mx-auto">
            Reddit is full of nursing students asking the same thing: Am I ready? Why do I overthink? Why do I get stuck between two answers? Forge is built around those questions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: AlertTriangle, title: 'I get it down to two answers.', text: 'Forge helps identify the clinical judgment move that separates the tempting answer from the safest answer.' },
              { icon: HelpCircle, title: 'I do not know if I am ready.', text: 'Your Judgment Map shows the reasoning patterns that still need work before exam day.' },
              { icon: FileQuestion, title: 'I keep overthinking.', text: 'Focused drills help you practice the same weak pattern until the decision feels clearer.' },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white border border-[#DDE5EE] rounded-xl p-5"
              >
                <card.icon className="w-6 h-6 text-[#0D8F9C] mb-3" />
                <h3 className="text-sm font-bold text-[#0B2545] mb-2">{card.title}</h3>
                <p className="text-sm text-[#1E2D3D]/70 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductProofSection />

      {/* ── Mistake Types Section ── */}
      <section className="py-10 sm:py-14" aria-label="Mistake types">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-3">
            Forge is not another question bank.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 text-center mb-8 max-w-2xl mx-auto">
            Question banks tell you what the right answer was. Forge helps you understand the reasoning pattern that made the wrong answer feel right.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Priority traps',
                body: 'When the question is really asking what matters first — airway, safety, assessment, or urgency.',
              },
              {
                icon: HelpCircle,
                title: 'Assessment traps',
                body: 'When you jump to intervention before collecting the clinical cue that changes what the nurse should do next.',
              },
              {
                icon: RotateCcw,
                title: 'Pattern traps',
                body: 'When you keep missing the same judgment move and need targeted practice, not another generic rationale.',
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
      <section id="how-it-works" className="bg-white py-10 sm:py-14" aria-label="How it works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-3">
            The ForgeNursing loop
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 text-center mb-8 max-w-2xl mx-auto">
            The goal is not endless reps. The goal is to find the pattern costing you points, fix it, and retest it while it is fresh.
          </p>

          <div className="max-w-xl mx-auto space-y-3">
            {[
              { step: '1', text: 'Take a short diagnostic or focused drill.' },
              { step: '2', text: 'See the reasoning mistake behind each miss.' },
              { step: '3', text: 'Review your Judgment Map to find weak patterns.' },
              { step: '4', text: 'Retest the same weakness until the decision is clearer.' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 rounded-xl bg-[#F7F9FB] border border-[#DDE5EE] p-4">
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
      <section className="py-10 sm:py-14" aria-label="Who this is for">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] text-center mb-6">
            Built for students who want confidence before exam day
          </h2>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Two-right-answer questions',
              'Readiness confidence',
              'Priority and safety',
              'Assessment-first reasoning',
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
      <section className="bg-white py-12 sm:py-16" aria-label="Get started">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2545] mb-3">
            Stop guessing if you are ready.
          </h2>
          <p className="text-sm sm:text-base text-[#1E2D3D]/70 mb-6">
            Start with a short drill, see what patterns are costing you points, and practice what actually needs work. No credit card required.
          </p>
          <Link
            href="/signup"
            onClick={() => trackEvent('nclex_practice_primary_cta_clicked')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0D8F9C] text-white rounded-lg text-base font-semibold hover:bg-[#0a7d88] transition-colors shadow-sm"
          >
            Start Free 7-Day Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
