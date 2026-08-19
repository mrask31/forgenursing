'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, ClipboardCheck, Compass, FileSearch, Target } from 'lucide-react'

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

type TrainingMode = 'diagnostic' | 'recommended' | 'topic' | 'documents'

type JudgmentMapSummary = {
  summary?: {
    total_attempted: number
    enough_data: boolean
  }
  recommendation?: {
    title: string
    message: string
    mistake_type: string | null
    explanation?: string | null
  }
}

export default function QuizSetup({
  hasDocuments, setSourceType, category, setCategory,
  onStart, loading, resumeSession, onResume,
}: QuizSetupProps) {
  const [mode, setMode] = useState<TrainingMode>('diagnostic')
  const [judgmentMap, setJudgmentMap] = useState<JudgmentMapSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadMap = async () => {
      try {
        const res = await fetch('/api/judgment-map', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setJudgmentMap(data)
      } catch {}
    }
    loadMap()
    return () => {
      cancelled = true
    }
  }, [])

  const selectMode = (nextMode: TrainingMode) => {
    setMode(nextMode)
    if (nextMode === 'documents') {
      setSourceType('document')
      setCategory('All Categories')
      return
    }
    setSourceType('generic')
    if (nextMode !== 'topic') setCategory('All Categories')
  }

  const enoughMapData = Boolean(judgmentMap?.summary?.enough_data)
  const nextFocus = judgmentMap?.recommendation?.mistake_type ?? null
  const recommendationMessage = enoughMapData && judgmentMap?.recommendation?.message
    ? judgmentMap.recommendation.message
    : 'Take a baseline diagnostic first. Forge needs a few answers before it can tell which miss pattern needs the most attention.'

  const startFromMode = () => {
    if (mode === 'documents' && !hasDocuments) return

    if (mode === 'recommended' && enoughMapData && nextFocus) {
      onStart({
        quizMode: 'targeted_drill',
        targetMistakeType: nextFocus,
        targetFocus: judgmentMap?.recommendation?.explanation ?? recommendationMessage,
        totalQuestions: 3,
      })
      return
    }

    if (mode === 'diagnostic') {
      onStart({ quizMode: 'standard', totalQuestions: 5 })
      return
    }

    if (mode === 'topic') {
      onStart({ quizMode: 'standard', totalQuestions: 10 })
      return
    }

    onStart({ quizMode: 'standard', totalQuestions: 10 })
  }

  const questionCountLabel =
    mode === 'recommended' && enoughMapData && nextFocus
      ? '3-question pattern drill · ~3 minutes'
      : mode === 'diagnostic'
        ? '5-question retake diagnostic · ~5 minutes'
        : mode === 'documents'
          ? '10 questions from your uploaded material'
          : '10-question focused topic set · ~8 minutes'

  const buttonLabel = loading
    ? 'Starting...'
    : mode === 'recommended' && enoughMapData && nextFocus
      ? `Train ${nextFocus}`
      : mode === 'recommended'
        ? 'Start Baseline Diagnostic'
        : mode === 'diagnostic'
          ? 'Start 5-Question Retake Diagnostic'
          : mode === 'documents'
            ? 'Practice From My Materials'
            : 'Start Focused Topic Set'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 px-4 py-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E0F4F6] border border-[#0D8F9C]/20">
          <ClipboardCheck className="w-4 h-4" style={{ color: '#0D8F9C' }} />
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#0B2545' }}>
            Retake Diagnostic Sets
          </span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: '#0B2545' }}>Find the pattern behind the miss.</h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
          These sets are built for NCLEX retakers. The goal is not just a score — it is finding whether your misses come from priority, SATA, delegation, safety, second-guessing, or content gaps.
        </p>
      </div>

      {resumeSession && onResume && (
        <div className="rounded-xl p-4 border border-[#0D8F9C]/20 bg-[#E0F4F6] space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#0B2545' }}>
            Resume your recovery set: {resumeSession.current_question_index}/{resumeSession.total_questions} complete
          </p>
          <div className="flex gap-2">
            <button
              onClick={onResume}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}
            >
              Resume
            </button>
            <button
              onClick={startFromMode}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold border"
              style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <TrainingCard
          selected={mode === 'diagnostic'}
          icon={<Compass className="w-5 h-5" />}
          eyebrow="Start here"
          title="5-Question Retake Diagnostic"
          body="A short diagnostic set to start your Mistake Pattern Map and expose what to fix first."
          footer="Best first step after a failed attempt or when scores feel stuck."
          onClick={() => selectMode('diagnostic')}
        />

        <TrainingCard
          selected={mode === 'recommended'}
          icon={<Target className="w-5 h-5" />}
          eyebrow="Based on your map"
          title={enoughMapData && nextFocus ? `Train ${nextFocus}` : 'Build your first pattern map'}
          body={recommendationMessage}
          footer={enoughMapData && nextFocus ? 'Starts a focused drill on your current miss pattern.' : 'Forge needs enough answers before this becomes personalized.'}
          onClick={() => selectMode('recommended')}
        />

        <TrainingCard
          selected={mode === 'topic'}
          icon={<FileSearch className="w-5 h-5" />}
          eyebrow="Focused review"
          title="Choose a NCLEX Area"
          body="Pick safety, management of care, pharmacology, psychosocial, risk reduction, or another category."
          footer="Useful when your score report named a broad weak area."
          onClick={() => selectMode('topic')}
        />

        <TrainingCard
          selected={mode === 'documents'}
          disabled={!hasDocuments}
          icon={<BookOpen className="w-5 h-5" />}
          eyebrow="Optional support"
          title="Use My Course Materials"
          body="Generate NCLEX-style practice from uploaded slides, notes, or study guides."
          footer={hasDocuments ? 'Helpful for class remediation or content gaps.' : 'Upload notes first to unlock this mode.'}
          onClick={() => selectMode('documents')}
        />
      </div>

      {mode === 'topic' && (
        <div className="space-y-2 rounded-xl bg-white border border-gray-200 p-4">
          <p className="text-sm font-semibold" style={{ color: '#0B2545' }}>Choose your score-report area</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            style={{ minHeight: '44px' }}
          >
            {NCLEX_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {!hasDocuments && mode === 'documents' && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#E0F4F6' }}>
          <p className="font-medium" style={{ color: '#0B2545' }}>Upload materials only if you want class-specific practice.</p>
          <Link href="/binder" className="underline text-sm font-medium" style={{ color: '#0D8F9C' }}>
            Upload in Course Materials →
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-[#DDE5EE] bg-white p-4">
        <p className="text-sm font-bold" style={{ color: '#0B2545' }}>{questionCountLabel}</p>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">
          AI-generated NCLEX-style practice for educational study only. This does not predict or guarantee exam performance.
        </p>
      </div>

      <button
        onClick={startFromMode}
        disabled={loading || (mode === 'documents' && !hasDocuments)}
        className="w-full rounded-lg text-white font-semibold text-base transition-all disabled:opacity-50"
        style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
      >
        {buttonLabel}
      </button>

      <Link href="/readiness" className="block text-center text-sm font-semibold" style={{ color: '#0D8F9C' }}>
        View my Mistake Pattern Map →
      </Link>
    </div>
  )
}

function TrainingCard({
  selected,
  disabled = false,
  icon,
  eyebrow,
  title,
  body,
  footer,
  onClick,
}: {
  selected: boolean
  disabled?: boolean
  icon: React.ReactNode
  eyebrow: string
  title: string
  body: string
  footer: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border p-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        selected ? 'border-[#0D8F9C] bg-[#E0F4F6]' : 'border-gray-200 bg-white hover:border-[#0D8F9C]/50'
      }`}
    >
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: selected ? '#0D8F9C' : '#F1F5F9', color: selected ? 'white' : '#0B2545' }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: selected ? '#0D8F9C' : '#94A3B8' }}>
            {eyebrow}
          </p>
          <h3 className="text-sm font-bold mb-1" style={{ color: '#0B2545' }}>{title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">{body}</p>
          <p className="text-[11px] text-gray-400 leading-snug">{footer}</p>
        </div>
        {selected && <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#0D8F9C' }} />}
      </div>
    </button>
  )
}
