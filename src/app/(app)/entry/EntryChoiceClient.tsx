'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CheckCircle2, Loader2, Target, Sparkles } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'

type FixPlan = {
  has_personal_plan: boolean
  total_attempted: number
  focus: string
  focus_explanation: string
  cta_label: string
  cta_href: string
  steps: Array<{ title: string; body: string; action: string }>
}

export default function EntryChoiceClient() {
  const router = useRouter()
  const [preferredName, setPreferredName] = useState<string>('')
  const [rememberChoice, setRememberChoice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fixPlan, setFixPlan] = useState<FixPlan | null>(null)
  const [fixPlanLoading, setFixPlanLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_name')
        .eq('id', user.id)
        .single()
      if (profile?.preferred_name) setPreferredName(profile.preferred_name)
    }
    loadProfile()
  }, [])

  useEffect(() => {
    const loadFixPlan = async () => {
      setFixPlanLoading(true)
      try {
        const res = await fetch('/api/fix-plan', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        setFixPlan(data)
      } catch (error) {
        console.warn('[Entry] Fix plan failed to load:', error)
      } finally {
        setFixPlanLoading(false)
      }
    }

    loadFixPlan()
  }, [])

  const handleChoice = async (path: 'quiz' | 'tutor') => {
    setLoading(true)
    try {
      if (rememberChoice) {
        const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ default_entry_path: path })
            .eq('id', user.id)
        }
      }

      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('quiz_path_selected', {
          source: 'entry_screen',
          had_previous_preference: false,
          remember_choice_checked: rememberChoice,
          selected_path: path,
        })
      } catch {}

      router.push(path === 'quiz' ? '/quiz' : '/tutor')
    } catch {
      setLoading(false)
    }
  }

  const handleFixPlanStart = async () => {
    try {
      const posthog = (await import('posthog-js')).default
      posthog.capture('fix_plan_started', {
        source: 'entry_screen',
        focus: fixPlan?.focus ?? null,
        has_personal_plan: fixPlan?.has_personal_plan ?? false,
        total_attempted: fixPlan?.total_attempted ?? 0,
      })
    } catch {}

    router.push('/quiz')
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] px-4 py-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#0B2545' }}>
            Hey{preferredName ? ` ${preferredName}` : ''}! 👋
          </h1>
          <p className="text-base text-gray-600">
            Forge has a study path ready for you.
          </p>
        </div>

        <section className="rounded-2xl border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E0F4F6] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0B2545]">
                <Sparkles className="h-3.5 w-3.5 text-[#0D8F9C]" />
                Today’s Fix Plan
              </div>
              <h2 className="mt-3 text-xl font-bold" style={{ color: '#0B2545' }}>
                {fixPlanLoading ? 'Building your plan…' : fixPlan?.focus || 'Build your first Judgment Map'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {fixPlanLoading
                  ? 'Forge is checking your recent practice patterns.'
                  : fixPlan?.focus_explanation || 'Answer a few questions so Forge can learn what to train next.'}
              </p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E0F4F6] sm:flex">
              <Target className="h-6 w-6 text-[#0D8F9C]" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {fixPlanLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#0D8F9C]" />
                Loading today’s plan...
              </div>
            ) : (
              (fixPlan?.steps ?? []).map((step, index) => (
                <div key={`${step.title}-${index}`} className="rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D8F9C] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0B2545' }}>{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.body}</p>
                      <p className="mt-2 text-xs font-semibold text-[#0D8F9C]">{step.action}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleFixPlanStart}
            disabled={fixPlanLoading || loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0a7d88] disabled:opacity-60"
            style={{ minHeight: '52px' }}
          >
            {fixPlanLoading ? 'Building plan…' : fixPlan?.cta_label || 'Start Practice'}
          </button>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => handleChoice('quiz')}
            disabled={loading}
            className="w-full rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-md disabled:opacity-50"
            style={{ borderColor: '#0D8F9C', minHeight: '56px' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="font-semibold text-base" style={{ color: '#0B2545' }}>Practice Questions</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Train patterns with Quick Why and visual lessons
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleChoice('tutor')}
            disabled={loading}
            className="w-full rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-md disabled:opacity-50"
            style={{ borderColor: '#0B2545', minHeight: '56px' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-semibold text-base" style={{ color: '#0B2545' }}>AI Clinical Tutor</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Work through concepts step by step
                </p>
              </div>
            </div>
          </button>
        </div>

        <label className="flex items-center justify-center gap-3 cursor-pointer px-1" style={{ minHeight: '44px' }}>
          <input
            type="checkbox"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 accent-[#0D8F9C]"
          />
          <span className="text-sm text-gray-600">Remember my choice</span>
        </label>

        <p className="text-center text-sm text-gray-400 px-4">
          You can always switch modes from the menu.
        </p>
      </div>
    </div>
  )
}
