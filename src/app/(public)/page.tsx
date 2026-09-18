import Link from 'next/link'
import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { STANDARD_OFFER } from '@/lib/offer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ForgeNursing | A clearer plan for your NCLEX-RN retake',
  description: 'Preparing for the NCLEX-RN again? Start with a short practice check, understand your choices, and build a focused study routine. No uploads required.',
}

export default function HomePage() {
  return <div className="text-[#0B2545]">
    <section className="bg-[#0B2545] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6EE0DE]">For your next NCLEX-RN attempt</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold text-white leading-[1.12] sm:text-5xl lg:text-6xl">Retaking the NCLEX-RN? Practice the decisions that need more work.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">Work through a short session, understand each missed answer, and try a related question to apply what you learned.</p>
          <Link href="/answer-trap-check" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#6EE0DE] px-6 py-4 font-bold text-[#0B2545] hover:bg-teal-200">Try 3 free practice questions <ArrowRight className="h-5 w-5" /></Link>
          <p className="mt-3 text-sm text-slate-300">No account. No credit card. Includes an optional retry after each miss.</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white p-6 text-[#0B2545] shadow-xl sm:p-8">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">A simpler study routine</p><RotateCcw className="h-5 w-5 text-[#0D8F9C]" /></div>
          <h2 className="mt-5 text-2xl font-bold">Know what to do next.</h2>
          <ol className="mt-6 space-y-6">{[
            ['Practice a little', 'Start with a short session you can actually finish.'],
            ['Understand your choice', 'Review the clinical cue and explanation for the answer you selected.'],
            ['Try the skill again', 'Use a fresh question after a miss, then review your practice progress.'],
          ].map(([title, body], i) => <li key={title} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-[#0D8F9C]">{i + 1}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p></div></li>)}</ol>
          <div className="mt-7 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Have a Candidate Performance Report? Add its category ratings to help choose a starting focus. You can also begin without it.</div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">A focused companion for your retake</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-bold">A missed question should leave you with something useful.</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{[
        ['A manageable starting point', 'Set an optional exam date, note what felt difficult, and begin a short practice session. No course upload or complicated setup.'],
        ['Help with the reasoning', 'See why your selected answer doesn’t fit and which cue matters. Open the tutor when you need a further walkthrough.'],
        ['See what needs another look', 'Review what you’ve practiced, revisit missed topics, and see how your practice accuracy changes over time.'],
      ].map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><Check className="h-5 w-5 text-[#0D8F9C]" /><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p></article>)}</div>
    </section>
    <section className="border-y border-slate-200 bg-white"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-2"><div><h2 className="text-2xl font-bold">Keep the resources you trust.</h2><p className="mt-4 leading-relaxed text-slate-600">Use ForgeNursing’s AI-assisted practice alongside your nursing references and NCLEX prep. Practice results do not predict exam readiness or guarantee a pass.</p></div><div className="rounded-2xl bg-[#F0F7F8] p-6"><h3 className="font-bold">Try the full experience for {STANDARD_OFFER.trialDays} days.</h3><p className="mt-3 text-slate-600">Then ${STANDARD_OFFER.monthly}/month or ${STANDARD_OFFER.annual}/year. No credit card to start your trial. Subscribe when you choose.</p><Link href="/signup" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-[#087986]">Start your free trial <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    <section className="mx-auto max-w-3xl px-5 py-14 text-center"><h2 className="text-3xl font-bold">Start with the next three questions.</h2><p className="mt-4 text-slate-600">See the practice and feedback before creating an account.</p><Link href="/answer-trap-check" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-4 font-bold text-white hover:bg-[#087986]">Try the free practice check <ArrowRight className="h-5 w-5" /></Link></section>
  </div>
}
