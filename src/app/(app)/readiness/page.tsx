'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PracticeTrend } from '@/lib/practice-progress'
type Session = { id: string; status: string; total_questions: number; score: number; created_at: string }
type Area = { mistake_type: string; attempted: number; correct: number; missed: number; accuracy: number; trend: PracticeTrend }
type Progress = { summary: { total_attempted: number; total_correct: number; overall_accuracy: number }; mistake_types: Area[]; top_weakness: Area | null }
const trendLabels: Record<PracticeTrend, string> = { insufficient: 'Not enough answers to compare', improving: 'Higher recent accuracy', steady: 'Same recent accuracy', declining: 'Lower recent accuracy' }
export default function ProgressPage() {
  const [data, setData] = useState<Progress | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setError('')
    try {
      const [response, history] = await Promise.all([fetch('/api/judgment-map', { cache: 'no-store' }), fetch('/api/quiz/sessions', { cache: 'no-store' })])
      setHistoryError(!history.ok)
      if (history.ok) setSessions((await history.json()).sessions.filter((s: Session) => s.status === 'completed'))
      if (!response.ok) throw new Error(response.status === 402 ? 'Your trial or subscription has ended. Open Account to manage access.' : 'Your progress could not load. Please retry.')
      setData(await response.json())
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load progress.') }
  }
  useEffect(() => { void load() }, [])
  return <div className="mx-auto w-full max-w-4xl px-5 py-9 text-[#0B2545]">
    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#087986]">Progress</p>
    <h1 className="text-3xl font-bold">Your practice progress</h1>
    <p className="mt-3 max-w-2xl text-slate-600">See what you answered and what needs another look. These results describe your practice, not your chances of passing.</p>
    {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{error} <button onClick={load} className="underline">Retry</button></p>}
    {!data && !error && <p role="status" className="mt-8">Loading your answers…</p>}
    {data && <>
      {data.top_weakness && data.summary.total_attempted >= 5 && <section className="mt-6 rounded-2xl bg-teal-50 p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#087986]">Suggested review</p><h2 className="mt-2 text-xl font-bold">{data.top_weakness.mistake_type}</h2><p className="mt-2 text-sm text-slate-600">Based on missed practice answers. Review the explanation, then apply the lesson to a fresh question.</p><Link href="/quiz?suggested=1" className="mt-4 inline-block font-bold text-[#087986] underline">Choose focused practice →</Link></section>}

      <div className="mt-8 grid grid-cols-2 gap-4"><div className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">Questions answered</p><p className="mt-2 text-3xl font-bold">{data.summary.total_attempted}</p></div><div className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">Correct answers</p><p className="mt-2 text-3xl font-bold">{data.summary.total_correct}<span className="text-base font-normal text-slate-500"> / {data.summary.total_attempted}</span></p></div></div>
      {!data.summary.total_attempted ? <div className="mt-6 rounded-xl bg-teal-50 p-6"><h2 className="font-bold">Your first session is your starting point.</h2><p className="mt-2 text-sm">Complete a short practice session to see results here. Your three-question public check stays on your practice plan and is not included in these counts.</p></div> : <>
        <h2 className="mt-8 text-xl font-bold">Practice by focus</h2><p className="mt-2 text-sm text-slate-600">Changes compare the latest three answers with the previous three in the same focus. They are small samples with different questions and difficulty, not proof of mastery.</p>
        <ul className="mt-5 space-y-3">{data.mistake_types.map(area => <li key={area.mistake_type} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{area.mistake_type}</h3><p className="text-sm">{area.correct}/{area.attempted} correct · {area.missed} missed</p></div><p className="mt-2 text-sm text-slate-600">{trendLabels[area.trend]}</p></li>)}</ul>

      </>}
      <p className="mt-6 text-xs text-slate-500">Shows up to your 500 most recent answered practice questions. A focus is a question category; an incorrect answer does not establish why you chose it.</p>
    </>}
    {sessions.length > 0 && <section className="mt-8"><h2 className="text-xl font-bold">Revisit a session</h2><p className="mt-2 text-sm text-slate-600">Open your saved answers and explanations.</p><ul className="mt-4 space-y-3">{(showAllSessions ? sessions : sessions.slice(0, 3)).map(session => <li key={session.id}><Link href={`/quiz/results?sessionId=${session.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600"><span><span className="font-semibold">{new Date(session.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</span><span className="ml-3 text-sm text-slate-600">{session.score}/{session.total_questions} correct</span></span><span className="text-sm font-bold text-[#087986]">Review answers →</span></Link></li>)}</ul>{sessions.length > 3 && <button onClick={() => setShowAllSessions(value => !value)} className="mt-4 text-sm font-semibold text-[#087986] underline" aria-expanded={showAllSessions}>{showAllSessions ? 'Show fewer sessions' : 'View more sessions'}</button>}<p className="mt-3 text-xs text-slate-500">Completed sessions from your 20 most recent sessions.</p></section>}
    {historyError && <p role="status" className="mt-5 text-sm text-slate-600">Session history is unavailable. <button onClick={load} className="underline">Retry</button></p>}
    <Link href="/entry" className="mt-7 inline-block rounded-xl bg-[#0D8F9C] px-6 py-3 font-bold text-white">Choose my next session</Link>
  </div>
}
