'use client'

import { Loader2 } from 'lucide-react'

interface TrapLandingProps {
  onStart: () => void
  loading: boolean
}

export default function TrapLanding({ onStart, loading }: TrapLandingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Brand */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>
            ForgeNursing
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            A starting point for your NCLEX-RN retake
          </p>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ color: '#0B2545' }}>
            Start with three questions.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
            Take a small step toward your next attempt.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Try three NCLEX-style questions, review your choices, and get a suggested starting focus. This short check cannot diagnose why you missed an answer.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#0D8F9C', minHeight: '56px' }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            'Start free practice'
          )}
        </button>

        {/* Trust signals */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400">
          <span>3 questions</span>
          <span className="hidden sm:inline">·</span>
          <span>No account required</span>
          <span className="hidden sm:inline">·</span>
          <span>Free</span>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
          This is a study tool for practice only. Results do not predict NCLEX outcomes or exam readiness.
        </p>
      </div>
    </div>
  )
}
