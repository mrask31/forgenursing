'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle2, UserPlus } from 'lucide-react'
import type { TrapResult } from '@/lib/answer-trap'

interface TrapResultsProps {
  result: TrapResult
  sessionId: string | null
  anonymousId: string | null
}

export default function TrapResults({ result, sessionId, anonymousId }: TrapResultsProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_result_viewed', {
        anonymous_session_id: anonymousId,
        detected_trap: result.detected_trap,
        detected_trap_display: result.detected_trap_display,
        score: result.score,
        total: result.total,
      })
      posthog.capture('answer_trap_signup_prompt_viewed', {
        anonymous_session_id: anonymousId,
        detected_trap: result.detected_trap,
        source: 'results_page',
      })
    } catch {}
  }, [anonymousId, result])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.share_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)

      try {
        const posthog = require('posthog-js').default
        posthog.capture('answer_trap_result_copied', {
          anonymous_session_id: anonymousId,
          detected_trap: result.detected_trap,
          detected_trap_display: result.detected_trap_display,
        })
      } catch {}
    } catch {
      // Clipboard API not available
    }
  }

  const handleSignupClick = () => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_signup_clicked', {
        anonymous_session_id: anonymousId,
        detected_trap: result.detected_trap,
        source: 'results_page',
      })
    } catch {}

    // Store session info for claiming after signup
    if (sessionId && anonymousId) {
      try {
        localStorage.setItem('answer_trap_session_id', sessionId)
        localStorage.setItem('answer_trap_anonymous_id', anonymousId)
      } catch {}
    }

    window.location.href = '/signup'
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <div className="max-w-lg w-full mx-auto space-y-6">
        {/* Brand */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>
            DownToTwo by ForgeNursing
          </p>
        </div>

        {/* Result header */}
        <div className="text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Your first Answer Trap signal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: '#0B2545' }}>
            {result.detected_trap_display}
          </h1>
          <p className="text-sm text-slate-500">
            {result.score}/{result.total} correct — the pattern that showed up first
          </p>
        </div>

        {/* Explanation card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
              What this means
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {result.trap_explanation}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
              Why the wrong answer felt right
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
              {result.trap_why_tempting}
            </p>
          </div>

          <div className="rounded-lg bg-[#F7F9FB] border border-[#DDE5EE] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
              What to practice next
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B2545' }}>
              {result.trap_what_to_practice}
            </p>
          </div>
        </div>

        {/* Copy result */}
        <button
          onClick={handleCopy}
          className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:border-[#0D8F9C]"
          style={{ color: '#0B2545', minHeight: '48px' }}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy My Result
            </>
          )}
        </button>

        {/* Signup CTA */}
        <div className="rounded-2xl p-5 sm:p-6 text-white space-y-4" style={{ backgroundColor: '#0B2545' }}>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-white/50">
              Keep training this pattern
            </p>
            <p className="text-base font-bold text-white">
              Save your Answer Trap Map and practice with focused drills.
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              Create a free account to save this result. Forge will help you train the {result.detected_trap_display} pattern until it stops costing you points.
            </p>
          </div>
          <button
            onClick={handleSignupClick}
            className="w-full rounded-xl bg-white py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold transition-all hover:bg-slate-100"
            style={{ color: '#0B2545', minHeight: '48px' }}
          >
            <UserPlus className="w-4 h-4" />
            Create Free Account
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-center text-slate-300 leading-relaxed max-w-sm mx-auto">
          This is a first signal from 3 questions — not a definitive assessment. More practice gives Forge a clearer picture of your patterns. Results do not predict NCLEX outcomes.
        </p>
      </div>
    </div>
  )
}
