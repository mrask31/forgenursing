'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle2, Trophy, UserPlus } from 'lucide-react'
import type { TrapResult } from '@/lib/answer-trap'

interface TrapAllCorrectProps {
  result: TrapResult
  anonymousId: string | null
}

export default function TrapAllCorrect({ result, anonymousId }: TrapAllCorrectProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_result_viewed', {
        anonymous_session_id: anonymousId,
        detected_trap: null,
        detected_trap_display: null,
        score: result.score,
        total: result.total,
        all_correct: true,
      })
      posthog.capture('answer_trap_signup_prompt_viewed', {
        anonymous_session_id: anonymousId,
        detected_trap: null,
        source: 'results_page_all_correct',
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
          detected_trap: null,
          detected_trap_display: null,
        })
      } catch {}
    } catch {}
  }

  const handleSignupClick = () => {
    try {
      const posthog = require('posthog-js').default
      posthog.capture('answer_trap_signup_clicked', {
        anonymous_session_id: anonymousId,
        detected_trap: null,
        source: 'results_page_all_correct',
      })
    } catch {}

    window.location.href = '/signup'
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      <div className="max-w-lg w-full mx-auto space-y-6">
        {/* Brand */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0D8F9C' }}>
            Down To Two by ForgeNursing
          </p>
        </div>

        {/* Result header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E0F4F6] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" style={{ color: '#0D8F9C' }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#0B2545' }}>
            No obvious trap from this short check.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            You got {result.score}/{result.total} correct. These 3 questions didn't reveal a clear Answer Trap pattern — which is a good sign.
          </p>
        </div>

        {/* What's next card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            What this means
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#0B2545' }}>
            Three questions is a short sample. Your Answer Traps may show up with harder questions or different NCLEX categories. Most students discover their pattern after 10-15 questions.
          </p>
          <div className="rounded-lg bg-[#F7F9FB] border border-[#DDE5EE] p-4">
            <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B2545' }}>
              A longer practice session with Forge can find patterns that a 3-question check might miss.
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
              Go deeper
            </p>
            <p className="text-base font-bold text-white">
              Find your Answer Traps with a full practice session.
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              Create a free account to take longer quizzes, get your full Answer Trap Map, and practice with focused drills.
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
        <p className="text-[10px] text-center text-slate-500 leading-relaxed max-w-sm mx-auto">
          This is a short check for study purposes only. Results do not predict NCLEX outcomes or exam readiness.
        </p>
      </div>
    </div>
  )
}
