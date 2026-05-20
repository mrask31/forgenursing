'use client'

import { useState, useEffect, useMemo } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight, Loader2, BookOpen, GraduationCap, Shield } from 'lucide-react'
import Link from 'next/link'
import { clearSupabaseStorage, isSessionError, debugAuthLog, resetSession } from '@/lib/auth-utils'
import { hasAccess } from '@/lib/subscription-access'
import { resolveEntryPath } from '@/lib/resolve-entry-path'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms)
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timer))
  })
}

async function clearAuthSession() {
  clearSupabaseStorage()

  try {
    await withTimeout(
      fetch('/api/auth/clear-session', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      }),
      3000,
      'CLEAR_SESSION_TIMEOUT'
    )
  } catch (error) {
    debugAuthLog('Server-side auth cookie clear failed or timed out', error)
  }

  clearSupabaseStorage()
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.')
    }

    return getBrowserClient()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const hasAuthError = params.get('error') === 'auth-code-error' || params.get('error') === 'session-error'

      if (hasAuthError) {
        clearAuthSession()
      }

      ;(window as any).resetSession = resetSession

      const metaCacheControl = document.createElement('meta')
      metaCacheControl.httpEquiv = 'Cache-Control'
      metaCacheControl.content = 'no-store, no-cache, must-revalidate, proxy-revalidate'
      document.head.appendChild(metaCacheControl)

      const metaPragma = document.createElement('meta')
      metaPragma.httpEquiv = 'Pragma'
      metaPragma.content = 'no-cache'
      document.head.appendChild(metaPragma)

      const metaExpires = document.createElement('meta')
      metaExpires.httpEquiv = 'Expires'
      metaExpires.content = '0'
      document.head.appendChild(metaExpires)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const verified = params.get('verified')
      const verifiedEmail = params.get('email')

      if (verified === 'true' && verifiedEmail) {
        setShowVerificationSuccess(true)
        setEmail(verifiedEmail)
        setMessage({
          text: 'Thanks for verifying your email! Please sign in to continue.',
          type: 'success',
        })
      }

      const hasAuthError = params.get('error') === 'auth-code-error' || params.get('error') === 'session-error'
      if (hasAuthError) {
        clearAuthSession()
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    setMessage(null)

    debugAuthLog('Sign-in started', { email: email.trim(), retryCount })

    try {
      // Do not call supabase.auth.getUser() before login.
      // A corrupted/stale auth cookie can cause that call to hang and leave the user stuck.
      // Instead, do a short best-effort cleanup, then sign in directly.
      if (retryCount === 0) {
        await clearAuthSession()
      }

      const signInResult: any = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        30000,
        'TIMEOUT'
      )
      const { data, error } = signInResult

      debugAuthLog('Sign-in response received', { hasData: !!data, hasError: !!error, userId: data?.user?.id })

      if (error) {
        debugAuthLog('Sign-in error', { error: error.message, code: error.code })

        if (isSessionError(error) && retryCount === 0) {
          debugAuthLog('Session error detected, clearing storage/cookies and retrying')
          await supabase.auth.signOut().catch(() => null)
          await clearAuthSession()
          await new Promise((resolve) => setTimeout(resolve, 250))
          return handleLogin(e, 1)
        }

        setMessage({
          text: error.message || 'Login failed. Please check your email and password.',
          type: 'error',
        })
        return
      }

      if (!data?.user) {
        setMessage({
          text: 'Login failed: No user data returned. Please try again.',
          type: 'error',
        })
        return
      }

      try {
        await withTimeout(
          fetch('/api/stripe/sync-subscription', { method: 'POST', credentials: 'include' }),
          5000,
          'SYNC_TIMEOUT'
        )
      } catch (_) {
        // Sync is best-effort; continue with profile check
      }

      const profileResult: any = await withTimeout(
        supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at, is_beta, beta_expires_at, quiz_first_enabled, default_entry_path')
          .eq('id', data.user.id)
          .single(),
        10000,
        'PROFILE_TIMEOUT'
      )
      const { data: profile, error: profileError } = profileResult

      if (profileError) {
        console.error('[Login] Error checking subscription status:', profileError)
        window.location.replace('/checkout')
        return
      }

      const userHasAccess = hasAccess(
        profile?.subscription_status,
        profile?.trial_ends_at,
        profile?.is_beta,
        profile?.beta_expires_at
      )

      if (userHasAccess) {
        window.location.replace(resolveEntryPath(profile))
        return
      }

      window.location.replace('/checkout')
    } catch (err) {
      debugAuthLog('Unexpected login error', { error: err })

      if (err instanceof Error && err.message === 'TIMEOUT') {
        setMessage({
          text: 'Login is taking longer than expected. Please check your connection and try again.',
          type: 'error',
        })
        return
      }

      if (err instanceof Error && err.message === 'PROFILE_TIMEOUT') {
        setMessage({
          text: 'Login worked, but your profile took too long to load. Please refresh and try again.',
          type: 'error',
        })
        return
      }

      if (isSessionError(err) && retryCount === 0) {
        await supabase.auth.signOut().catch(() => null)
        await clearAuthSession()
        await new Promise((resolve) => setTimeout(resolve, 250))
        return handleLogin(e, 1)
      }

      console.error('[Login] Unexpected login error:', err)
      setMessage({
        text: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        type: 'error',
      })
    } finally {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      if (currentPath === '/login') {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100dvh-4rem)] flex-col-reverse lg:flex-row">
        <div className="hidden lg:flex bg-gradient-to-br from-[#f0fafa] to-[#e8f4f4] border-r border-slate-200 flex flex-col justify-center items-center h-full px-8 text-center">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#0B2545] rounded-xl flex items-center justify-center mx-auto shadow-lg">
                <span className="text-2xl font-bold text-white">Fx</span>
              </div>
              <blockquote className="text-xl text-slate-700 italic leading-relaxed font-medium">
                "<span className="font-semibold text-[#0D8F9C]">Reasoning</span> is the difference between knowing the answer and saving a life."
              </blockquote>
            </div>

            <div className="space-y-4 pt-8 border-t border-[#0D8F9C]/20">
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[#0D8F9C]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Continue your studies</div>
                  <div className="text-xs text-slate-600">Pick up where you left off</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#0D8F9C]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Your learning library</div>
                  <div className="text-xs text-slate-600">All your saved explanations and clips</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#0D8F9C]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Access your dashboard</div>
                  <div className="text-xs text-slate-600">View your progress and study patterns</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-white order-1 lg:order-2">
          <div className="w-full max-w-md">
            <div className="bg-white border border-[#DDE5EE] rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0B2545] rounded-xl mb-4 shadow-lg">
                  <span className="text-xl font-bold text-white">Fx</span>
                </div>
                {showVerificationSuccess ? (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                      Email Verified! 🎉
                    </h1>
                    <p className="text-sm text-slate-600">
                      Thanks for verifying your email. Please sign in to continue.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-semibold font-display text-slate-900 mb-2">
                      Welcome back
                    </h1>
                    <p className="text-sm text-slate-600">
                      Sign in to continue your clinical reasoning journey
                    </p>
                  </>
                )}
              </div>

              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      data-testid="login-email"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      data-testid="login-password"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#0D8F9C] hover:text-[#0A7A85] transition-colors"
                  >
                    Forgot password?
                  </Link>
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
                  data-testid="login-submit"
                  disabled={loading || !email || !password}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-[#0D8F9C] text-white rounded-xl text-base font-medium hover:bg-[#0A7A85] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 text-center">
                <span className="text-sm text-slate-600">
                  Don't have an account?{' '}
                </span>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-[#0D8F9C] hover:text-[#0A7A85] transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
