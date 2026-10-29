import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { ArrowRight, Check, RotateCcw } from 'lucide-react'

export const metadata = pageMetadata("NCLEX-RN Retake Program — Your Score Report Is a Study Plan", "Failed the NCLEX? Use your Candidate Performance Report to choose a starting focus. Seven-day free trial, no card. $29.99 for three months; don’t pass, and the next three are free.", "/")

export default function HomePage() {
  return <div className="text-[#0B2545]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': 'https://forgenursing.com/#organization', name: 'ForgeNursing', url: 'https://forgenursing.com', email: 'support@forgenursing.com' },
      { '@type': 'WebSite', '@id': 'https://forgenursing.com/#website', name: 'ForgeNursing', url: 'https://forgenursing.com', publisher: { '@id': 'https://forgenursing.com/#organization' } }
    ] }) }} />
    <section className="bg-[#0B2545] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6EE0DE]">A 3-month NCLEX-RN retake program</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold text-white leading-[1.12] sm:text-5xl lg:text-6xl">Failed the NCLEX? Your score report is a study plan.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">One exam result is information, not your identity. Start with the Below and Near categories on your Candidate Performance Report. Practice a short set, understand why your choice missed the cue, and try the reasoning again.</p>
          <Link href="/answer-trap-check" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#6EE0DE] px-6 py-4 font-bold text-[#0B2545] hover:bg-teal-200">Try 3 free practice questions <ArrowRight className="h-5 w-5" /></Link>
          <p className="mt-3 text-sm text-slate-300">No account. No credit card. Includes an optional retry after each miss.</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white p-6 text-[#0B2545] shadow-xl sm:p-8">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">Your next attempt, with a plan</p><RotateCcw className="h-5 w-5 text-[#0D8F9C]" /></div>
          <h2 className="mt-5 text-2xl font-bold">Work on what needs work.</h2>
          <ol className="mt-6 space-y-6">{[
            ['Start with your score report', 'Add your CPR category ratings and optional exam date to choose a starting focus.'],
            ['Understand your wrong answer', 'See why your selected answer does not fit, which cue matters, and how to reason through it.'],
            ['Try again, then revisit', 'Take a related retry after a miss. Bank-original misses add a fresh review, available anytime; tomorrow is a suggestion. Scores stay separate.'],
          ].map(([title, body], i) => <li key={title} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-[#0D8F9C]">{i + 1}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p></div></li>)}</ol>
          <div className="mt-7 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">A job waiting on licensure. A shift to finish. A next attempt to prepare for. Keep daily practice small enough to complete on a break. You can start without your CPR.</div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">Failure is data, not a verdict</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-bold">A missed question should leave you with something useful.</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{[
        ['A plan with edges', 'Use Below, Near, and Above CPR ratings to find a starting category instead of treating every topic as equally urgent.'],
        ['Learn the cue behind the answer', 'Practice priority-setting, safety, delegation, and other clinical decisions. Compare your choice with its explanation; ask the tutor for a walkthrough.'],
        ['See the work you are doing', 'Review your saved answers, practice accuracy, and reasoning focuses. These describe your practice here, not your chances of passing.'],
      ].map(([title, body]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><Check className="h-5 w-5 text-[#0D8F9C]" /><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p></article>)}</div>
    </section>
    <section className="border-y border-slate-200 bg-white"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-2"><div><h2 className="text-2xl font-bold">Keep the resources you trust.</h2><p className="mt-4 leading-relaxed text-slate-600">AI-assisted, source-checked — not independently clinically validated. Generated questions are an optional supplement. Check uncertain explanations against your nursing references. Practice results do not predict readiness or guarantee a pass.</p></div><div className="rounded-2xl bg-[#F0F7F8] p-6"><h3 className="font-bold">Start with a 7-day free trial.</h3><p className="mt-3 text-slate-600">$29.99 for 3 months. Don’t pass, and the next 3 are free. Nothing auto-renews. No card to start your trial.</p><p className="mt-3 text-sm text-slate-600">When your initial three months end, activate one free three-month extension in Account. No proof or claim required. Up to six months of access.</p><Link href="/signup" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-[#087986]">Start your free trial <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    <section className="mx-auto max-w-3xl px-5 py-14 text-center"><h2 className="text-3xl font-bold">Start with the next three questions.</h2><p className="mt-4 text-slate-600">See the practice and feedback before creating an account.</p><Link href="/answer-trap-check" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-4 font-bold text-white hover:bg-[#087986]">Try the free practice check <ArrowRight className="h-5 w-5" /></Link></section>
  </div>
}
