'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Brain, ClipboardList, Compass, Target } from 'lucide-react'

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

type TrainingMode = 'recommended' | 'documents' | 'topic' | 'general'

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
  hasDocuments, sourceType, setSourceType, category, setCategory,
  onStart, loading, resumeSession, onResume,
}: QuizSetupProps) {
  const [mode, setMode] = useState<TrainingMode>('recommended')
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
    }
    if (nextMode === 'general' || nextMode === 'recommended') {
      setSourceType('generic')
      setCategory('All Categories')
    }
    if (nextMode === 'topic') {
      setSourceType('generic')
    }
  }

  const enoughMapData = Boolean(judgmentMap?.summary?.enough_data)
  const nextFocus = judgmentMap?.recommendation?.mistake_type ?? null
  const recommendationTitle = enoughMapData && nextFocus
    ? `Practice ${nextFocus}`
    : 'Build your first pattern map'
  const recommendationMessage = enoughMapData && judgmentMap?.recommendation?.message
    ? judgmentMap.recommendation.message
    : 'Answer a few questions so Forge can learn your missed-answer patterns and recommend what to train next.'

  const handleStart = () => {
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

    onStart({
      quizMode: 'standard',
      totalQuestions: 10,
    })
  }

  const questionCountLabel = mode === 'recommended' && enoughMapData && nextFocus
    ? '3-question focused drill · ~3 minutes'
    : mode === 'documents'
      ? '10 questions from your materials'
      : '10 questions · ~8 minutes'

  return (
    <div className="w-full max-w-md mx-auto space-y-5 px-4 py-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E0F4F6] border border-[#0D8F9C]/20">
          <Brain className="w-4 h-4" style={{ color: '#0D8F9C' }} />
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#0B2545' }}>
            Practice Questions
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#0B2545' }}>What do you want to fix today?</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Forge learns from your missed answers and helps you train the clinical judgment patterns that cost you points.
        </p>
      </div>

      {resumeSession && onResume && (
        <div className="rounded-xl p-4 border border-[#0D8F9C]/20 bg-[#E0F4F6] space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#0B2545' }}>
            Resume your quiz: {resumeSession.current_question_index}/{resumeSession.total_questions} complete
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
              onClick={handleStart}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold border"
              style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <TrainingCard
          selected={mode === 'recommended'}
          icon={<Target className="w-5 h-5" />}
          eyebrow="Recommended"
          title={recommendationTitle}
          body={recommendationMessage}
          footer={enoughMapData && nextFocus ? 'Starts a 3-question focused drill from your Judgment Map.' : 'Forge needs a few answers to personalize this.'}
          onClick={() => selectMode('recommended')}
        />

        <TrainingCard
          selected={mode === 'documents'}
          disabled={!hasDocuments}
          icon={<BookOpen className="w-5 h-5" />}
          eyebrow="Class exam prep"
          title="Practice From My Notes"
          body="Use your uploaded slides, study guides, or class material to generate NCLEX-style questions."
          footer={hasDocuments ? 'Best when studying for a specific class exam.' : 'Upload notes first to unlock this mode.'}
          onClick={() => selectMode('documents')}
        />

        <TrainingCard
          selected={mode === 'topic'}
          icon={<Compass className="w-5 h-5" />}
          eyebrow="Focused drill"
          title="Choose a Topic"
          body="Pick Pharm, Safety, Delegation, Psychosocial Integrity, or another NCLEX area."
          footer="Good when you already know what you want to practice."
          onClick={() => selectMode('topic')}
        />

        <TrainingCard
          selected={mode === 'general'}
          icon={<ClipboardList className="w-5 h-5" />}
          eyebrow="Balanced practice"
          title="General NCLEX Practice"
          body="Start a balanced quiz across common NCLEX-style categories."
          footer="Good when you just need reps."
          onClick={() => selectMode('general')}
        />
      </div>

      {mode === 'topic' && (
        <div className="space-y-2 rounded-xl bg-white border border-gray-200 p-4">
          <p className="text-sm font-semibold" style={{ color: '#0B2545' }}>Choose your focus area</p>
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
          <p className="font-medium" style={{ color: '#0B2545' }}>Upload your course materials for personalized questions.</p>
          <Link href="/binder" className="underline text-sm font-medium" style={{ color: '#0D8F9C' }}>
            Upload in Binder →
          </Link>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm text-gray-400">{questionCountLabel}</p>
        <p className="text-[11px] leading-snug text-gray-400">
          AI-generated NCLEX-style practice questions for educational study and clinical reasoning. Results do not guarantee exam performance.
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={loading || (mode === 'documents' && !hasDocuments)}
        className="w-full rounded-lg text-white font-semibold text-base transition-all disabled:opacity-50"
        style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
      >
        {loading ? 'Starting...' : mode === 'recommended' && enoughMapData && nextFocus ? 'Start 3-Question Drill' : mode === 'recommended' ? 'Start Recommended Practice' : mode === 'documents' ? 'Practice From Notes' : mode === 'topic' ? 'Start Focused Drill' : 'Start General Quiz'}
      </button>

      <Link href="/readiness" className="block text-center text-sm font-semibold" style={{ color: '#0D8F9C' }}>
        View my Judgment Map →
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
