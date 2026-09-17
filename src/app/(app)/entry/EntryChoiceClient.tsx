'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { CPR_CATEGORIES, DIFFICULTIES, EMPTY_RETAKE_PLAN, cprPracticeCategory, type RetakePlan } from '@/lib/retake-plan'

type StarterCheck = { score: number; total_questions: number; detected_trap: string | null }
type Focus = { has_personal_plan: boolean; focus: string; focus_explanation: string }

export default function EntryChoiceClient() {
  const router = useRouter()
  const [plan, setPlan] = useState<RetakePlan>(EMPTY_RETAKE_PLAN)
  const [check, setCheck] = useState<StarterCheck | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [claimNotice, setClaimNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      let sessionId: string | null = null
      let anonymousId: string | null = null
      try { sessionId = localStorage.getItem('answer_trap_session_id'); anonymousId = localStorage.getItem('answer_trap_anonymous_id') } catch {}
      if (sessionId && anonymousId) {
        const claimed = await fetch('/api/answer-trap-check/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, anonymous_id: anonymousId }) })
        if (claimed.ok) {
          try { localStorage.removeItem('answer_trap_session_id'); localStorage.removeItem('answer_trap_anonymous_id') } catch {}
          setClaimNotice('Your starter check is saved to your account.')
        } else {
          setClaimNotice('Your starter check has not been saved yet. Retry the handoff below; you can still practice.')
        }
      }
      const [planResponse, focusResponse] = await Promise.all([fetch('/api/retake-plan', { cache: 'no-store' }), fetch('/api/fix-plan', { cache: 'no-store' })])
      if (!planResponse.ok) throw new Error('Your plan could not load. Please retry.')
      const saved = await planResponse.json()
      setPlan(saved.plan); setCheck(saved.check); setEditing(!saved.plan.completed)
      if (focusResponse.ok) setFocus(await focusResponse.json())
      else if (focusResponse.status === 402) { router.push('/pricing'); return }
      else throw new Error('Your practice history could not load. Please retry.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load your plan.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function savePlan() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/retake-plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...plan, completed: true }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Could not save your plan.')
      setPlan(body.plan); setEditing(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save your plan.') }
    finally { setBusy(false) }
  }

  const practiceFocus = focus?.has_personal_plan ? focus.focus : check?.detected_trap
  const reportCategory = cprPracticeCategory(plan)
  async function startPractice() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/quiz/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        sourceType: 'generic', quizMode: practiceFocus ? 'targeted_drill' : 'diagnostic',
        targetMistakeType: practiceFocus || null,
        targetFocus: focus?.has_personal_plan ? focus.focus_explanation : practiceFocus,
        nclexCategory: practiceFocus ? null : reportCategory, totalQuestions: practiceFocus ? 3 : 5,
      }) })
      const body = await response.json()
      if (response.status === 402) { router.push('/pricing'); return }
      if (!response.ok) throw new Error(body.error || 'Could not start practice.')
      router.push(`/quiz?sessionId=${body.session.id}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not start practice.'); setBusy(false) }
  }

  if (loading) return <div className="p-10 flex items-center gap-3" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Loading your practice plan…</div>
  return <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-12 text-[#0B2545]">
    <p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">Your next attempt starts here</p>
    <h1 className="mt-3 text-3xl sm:text-4xl font-bold">One useful session at a time.</h1>
    <p className="mt-3 text-slate-600">Practice a few questions, understand your choices, then try the skill again.</p>
    {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error} <button onClick={load} className="underline font-semibold">Retry loading</button></div>}
    {claimNotice && <div role="status" className="mt-5 rounded-xl bg-teal-50 p-4 text-sm">{claimNotice} {claimNotice.includes('not been') && <button onClick={load} className="underline">Retry handoff</button>}</div>}
    {check && <p className="mt-4 text-sm text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Starter check saved: {check.score}/{check.total_questions}. A starting point, not a readiness score.</p>}
    {editing ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5">
      <div><h2 className="text-xl font-bold">Make this plan yours</h2><p className="mt-2 text-sm text-slate-600">These details are optional. This plan focuses on NCLEX-RN preparation.</p></div>
      <label className="block text-sm font-semibold">Target exam date <span className="font-normal text-slate-500">(optional)</span><input type="date" value={plan.targetDate} onChange={e => setPlan({ ...plan, targetDate: e.target.value })} className="mt-2 block w-full rounded-lg border border-slate-300 p-3" /></label>
      <label className="block text-sm font-semibold">What did you use to prepare last time?<input maxLength={300} value={plan.previousPrep} onChange={e => setPlan({ ...plan, previousPrep: e.target.value })} placeholder="For your reference, e.g. a question bank or review course" className="mt-2 block w-full rounded-lg border border-slate-300 p-3 font-normal" /></label>
      <label className="block text-sm font-semibold">What felt hardest?<select value={plan.difficulty || ''} onChange={e => setPlan({ ...plan, difficulty: e.target.value as RetakePlan['difficulty'] || null })} className="mt-2 block w-full rounded-lg border border-slate-300 p-3"><option value="">Not sure yet / skip</option>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></label>
      <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Have a Candidate Performance Report? (optional)</summary><p className="my-3 text-sm text-slate-600">Enter the ratings shown on your report. Below, then Near categories guide the first session when you do not yet have a practice focus. Keep reviewing other areas too. No upload needed.</p><div className="space-y-3">{CPR_CATEGORIES.map(category => <label key={category} className="block text-sm">{category}<select value={plan.cpr[category] || ''} onChange={e => { const cpr = { ...plan.cpr }; if (e.target.value) cpr[category] = e.target.value as 'Below' | 'Near' | 'Above'; else delete cpr[category]; setPlan({ ...plan, cpr }) }} className="mt-1 block w-full rounded-lg border border-slate-300 p-2"><option value="">Not entered</option>{['Below', 'Near', 'Above'].map(rating => <option key={rating}>{rating}</option>)}</select></label>)}</div></details>
      <button disabled={busy} onClick={savePlan} className="rounded-xl bg-[#0D8F9C] px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save and continue'}</button>
      <button disabled={busy} onClick={() => setEditing(false)} className="ml-4 py-3 text-sm underline">Skip for now</button>
    </section> : <>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0D8F9C]">Today’s practice</p>
        <h2 className="mt-3 text-2xl font-bold">{practiceFocus || reportCategory || 'Start with five questions'}</h2>
        <p className="mt-3 text-slate-600">{practiceFocus ? 'A focus drawn from missed practice answers. Try three questions and review each choice.' : reportCategory ? 'A starting category from your report. Try five questions to see what needs review.' : 'A short mixed session gives you a starting point. You do not need to upload anything.'}</p>
        {plan.targetDate && <p className="mt-4 text-sm text-slate-500">Your target: {plan.targetDate}. This is a planning date, not a readiness assessment.</p>}
        <button onClick={startPractice} disabled={busy || !!error} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-5 py-3 font-bold text-white hover:bg-[#087986] disabled:opacity-50">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}{busy ? 'Starting…' : `Start ${practiceFocus ? '3' : '5'} questions`}</button>
      </section>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">{[['Practice', 'Take your time with a short set.'], ['Understand', 'Compare your choice with the explanation. Ask the tutor if you need more help.'], ['Try again', 'Use a fresh question after a miss, then check your practice history.']].map(([title, body], i) => <li key={title} className="rounded-xl bg-slate-100 p-4"><p className="font-bold">{i + 1}. {title}</p><p className="mt-2 text-sm text-slate-600">{body}</p></li>)}</ol>
      <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold"><button onClick={() => setEditing(true)} className="underline">Edit plan details</button><Link href="/readiness" className="underline">View progress</Link><Link href="/quiz" className="underline">Other practice options</Link></div>
      <p className="mt-6 text-xs text-slate-500">AI-assisted practice supports your study resources. Explanations can be wrong; check uncertain clinical details against trusted nursing references. Practice results do not predict passing.</p>
    </>}
  </div>
}
