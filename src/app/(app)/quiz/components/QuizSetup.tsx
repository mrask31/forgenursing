'use client'

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

interface QuizSetupProps {
  hasDocuments: boolean
  sourceType: 'document' | 'generic'
  setSourceType: (t: 'document' | 'generic') => void
  category: string
  setCategory: (c: string) => void
  onStart: () => void
  loading: boolean
  resumeSession?: { id: string; current_question_index: number; total_questions: number } | null
  onResume?: () => void
}

export default function QuizSetup({
  hasDocuments, sourceType, setSourceType, category, setCategory,
  onStart, loading, resumeSession, onResume,
}: QuizSetupProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-5 px-4 py-6">
      <h1 className="text-xl font-bold" style={{ color: '#0B2545' }}>Practice Questions</h1>

      {!hasDocuments && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#E0F4F6' }}>
          <p className="font-medium" style={{ color: '#0B2545' }}>⚠️ Upload your course materials for personalized questions.</p>
          <Link href="/binder" className="underline text-sm font-medium" style={{ color: '#0D8F9C' }}>
            Upload in Binder →
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: '#0B2545' }}>Question Source</p>
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: '44px' }}>
            <input
              type="radio"
              name="sourceType"
              checked={sourceType === 'document'}
              onChange={() => setSourceType('document')}
              disabled={!hasDocuments}
              className="w-4 h-4 accent-[#0D8F9C]"
            />
            <span className={`text-sm ${!hasDocuments ? 'text-gray-400' : ''}`}>My Materials</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer" style={{ minHeight: '44px' }}>
            <input
              type="radio"
              name="sourceType"
              checked={sourceType === 'generic'}
              onChange={() => setSourceType('generic')}
              className="w-4 h-4 accent-[#0D8F9C]"
            />
            <span className="text-sm">General NCLEX</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: '#0B2545' }}>Focus Area (optional)</p>
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

      <div className="space-y-1">
        <p className="text-sm text-gray-400">10 questions · ~8 minutes</p>
        <p className="text-[11px] leading-snug text-gray-400">
          AI-generated NCLEX-style practice questions for educational study and clinical reasoning. Results do not guarantee exam performance.
        </p>
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        className="w-full rounded-lg text-white font-semibold text-base transition-all disabled:opacity-50"
        style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
      >
        {loading ? 'Starting...' : 'Start Quiz'}
      </button>

      {resumeSession && onResume && (
        <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: '#E0F4F6' }}>
          <p className="text-sm" style={{ color: '#0B2545' }}>
            📊 Resume: {resumeSession.current_question_index}/{resumeSession.total_questions} complete
          </p>
          <div className="flex gap-2">
            <button
              onClick={onResume}
              className="px-3 py-1.5 rounded text-sm font-medium text-white"
              style={{ backgroundColor: '#0D8F9C', minHeight: '44px' }}
            >
              Resume
            </button>
            <button
              onClick={onStart}
              className="px-3 py-1.5 rounded text-sm font-medium border"
              style={{ borderColor: '#0B2545', color: '#0B2545', minHeight: '44px' }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
