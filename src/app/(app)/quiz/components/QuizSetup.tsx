'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'


const NCLEX_CATEGORIES = [
  'All Categories',
  'Management of Care',
  'Safety and Infection Control',
  'Health Promotion and Maintenance',
  'Psychosocial Integrity',
  'Basic Care and Comfort',
  'Pharmacological Therapies',
  'Reduction of Risk Potential',
  'Physiological Adaptation',
]

type StartOptions = {
  quizMode?: 'standard' | 'targeted_drill'
  targetMistakeType?: string | null
  targetFocus?: string | null
  totalQuestions?: number
}

interface QuizSetupProps {
  hasDocuments: boolean
  sourceType: 'document' | 'generic'
  setSourceType: (t: 'document' | 'generic') => void
  category: string
  setCategory: (c: string) => void
  onStart: (options?: StartOptions) => void
  loading: boolean
  resumeSession?: { id: string; current_question_index: number; total_questions: number } | null
  onResume?: () => void
}

export default function QuizSetup({hasDocuments, setSourceType, category, setCategory, onStart, loading, resumeSession, onResume}: QuizSetupProps) {
  const [mode, setMode] = useState<'mixed' | 'topic' | 'documents' | 'suggested'>('mixed')
  const [suggestion, setSuggestion] = useState<{focus: string; focus_explanation: string} | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/fix-plan', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.has_personal_plan) {
          setSuggestion(data)
          if (new URLSearchParams(window.location.search).get('suggested') === '1') setMode('suggested')
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  function choose(next: typeof mode) {
    setMode(next)
    setSourceType(next === 'documents' ? 'document' : 'generic')
    setCategory('All Categories')
  }
  return <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-12 text-[#0B2545]">
    <p className="text-xs font-bold uppercase tracking-widest text-[#087986]">Practice</p>
    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Choose your next short session.</h1>
    <p className="mt-3 text-slate-600">Choose a short set, review each answer, and try a related question after a miss.</p>
    {resumeSession && onResume && <section className="mt-7 rounded-2xl bg-[#0B2545] p-6 text-white">
      <h2 className="text-xl font-bold text-white">Continue your saved session</h2>
      <p className="mt-2 text-slate-200">{resumeSession.current_question_index} of {resumeSession.total_questions} questions completed.</p>
      <button disabled={loading} onClick={onResume} className="mt-4 rounded-xl bg-white px-5 py-3 font-bold text-[#0B2545] disabled:opacity-50">Resume practice →</button>
    </section>}
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold">{resumeSession ? 'Or begin a new session' : 'Choose your practice'}</h2>
      {suggestion && <label className={`mt-5 block cursor-pointer rounded-xl border p-4 ${mode === 'suggested' ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}><input type="radio" name="practice-mode" checked={mode === 'suggested'} onChange={() => choose('suggested')} className="mr-2 accent-teal-700" /><span className="font-bold">Suggested: {suggestion.focus}</span><p className="mt-2 text-sm text-slate-600">Based on missed practice answers. {suggestion.focus_explanation}</p><p className="mt-2 text-xs text-slate-500">3 focused questions · Keep reviewing other areas too</p></label>}
      <fieldset className="mt-5 grid gap-3 sm:grid-cols-2"><legend className="sr-only">Question source</legend>
        {[{id:'mixed',title:'Mixed practice',body:'A short set across NCLEX-RN topics.'},{id:'topic',title:'Choose a topic',body:'Focus on an area you want to revisit.'}].map(item => <label key={item.id} className={`cursor-pointer rounded-xl border p-4 ${mode === item.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}><input type="radio" name="practice-mode" checked={mode===item.id} onChange={() => choose(item.id as 'mixed' | 'topic')} className="mr-2 accent-teal-700" /><span className="font-bold">{item.title}</span><p className="mt-2 text-sm text-slate-600">{item.body}</p></label>)}
      </fieldset>
      {mode === 'topic' && <label className="mt-5 block text-sm font-semibold">NCLEX topic<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3">{NCLEX_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>}
      <details className="mt-5 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Practice from uploaded notes</summary><p className="mt-3 text-sm text-slate-600">Use your existing course materials for a separate study session.</p>{hasDocuments ? <label className="mt-3 block text-sm"><input type="radio" name="practice-mode" checked={mode==='documents'} onChange={()=>choose('documents')} className="mr-2" />Use my notes for this session</label> : <Link href="/binder" className="mt-3 inline-block text-sm font-semibold text-[#087986] underline">Add study materials</Link>}</details>
      <p className="mt-6 text-sm text-slate-600">{mode === 'suggested' ? 3 : 5} questions · Go at your own pace{mode==='documents' ? ' · From your notes' : ''}</p>
      {resumeSession && <p className="mt-2 text-sm text-slate-500">Starting a new session ends the unfinished set. Answers already submitted remain in your progress.</p>}
      <button disabled={loading || (mode==='documents' && !hasDocuments)} onClick={()=>onStart(mode === 'suggested' && suggestion ? {quizMode:'targeted_drill',totalQuestions:3,targetMistakeType:suggestion.focus,targetFocus:suggestion.focus_explanation} : {quizMode:'standard',totalQuestions:5})} className="mt-4 min-h-12 w-full rounded-xl bg-[#0D8F9C] px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Starting…' : `Start ${mode === 'suggested' ? 3 : 5} questions →`}</button>
    </section>
    <p className="mt-6 text-xs text-slate-500">AI-assisted study practice. Check uncertain explanations against your nursing references.</p>
  </div>
}
