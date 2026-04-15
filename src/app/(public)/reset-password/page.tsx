'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = getBrowserClient()

  useEffect(() => {
    const exchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.search)
      if (error) {
        setMessage({ text: error.message, type: 'error' })
      }
      setExchanging(false)
    }
    exchange()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters.', type: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setLoading(false)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
      return
    }

    setSuccess(true)
    setMessage({ text: 'Password updated. You can now log in.', type: 'success' })
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
              Set new password
            </h1>
            <p className="text-sm text-slate-600">
              Choose a new password for your account.
            </p>
          </div>

          {/* Form */}
          {!exchanging && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 text-sm rounded-xl ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message.text}
                  {success && (
                    <div className="mt-2">
                      <Link
                        href="/login"
                        className="font-semibold underline hover:text-green-800"
                      >
                        Go to sign in
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {!success && (
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-[#0D8F9C] text-white rounded-xl text-base font-medium hover:bg-[#0A7A85] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update password
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
            </form>
          )}

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
