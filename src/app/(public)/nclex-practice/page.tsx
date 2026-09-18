import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata("NCLEX-RN Study Guides and Practice", "Explore study guides for your NCLEX-RN retake, from reviewing missed answers to delegation and prioritization. Try three free practice questions.", "/nclex-practice")

const guides = [
  { path: '/failed-nclex-what-to-do-next', title: 'Failed the NCLEX? Start here.', text: 'Use your Candidate Performance Report and practice review to choose a manageable starting focus.' },
  { path: '/why-do-i-get-nclex-questions-down-to-two-answers', title: 'Stuck between two answers?', text: 'Compare the choices against the question and the information you have.' },
  { path: '/nclex-answer-traps', title: 'Common answer traps', text: 'Turn a missed question into a specific note you can use next time.' },
  { path: '/nclex-priority-vs-assessment', title: 'Priority versus assessment', text: 'Review how urgency and available information change the next action.' },
  { path: '/nclex-delegation-questions', title: 'Delegation questions', text: 'Consider the patient, the task, and the responsibilities of the team member.' },
]

export default function Page() {
  return <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
    <p className="text-sm font-bold uppercase tracking-widest text-teal-700">For your next NCLEX-RN attempt</p>
    <h1 className="mt-4 text-4xl font-bold text-[#0B2545]">NCLEX-RN study guides and practice</h1>
    <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">Choose a guide for the question you have today. Then try a short practice session, review your answer, and apply the lesson to a related question.</p>
    <Link href="/answer-trap-check" className="my-8 inline-flex rounded-xl bg-teal-700 px-6 py-4 font-semibold text-white">Try 3 free practice questions →</Link>
    <div className="grid gap-5 sm:grid-cols-2">{guides.map(guide => <Link key={guide.path} href={guide.path} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-teal-600">
      <h2 className="text-xl font-bold text-[#0B2545]">{guide.title}</h2><p className="mt-3 leading-relaxed text-slate-600">{guide.text}</p>
    </Link>)}</div>
    <section className="mt-10 rounded-2xl bg-slate-100 p-6"><h2 className="text-xl font-bold">Use your official exam resources</h2>
      <p className="mt-3 leading-relaxed">These guides support your preparation. Use the <a className="underline" href="https://www.nclex.com/candidate-performance-report.page">official Candidate Performance Report guidance</a> and <a className="underline" href="https://www.nclex.com/test-plans.page">NCLEX test plans</a> alongside your nursing references.</p>
      <p className="mt-3 text-sm text-slate-600">ForgeNursing is an AI-assisted study tool, is not affiliated with NCSBN, and does not predict or guarantee exam outcomes.</p>
    </section>
  </div>
}
