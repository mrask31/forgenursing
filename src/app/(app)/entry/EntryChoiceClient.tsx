'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ClipboardCheck, FileSearch, Loader2, Map, RotateCcw, ShieldCheck, Target } from 'lucide-react'
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
  const [loadingPath, setLoadingPath] = useState<string | null>(null)
  const [fixPlan, setFixPlan] = useState<FixPlan | null>(null)
  const [fixPlanLoading, setFixPlanLoading] = useState(true)
  const [fixPlanStarting, setFixPlanStarting] = useState(false)
  const [fixPlanError, setFixPlanError] = useState<string | null>(null)

  useEffect(() => {
    try {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.capture('retake_recovery_dashboard_viewed', {
          source: 'entry_screen',
          path: window.location.pathname,
        })
      })
    } catch {}
  }, [])

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
        console.warn('[Entry] Retake plan failed to load:', error)
      } finally {
        setFixPlanLoading(false)
      }
    }

    loadFixPlan()
  }, [])

  const navigate = async (path: string, eventName: string, extra: Record<string, unknown> = {}) => {
    setLoadingPath(path)
    try {
      const posthog = (await import('posthog-js')).default
      posthog.capture(eventName, {
        source: 'retake_recovery_dashboard',
        total_attempted: fixPlan?.total_attempted ?? 0,
        has_personal_plan: fixPlan?.has_personal_plan ?? false,
        ...extra,
      })
    } catch {}
    router.push(path)
  }

  const startDiagnosticOrDrill = async () => {
    if (fixPlanStarting) return
    setFixPlanStarting(true)
    setFixPlanError(null)

    const hasPersonalPlan = !!fixPlan?.has_personal_plan && !!fixPlan?.focus
    const quizMode = hasPersonalPlan ? 'targeted_drill' : 'diagnostic'

    try {
      const posthog = (await import('posthog-js')).default
      posthog.capture('retake_recovery_plan_started', {
        source: 'retake_recovery_dashboard',
        focus: fixPlan?.focus ?? null,
        has_personal_plan: fixPlan?.has_personal_plan ?? false,
        total_attempted: fixPlan?.total_attempted ?? 0,
        quiz_mode: quizMode,
      })
    } catch {}

    try {
      const body = hasPersonalPlan
        ? {
            sourceType: 'generic',
            nclexCategory: null,
            quizMode: 'targeted_drill',
            targetMistakeType: fixPlan!.focus,
            targetFocus: fixPlan!.focus_explanation,
            totalQuestions: 3,
          }
        : {
            sourceType: 'generic',
            nclexCategory: null,
            quizMode: 'diagnostic',
            totalQuestions: 5,
          }

      const res = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not start your recovery set')
      }

      const { session } = await res.json()

      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture(hasPersonalPlan ? 'retake_focused_drill_created' : 'retake_diagnostic_created', {
          source: 'retake_recovery_dashboard',
          session_id: session.id,
          focus: hasPersonalPlan ? fixPlan!.focus : null,
          total_questions: session.total_questions || (hasPersonalPlan ? 3 : 5),
        })
      } catch {}

      router.push(`/quiz?sessionId=${session.id}`)
    } catch (error: any) {
      console.error('[Entry] Retake practice start failed:', error)
      setFixPlanError(error?.message || 'Could not start your recovery set. Try Diagnostic Sets instead.')
      setFixPlanStarting(false)
    }
  }

  const attemptsNeeded = Math.max(0, 5 - (fixPlan?.total_attempted ?? 0))
  const hasPersonalPlan = !!fixPlan?.has_personal_plan

  return (
    <div className="min-h-screen bg-[#F7F9FB] px-4 py-6 sm:px-6 lg:px-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-[#DDE5EE] bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/25 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">
                <RotateCcw className="h-3.5 w-3.5" />
                NCLEX Retake Recovery
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: '#0B2545' }}>
                {preferredName ? `${preferredName}, ` : ''}before you retake, know why you picked the wrong one.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#1E2D3D]/70">
                This dashboard is built for the attempt after a failed NCLEX. Start with a diagnostic, review Answer Autopsies, watch your Mistake Pattern Map, then follow a focused Fix Plan.
              </p>
            </div>
            <div className="rounded-2xl border border-[#DDE5EE] bg-white p-4 text-center shadow-sm lg:w-56">
              <p className="text-xs font-bold uppercase tracking-wide text-[#0D8F9C]">Pattern evidence</p>
              <p className="mt-2 text-4xl font-bold" style={{ color: '#0B2545' }}>
                {fixPlanLoading ? '—' : fixPlan?.total_attempted ?? 0}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#1E2D3D]/60">
                answered questions shaping your recovery plan
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D8F9C]">Today’s Recovery Plan</p>
                <h2 className="mt-2 text-2xl font-bold" style={{ color: '#0B2545' }}>
                  {fixPlanLoading ? 'Building your plan…' : hasPersonalPlan ? fixPlan?.focus : 'Start with a retake diagnostic'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#1E2D3D]/70">
                  {fixPlanLoading
                    ? 'Forge is checking your recent missed-answer patterns.'
                    : hasPersonalPlan
                      ? fixPlan?.focus_explanation
                      : attemptsNeeded > 0
                        ? `Answer ${attemptsNeeded} more diagnostic question${attemptsNeeded === 1 ? '' : 's'} to unlock a more specific Fix Plan.`
                        : fixPlan?.focus_explanation || 'Take a short diagnostic so Forge can find the pattern to train first.'}
                </p>
              </div>
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E0F4F6] sm:flex">
                <Target className="h-6 w-6 text-[#0D8F9C]" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {fixPlanLoading ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#DDE5EE] bg-[#F7F9FB] p-4 text-sm text-[#1E2D3D]/60">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0D8F9C]" />
                  Loading recovery plan...
                </div>
              ) : (
                (fixPlan?.steps ?? []).map((step, index) => (
                  <div key={`${step.title}-${index}`} className="rounded-2xl border border-[#DDE5EE] bg-[#F7F9FB] p-4">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D8F9C] text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0B2545' }}>{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#1E2D3D]/70">{step.body}</p>
                        <p className="mt-2 text-xs font-bold text-[#0D8F9C]">{step.action}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {fixPlanError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {fixPlanError}
              </div>
            )}

            <button
              type="button"
              onClick={startDiagnosticOrDrill}
              disabled={fixPlanLoading || !!loadingPath || fixPlanStarting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0a7d88] disabled:opacity-60"
              style={{ minHeight: '52px' }}
            >
              {fixPlanStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting recovery set…
                </>
              ) : fixPlanLoading ? 'Building plan…' : hasPersonalPlan ? `Start ${fixPlan?.focus} Drill` : 'Start 5-Question Retake Diagnostic'}
            </button>
          </div>

          <div className="space-y-4">
            <RecoveryCard
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="Retake Diagnostic Sets"
              body="Answer short original NCLEX-style sets designed to expose why you miss, not just what you miss."
              cta="Start diagnostic"
              loading={loadingPath === '/quiz'}
              onClick={() => navigate('/quiz', 'retake_diagnostic_cta_clicked')}
            />
            <RecoveryCard
              icon={<Map className="h-5 w-5" />}
              title="Mistake Pattern Map"
              body="See recurring patterns like priority vs. true answer, SATA overselecting, delegation, safety, and second-guessing."
              cta="View map"
              loading={loadingPath === '/readiness'}
              onClick={() => navigate('/readiness', 'mistake_pattern_map_cta_clicked')}
            />
            <RecoveryCard
              icon={<FileSearch className="h-5 w-5" />}
              title="Answer Autopsy Coach"
              body="Use the tutor to break down a miss, explain why your answer was tempting, and create a better decision rule."
              cta="Open coach"
              loading={loadingPath === '/tutor'}
              onClick={() => navigate('/tutor', 'answer_autopsy_coach_cta_clicked')}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#DDE5EE] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0D8F9C]" />
            <div>
              <h2 className="text-base font-bold" style={{ color: '#0B2545' }}>Retake recovery guardrail</h2>
              <p className="mt-1 text-sm leading-6 text-[#1E2D3D]/70">
                ForgeNursing does not guarantee an NCLEX result. It helps you find missed-answer patterns and study with a clearer plan. If you reference outside tools, summarize questions in your own words instead of pasting full copyrighted questions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function RecoveryCard({
  icon,
  title,
  body,
  cta,
  loading,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  body: string
  cta: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-2xl border border-[#DDE5EE] bg-white p-5 text-left shadow-sm transition hover:border-[#0D8F9C] hover:shadow-md disabled:opacity-60"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E0F4F6] text-[#0D8F9C]">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold" style={{ color: '#0B2545' }}>{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#1E2D3D]/70">{body}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0D8F9C]">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </p>
        </div>
      </div>
    </button>
  )
}
