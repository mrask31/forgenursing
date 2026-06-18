'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Brain, CheckCircle2, Compass, Loader2, Target, TrendingUp } from 'lucide-react'

type MistakeTypeRow = {
  mistake_type: string
  attempted: number
  correct: number
  missed: number
  accuracy: number
  last_practiced_at: string | null
  trend: 'building' | 'improving' | 'steady'
}

type JudgmentMapData = {
  summary: {
    total_attempted: number
    total_correct: number
    overall_accuracy: number
    enough_data: boolean
  }
  confidence_builder: {
    stage: string
    message: string
    positive_signals: string[]
  }
  mistake_types: MistakeTypeRow[]
  top_weakness: (MistakeTypeRow & { explanation: string }) | null
  strongest_area: (MistakeTypeRow & { explanation: string }) | null
  recommendation: {
    type: 'baseline' | 'next_focus'
    title: string
    message: string
    mistake_type: string | null
    explanation: string
  }
  recommended_mistake_type: string | null
}

function trendLabel(trend: MistakeTypeRow['trend']) {
  if (trend === 'improving') return 'Improving'
  if (trend === 'steady') return 'Steady'
  return 'Building'
}

function formatDate(value: string | null) {
  if (!value) return 'Not practiced yet'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function practiceProgress(attempted: number) {
  return Math.min(100, Math.max(8, attempted * 18))
}

export default function ClinicalJudgmentMapPage() {
  const router = useRouter()
  const [data, setData] = useState<JudgmentMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('readiness_map_opened')
    } catch {}

    const handleBeforeUnload = () => {
      try {
        const posthog = require('posthog-js').default
        posthog.capture('readiness_map_abandoned', {
          had_data: !!data,
          time_on_page_ms: Date.now() - pageLoadTime,
        })
      } catch {}
    }

    const pageLoadTime = Date.now()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    const loadMap = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/judgment-map', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to load your Readiness Map')
        }

        const map = await response.json()
        setData(map)
      } catch (err: any) {
        console.error('[JudgmentMap] load error:', err)
        setError(err.message || 'Failed to load your Readiness Map')
      } finally {
        setLoading(false)
      }
    }

    loadMap()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#0D8F9C' }} />
          <p className="text-sm text-slate-500">Building your Clinical Judgment Map...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-slate-700 mb-4">{error || 'Unable to load your map.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: '#0D8F9C' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const hasAnyData = data.summary.total_attempted > 0
  const topRows = data.mistake_types.slice(0, 6)
  const mapProgress = Math.min(100, Math.max(10, data.summary.total_attempted * 8))

  return (
    <div className="min-h-screen bg-[#F7F9FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E0F4F6] border border-[#0D8F9C]/20">
            <Brain className="w-4 h-4" style={{ color: '#0D8F9C' }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#0B2545' }}>
              Your Readiness Map
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: '#0B2545' }}>
            Know what to improve before exam day.
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Forge tracks your weak patterns so you can practice with purpose — not just do more random questions.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Confidence Builder</p>
                <h2 className="text-2xl font-bold" style={{ color: '#0B2545' }}>{data.confidence_builder.stage}</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#E0F4F6] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" style={{ color: '#0D8F9C' }} />
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {data.confidence_builder.message}
            </p>
            <div className="space-y-2">
              {data.confidence_builder.positive_signals.map((signal) => (
                <div key={signal} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#0D8F9C' }} />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Map Progress</p>
            <div className="text-4xl font-bold mb-1" style={{ color: '#0B2545' }}>{data.summary.total_attempted}</div>
            <p className="text-sm text-slate-500 mb-4">
              questions helping Forge learn your patterns
            </p>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{ width: `${mapProgress}%`, backgroundColor: '#0D8F9C' }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              More answers make your recommendations sharper.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-[#0B2545] p-5 sm:p-6 text-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/50 mb-2">Suggested focus</p>
              <h2 className="text-2xl font-bold mb-2 text-white">{data.recommendation.title}</h2>
              <p className="text-sm text-white/75 leading-relaxed max-w-2xl">
                {data.recommendation.message}
              </p>
              <p className="text-xs text-white/50 mt-3 max-w-2xl">
                {data.recommendation.explanation}
              </p>
            </div>
            <button
              onClick={() => router.push('/quiz')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0B2545] text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              {data.summary.enough_data ? 'Practice This Focus' : 'Start Building Confidence'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {!hasAnyData && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F4F6] flex items-center justify-center mx-auto mb-4">
              <Compass className="w-7 h-7" style={{ color: '#0D8F9C' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#0B2545' }}>Your map starts with your first answers.</h2>
            <p className="text-sm text-slate-600 mb-5 max-w-md mx-auto">
              Take a few practice questions. Forge will begin identifying the thinking patterns to train next.
            </p>
            <button
              onClick={() => router.push('/quiz')}
              className="px-5 py-3 rounded-xl text-white font-semibold"
              style={{ backgroundColor: '#0D8F9C' }}
            >
              Start Practice
            </button>
          </section>
        )}

        {hasAnyData && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PatternCard
              label="Area to strengthen"
              icon={<Target className="w-5 h-5 text-white" />}
              title={data.top_weakness?.mistake_type || 'Keep practicing'}
              stat={data.top_weakness ? trendLabel(data.top_weakness.trend) : 'Building'}
              body={data.top_weakness?.explanation || 'Forge will identify your next area to strengthen as you answer more questions.'}
            />
            <PatternCard
              label="Strong area"
              icon={<BarChart3 className="w-5 h-5 text-white" />}
              title={data.strongest_area?.mistake_type || 'Building'}
              stat={data.strongest_area ? trendLabel(data.strongest_area.trend) : 'Building'}
              body={data.strongest_area?.explanation || 'Your strong areas will appear after a few more questions.'}
            />
          </section>
        )}

        {topRows.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold" style={{ color: '#0B2545' }}>Areas To Strengthen</h2>
              <p className="text-sm text-slate-500 mt-1">
                These are the clinical judgment patterns Forge suggests you focus on next.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {topRows.map((item) => (
                <div key={item.mistake_type} className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold" style={{ color: '#0B2545' }}>{item.mistake_type}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Last practiced {formatDate(item.last_practiced_at)} · {trendLabel(item.trend)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: '#0D8F9C' }}>{trendLabel(item.trend)}</div>
                      <div className="text-xs text-slate-400">{item.attempted} practiced</div>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${practiceProgress(item.attempted)}%`, backgroundColor: '#0D8F9C' }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.missed > 0 ? `${item.missed} answer${item.missed === 1 ? '' : 's'} showed this as a pattern to train.` : 'This pattern is looking strong so far.'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PatternCard({ label, icon, title, stat, body }: { label: string; icon: React.ReactNode; title: string; stat: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
          <h2 className="text-xl font-bold" style={{ color: '#0B2545' }}>{title}</h2>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0D8F9C' }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-2" style={{ color: '#0D8F9C' }}>{stat}</div>
      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  )
}
