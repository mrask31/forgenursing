'use client'

import { useState, useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, MessageSquare, BookOpen, GraduationCap, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null)
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
        // User is already signed in, redirect to checkout
        router.push('/checkout')
      }
    }
    
    checkExistingAuth()
  }, [router, supabase])

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

    console.log('[Signup] Starting signup process')

    setLoading(true)
    setMessage(null)

    // Anti-bot checks
    // 1. Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log('[Signup] Honeypot triggered - likely bot')
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
      console.log('[Signup] Form submitted too fast - likely bot')
      setLoading(false)
      setTimeout(() => {
        setMessage({ text: 'Please take your time filling out the form.', type: 'error' })
      }, 2000)
      return
    }

    // 3. Interaction check - if no interaction detected, likely bot
    if (!formInteractedRef.current) {
      console.log('[Signup] No form interaction detected - likely bot')
      setLoading(false)
      setTimeout(() => {
        setMessage({ text: 'Please fill out the form manually.', type: 'error' })
      }, 2000)
      return
    }

    // 4. Password match check
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match. Please try again.', type: 'error' })
      setLoading(false)
      return
    }

    // 5. Password strength check
    if (password.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters long.', type: 'error' })
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
      console.log('[Signup] Performing health check')
      try {
        const healthRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: { apikey: supabaseAnonKey },
        })
        if (!healthRes.ok) {
          throw new Error(`Health check failed (${healthRes.status})`)
        }
        console.log('[Signup] Health check passed')
      } catch (healthError) {
        console.error('[Signup] Health check failed:', healthError)
        setMessage({
          text: 'Auth service unreachable. Please disable tracking prevention for this site or try another browser.',
          type: 'error',
        })
        setLoading(false)
        return
      }

      console.log('[Signup] Calling signUp')
      const signUpResult = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
        })
      ) as Awaited<ReturnType<typeof supabase.auth.signUp>>
      const { data, error } = signUpResult

      console.log('[Signup] SignUp response received', { 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        userId: data?.user?.id 
      })

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
          console.log('[GA4] sign_up event fired')
        }
      }
      
      // Check for session (with email verification disabled, should have immediate session)
      console.log('[Signup] Checking for session')
      const sessionResult = await withTimeout(supabase.auth.getSession()) as Awaited<ReturnType<typeof supabase.auth.getSession>>
      const { data: sessionData } = sessionResult
      console.log('[Signup] Session check complete', { hasSession: !!sessionData?.session })

      if (sessionData?.session) {
        console.log('[Signup] Session found, redirecting to onboarding')
        // User has immediate session, redirect to onboarding
        setLoading(false)
        router.push('/onboarding')
        return
      }

      // Fallback: If no session, try signing in with the credentials
      console.log('[Signup] No session found, attempting sign in')
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (signInError) {
        console.error('[Signup] Sign in after signup failed:', signInError)
        setMessage({ 
          text: 'Account created but unable to sign in automatically. Please sign in manually.', 
          type: 'info' 
        })
        setLoading(false)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(email)}`)
        }, 2000)
        return
      }

      console.log('[Signup] Sign in successful, redirecting to onboarding')
      setLoading(false)
      router.push('/onboarding')

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
        <div className="hidden lg:flex bg-gradient-to-br from-indigo-50 to-purple-50 border-r border-slate-200 flex flex-col justify-center items-center h-full px-8 text-center">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <blockquote className="text-xl text-slate-700 italic leading-relaxed font-medium">
                "<span className="font-semibold text-indigo-700">Reasoning</span> is the difference between knowing the answer and saving a life."
              </blockquote>
            </div>
            
            {/* Quick Benefits */}
            <div className="space-y-4 pt-8 border-t border-indigo-200">
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Learn from your materials</div>
                  <div className="text-xs text-slate-600">Upload your notes and textbooks</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Build clinical reasoning</div>
                  <div className="text-xs text-slate-600">Step-by-step NCLEX-style preparation</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
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
        <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-white order-1 lg:order-2">
          <div className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl mb-4 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                  Start your free preview
                </h1>
                <p className="text-sm text-slate-600">
                  Join nursing students building real clinical reasoning skills
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
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

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Create a password"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
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
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-300 focus:ring-red-600'
                          : 'border-slate-200 focus:ring-indigo-600'
                      }`}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        formInteractedRef.current = true
                      }}
                      onFocus={() => formInteractedRef.current = true}
                      required
                      minLength={8}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-600 mt-1">
                        Passwords match ✓
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Use at least 8 characters for your password.
                  </p>
                </div>

                {message && (
                  <div className={`p-4 text-sm rounded-xl ${
                    message.type === 'error' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : message.type === 'info'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    <div className="flex flex-col gap-2">
                      <span>{message.text}</span>
                      {message.type === 'error' && message.text.includes('already registered') && (
                        <Link
                          href="/login"
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800 underline mt-1"
                        >
                          Go to Sign In
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword || !acceptedTerms}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-indigo-600 text-white rounded-xl text-base font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                      required
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-700 underline font-medium">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-700 underline font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 text-center">
                    Cancel anytime during your free preview • 7-day free trial included
                  </p>
                </div>
              </form>

              {/* Toggle */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 text-center">
                <span className="text-sm text-slate-600">
                  Already have an account?{' '}
                </span>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
