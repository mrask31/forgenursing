'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PracticeTrend } from '@/lib/practice-progress'
type Area = { mistake_type: string; attempted: number; correct: number; missed: number; accuracy: number; trend: PracticeTrend }
type Progress = { summary: { total_attempted: number; total_correct: number; overall_accuracy: number }; mistake_types: Area[]; top_weakness: Area | null }
const trendLabels: Record<PracticeTrend, string> = { insufficient: 'Not enough answers to compare', improving: 'Higher recent accuracy', steady: 'Same recent accuracy', declining: 'Lower recent accuracy' }
export default function ProgressPage() {
  const [data, setData] = useState<Progress | null>(null)
  const [error, setError] = useState('')
  async function load() {
    setError('')
    try {
      const response = await fetch('/api/judgment-map', { cache: 'no-store' })
      if (!response.ok) throw new Error(response.status === 402 ? 'Your trial or subscription has ended. Open Account to manage access.' : 'Your progress could not load. Please retry.')
      setData(await response.json())
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load progress.') }
  }
  useEffect(() => { void load() }, [])
  return <div className="mx-auto w-full max-w-4xl px-5 py-9 text-[#0B2545]">
    <h1 className="text-3xl font-bold">Your practice progress</h1>
    <p className="mt-3 max-w-2xl text-slate-600">See what you answered and what needs another look. These results describe your practice, not your chances of passing.</p>
    {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{error} <button onClick={load} className="underline">Retry</button></p>}
    {!data && !error && <p role="status" className="mt-8">Loading your answers…</p>}
    {data && <>
      <div className="mt-8 grid grid-cols-2 gap-4"><div className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">Questions answered</p><p className="mt-2 text-3xl font-bold">{data.summary.total_attempted}</p></div><div className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">Correct answers</p><p className="mt-2 text-3xl font-bold">{data.summary.total_correct}<span className="text-base font-normal text-slate-500"> / {data.summary.total_attempted}</span></p></div></div>
      {!data.summary.total_attempted ? <div className="mt-6 rounded-xl bg-teal-50 p-6"><h2 className="font-bold">Your first session is your starting point.</h2><p className="mt-2 text-sm">Complete a short practice session to see results here. Your three-question public check stays on your practice plan and is not included in these counts.</p></div> : <>
        <h2 className="mt-8 text-xl font-bold">Practice by focus</h2><p className="mt-2 text-sm text-slate-600">Changes compare the latest three answers with the previous three in the same focus. They are small samples with different questions and difficulty, not proof of mastery.</p>
        <ul className="mt-5 space-y-3">{data.mistake_types.map(area => <li key={area.mistake_type} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{area.mistake_type}</h3><p className="text-sm">{area.correct}/{area.attempted} correct · {area.missed} missed</p></div><p className="mt-2 text-sm text-slate-600">{trendLabels[area.trend]}</p></li>)}</ul>
        {data.top_weakness && <p className="mt-6 text-sm text-slate-600">Suggested review: <strong>{data.top_weakness.mistake_type}</strong>, based on missed practice answers. Review other areas too.</p>}
      </>}
      <p className="mt-6 text-xs text-slate-500">Shows up to your 500 most recent answered practice questions. A focus is a question category; an incorrect answer does not establish why you chose it.</p>
    </>}
    <Link href="/entry" className="mt-7 inline-block rounded-xl bg-[#0D8F9C] px-6 py-3 font-bold text-white">Back to practice</Link>
  </div>
}
