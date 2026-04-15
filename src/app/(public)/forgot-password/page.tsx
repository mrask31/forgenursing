'use client'

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const supabase = getBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
      return
    }

    setSubmitted(true)
    setMessage({
      text: `Check your email. We sent a reset link to ${email}.`,
      type: 'success',
    })
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#DDE5EE] rounded-2xl p-6 sm:p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0B2545] rounded-xl mb-4 shadow-lg">
              <span className="text-xl font-bold text-white">Fx</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-slate-600">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="Enter your email"
                data-testid="forgot-email"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className={`p-4 text-sm rounded-xl ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              data-testid="forgot-submit"
              disabled={loading || !email || submitted}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-[#0D8F9C] text-white rounded-xl text-base font-medium hover:bg-[#0A7A85] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#0D8F9C] hover:text-[#0A7A85] transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
