'use client'

import { useState, useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { isDisposableEmailDomain } from '@/lib/disposable-email-domains'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, BookOpen, GraduationCap, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null)
  const [betaAvailable, setBetaAvailable] = useState<boolean | null>(null)
  const router = useRouter()

  // Track if GA4 sign_up event has been fired to prevent duplicate events
  const signUpEventFiredRef = useRef(false)

  // Anti-bot measures
  const [honeypot, setHoneypot] = useState('') // Honeypot field (hidden from users)
  const [startTime] = useState(Date.now()) // Track how long user takes to fill form
  const formInteractedRef = useRef(false) // Track if user actually interacted with form

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = getBrowserClient()

  // Check if user is already signed in when page loads
  useEffect(() => {
    const checkExistingAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is already signed in, redirect to tutor
        router.push('/tutor')
      }
    }
    
    checkExistingAuth()
  }, [router, supabase])

  // Fetch beta availability
  useEffect(() => {
    fetch('/api/beta-spots')
      .then((r) => r.json())
      .then(({ isFull }) => setBetaAvailable(!isFull))
      .catch(() => setBetaAvailable(false))
  }, [])

  // Store plan parameter from URL in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const plan = params.get('plan')
      if (plan && (plan === 'monthly' || plan === 'semester' || plan === 'annual')) {
        localStorage.setItem('forgenursing-pending-plan', plan)
      }
    }
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()


    setLoading(true)
    setMessage(null)

    // Anti-bot checks
    // 1. Honeypot check - if filled, it's a bot
    if (honeypot) {
      setLoading(false)
      // Don't show error to bot, just silently fail
      setTimeout(() => {
        setMessage({ text: 'An error occurred. Please try again.', type: 'error' })
      }, 2000)
      return
    }

    // 2. Time check - if submitted too fast (< 3 seconds), likely bot
    const timeSpent = Date.now() - startTime
    if (timeSpent < 3000) {
      setLoading(false)
      setTimeout(() => {
        setMessage({ text: 'Please take your time filling out the form.', type: 'error' })
      }, 2000)
      return
    }

    // 3. Interaction check - if no interaction detected, likely bot
    if (!formInteractedRef.current) {
      setLoading(false)
      setTimeout(() => {
        setMessage({ text: 'Please fill out the form manually.', type: 'error' })
      }, 2000)
      return
    }

    // 4. Password strength check
    if (password.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters long.', type: 'error' })
      setLoading(false)
      return
    }

    // 6. Disposable email check
    if (isDisposableEmailDomain(email)) {
      setMessage({ text: 'Please use a permanent email address to sign up.', type: 'error' })
      setLoading(false)
      return
    }

    // Get plan from localStorage or URL
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan') || localStorage.getItem('forgenursing-pending-plan')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      setMessage({ text: 'Signup is temporarily unavailable. Please try again shortly.', type: 'error' })
      setLoading(false)
      return
    }

    try {
      const timeoutMs = 15000 // Increased from 8000 to 15000 (15 seconds)
      const withTimeout = <T,>(promise: Promise<T>) =>
        Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('SIGNUP_TIMEOUT')), timeoutMs)),
        ])

      // Health check
      try {
        const healthRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: { apikey: supabaseAnonKey },
        })
        if (!healthRes.ok) {
          throw new Error(`Health check failed (${healthRes.status})`)
        }
      } catch (healthError) {
        console.error('[Signup] Health check failed:', healthError)
        setMessage({
          text: 'Auth service unreachable. Please disable tracking prevention for this site or try another browser.',
          type: 'error',
        })
        setLoading(false)
        return
      }

      
      // Add a manual timeout promise (30 seconds)
      const signupPromise = supabase.auth.signUp({
        email,
        password,
      })
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Signup is taking too long. Please try again or contact support.')), 30000)
      })
      
      const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.signUp>>


      if (error) {
        console.error('[Signup] SignUp error:', error)
        
        // Check if the error is due to email already being registered
        const errorMessage = error.message?.toLowerCase() || ''
        const isEmailExists = 
          errorMessage.includes('user already registered') ||
          errorMessage.includes('email already registered') ||
          errorMessage.includes('already been registered') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('user with this email address has already been registered') ||
          error.code === 'signup_disabled' ||
          error.status === 422 ||
          (error.status === 400 && errorMessage.includes('already'))
        
        if (isEmailExists) {
          setMessage({ 
            text: `This email address is already registered. Please sign in instead.`, 
            type: 'error' 
          })
          setLoading(false)
          return
        }
        
        // For other errors, show the error message
        setMessage({ text: error.message || 'An error occurred. Please try again.', type: 'error' })
        setLoading(false)
        return
      }
      
      // Check if user was actually created
      if (!data.user) {
        console.error('[Signup] No user returned from signUp')
        setMessage({ 
          text: `This email address is already registered. Please sign in instead.`, 
          type: 'error' 
        })
        setLoading(false)
        return
      }
      
      // Fire GA4 sign_up conversion event (only once per signup)
      if (!signUpEventFiredRef.current && typeof window !== 'undefined') {
        const dataLayer = (window as any).dataLayer
        if (dataLayer && Array.isArray(dataLayer)) {
          dataLayer.push({
            event: 'sign_up',
            method: 'email'
          })
          signUpEventFiredRef.current = true
        }
      }
      
      // Set trial period (or beta access) and trigger welcome email (non-blocking)
      try {
        const trialRes = await fetch('/api/auth/set-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        })
        const trialData = await trialRes.json()
        if (trialData.isBeta && trialData.betaExpiresAt) {
          // Store beta welcome for display in the app
          localStorage.setItem('forgenursing-beta-welcome', trialData.betaExpiresAt)
        }
      } catch (trialError) {
        // Don't block signup if trial setting fails
        console.error('[Signup] Failed to set trial:', trialError)
      }
      
      // Check for session (with email verification disabled, should have immediate session)
      setLoading(false)
      
      // Try router.push first, fallback to window.location if it fails
      try {
        router.push('/entry')
        // If router.push doesn't redirect within 1 second, use window.location
        setTimeout(() => {
          if (window.location.pathname === '/signup') {
            window.location.href = '/entry'
          }
        }, 1000)
      } catch (error) {
        console.error('[Signup] Router.push error:', error)
        window.location.href = '/entry'
      }
      return

    } catch (error: any) {
      console.error('[Signup] Unexpected error:', error)
      
      if (error?.message === 'SIGNUP_TIMEOUT') {
        setMessage({ 
          text: 'Signup is taking longer than expected. Please check your connection and try again.', 
          type: 'error' 
        })
      } else {
        const errorMessage = error?.message || 'An error occurred. Please try again.'
        setMessage({ text: errorMessage, type: 'error' })
      }
      
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100dvh-4rem)] flex-col-reverse lg:flex-row">
        {/* Left Column - Desktop Only */}
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

            {/* Quick Benefits */}
            <div className="space-y-4 pt-8 border-t border-[#0D8F9C]/20">
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[#0D8F9C]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Learn from your materials</div>
                  <div className="text-xs text-slate-600">Upload your notes and textbooks</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#0D8F9C]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Build clinical reasoning</div>
                  <div className="text-xs text-slate-600">Step-by-step NCLEX-style preparation</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-[#E0F4F6] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#0D8F9C]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Free preview</div>
                  <div className="text-xs text-slate-600">7-day free trial included</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Auth Form */}
        <div className="flex items-start justify-center px-4 sm:px-6 py-6 bg-white order-1 lg:order-2 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* What Happens Next - At Top, Always Visible */}
            <div className="mb-4 p-3 bg-[#E0F4F6] rounded-xl border border-[#0D8F9C]/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#0D8F9C] flex-shrink-0" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  What happens next?
                </h3>
              </div>
              {betaAvailable ? (
                /* Beta available messaging */
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <p><strong className="text-slate-900">Create your account</strong> — Free, no credit card needed</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <p><strong className="text-slate-900">You're a beta tester</strong> — Full access for 90 days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <p><strong className="text-slate-900">Ask Forge anything</strong> — Start learning now</p>
                  </div>
                </div>
              ) : (
                /* Beta full — standard trial messaging */
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <p><strong className="text-slate-900">Start your trial</strong> — Full access for 7 days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <p><strong className="text-slate-900">Upload your study guide</strong> — Forge builds NCLEX practice from your exact material</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#0D8F9C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <p><strong className="text-slate-900">Subscribe when ready</strong> — After your trial ends</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-[#0D8F9C] font-medium mt-2 pt-2 border-t border-[#0D8F9C]/20 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {betaAvailable ? 'No credit card required · Free for 90 days' : 'No credit card required • Cancel anytime'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
              {/* Header - Compact */}
              <div className="text-center mb-4">
                <h1 className="text-lg font-semibold text-slate-900 mb-1">
                  Create your account
                </h1>
                <p className="text-xs text-slate-600">
                  Join nursing students building clinical reasoning skills
                </p>
              </div>

              {/* Form - Compact */}
              <form onSubmit={handleSignup} className="space-y-3">
                {/* Honeypot field - hidden from real users, visible to bots */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Email address"
                      data-testid="signup-email"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        formInteractedRef.current = true
                      }}
                      onFocus={() => formInteractedRef.current = true}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Password (8+ characters)"
                      data-testid="signup-password"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D8F9C] focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        formInteractedRef.current = true
                      }}
                      onFocus={() => formInteractedRef.current = true}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {message && (
                  <div className={`p-3 text-xs rounded-lg ${
                    message.type === 'error' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : message.type === 'info'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    <div className="flex flex-col gap-1">
                      <span>{message.text}</span>
                      {message.type === 'error' && message.text.includes('already registered') && (
                        <Link
                          href="/login"
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 underline"
                        >
                          Go to Sign In
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0D8F9C] border-slate-300 rounded focus:ring-2 focus:ring-[#0D8F9C] cursor-pointer flex-shrink-0"
                    required
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-[#0D8F9C] hover:text-[#0A7A85] underline font-medium">
                      Terms
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="text-[#0D8F9C] hover:text-[#0A7A85] underline font-medium">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  data-testid="signup-submit"
                  disabled={loading || !email || !password || !acceptedTerms}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-[#0D8F9C] text-white rounded-lg text-sm font-semibold hover:bg-[#0A7A85] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 text-center">
                  No credit card required • Cancel anytime • 2-minute setup
                </p>
              </form>

              {/* Toggle */}
              <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                <span className="text-xs text-slate-600">
                  Already have an account?{' '}
                </span>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#0D8F9C] hover:text-[#0A7A85] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
