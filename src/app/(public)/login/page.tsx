'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, MessageSquare, BookOpen, GraduationCap, Shield } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [redirect, setRedirect] = useState('/tutor')
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirectParam = params.get('redirect')
      if (redirectParam) {
        setRedirect(redirectParam)
      }
      
      // Check if user just verified their email
      const verified = params.get('verified')
      const verifiedEmail = params.get('email')
      if (verified === 'true' && verifiedEmail) {
        setShowVerificationSuccess(true)
        setEmail(verifiedEmail)
        setMessage({ 
          text: `Thanks for verifying your email! Please sign in to continue.`, 
          type: 'success' 
        })
      }
    }
  }, [])

  // Memoize Supabase client to prevent recreation on every render
  // Ensure Supabase client configuration for production
  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Sanity check: log warning in dev if env vars are missing
    if (process.env.NODE_ENV === 'development') {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ [Login] Supabase environment variables are missing!')
        console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
        console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
      }
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.')
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Ensure spinner stops on login error - always set loading to false in finally
    setLoading(true)
    setMessage(null)

    try {
      console.log('[Login] Attempting to sign in...', { email: email.trim() })
      
      // Wrap the sign-in call in try/catch with defensive error handling
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      // On error: Set isLoading back to false, store error state, show human-readable message
      if (error) {
        console.error('[Login] Supabase sign-in error:', error)
        setMessage({ 
          text: error.message || 'Login failed. Please check your email and password.', 
          type: 'error' 
        })
        return // Exit early, finally block will set loading to false
      }

      if (!data || !data.user) {
        console.error('[Login] No user data returned from sign-in')
        setMessage({ 
          text: 'Login failed: No user data returned. Please try again.', 
          type: 'error' 
        })
        return // Exit early, finally block will set loading to false
      }

      console.log('[Login] Sign in successful, checking subscription...', { userId: data.user.id })

      // Check subscription status before redirecting
      // Also check for stripe_subscription_id to see if they've completed checkout
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, stripe_subscription_id')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('[Login] Error checking subscription status:', profileError)
        console.error('[Login] Profile error details:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        })
        // On error, default to checkout to be safe
        console.log('[Login] Redirecting to checkout (profile error)')
        window.location.replace('/checkout')
        return // Exit early, redirecting so don't set loading to false
      }

      const subscriptionStatus = profile?.subscription_status
      const hasStripeSubscription = !!profile?.stripe_subscription_id
      
      console.log('[Login] Subscription check:', {
        subscriptionStatus,
        hasStripeSubscription,
        profileExists: !!profile,
        rawProfile: profile
      })
      
      // Explicitly check for active subscription statuses (trialing or active)
      const hasActiveSubscription = subscriptionStatus === 'trialing' || subscriptionStatus === 'active'
      
      // PRIORITY 1: If user has trialing or active status, go to tutor
      if (hasActiveSubscription) {
        console.log('[Login] User has active subscription (trialing or active), redirecting to:', redirect)
        window.location.replace(redirect)
        return
      }
      
      // PRIORITY 2: If user has a Stripe subscription ID but status is pending_payment,
      // the webhook might not have fired yet. In this case, allow access (they completed checkout)
      if (hasStripeSubscription && subscriptionStatus === 'pending_payment') {
        console.log('[Login] User has Stripe subscription ID but status is pending - likely in trial, allowing access')
        // Update status to trialing as a best guess (webhook should update it properly)
        await supabase
          .from('profiles')
          .update({ subscription_status: 'trialing' })
          .eq('id', data.user.id)
        console.log('[Login] Updated status to trialing, redirecting to tutor')
        window.location.replace(redirect)
        return
      }
      
      // PRIORITY 3: If user needs payment, redirect to checkout
      if (!subscriptionStatus || 
          subscriptionStatus === 'pending_payment' || 
          subscriptionStatus === 'canceled' || 
          subscriptionStatus === 'past_due' || 
          subscriptionStatus === 'unpaid') {
        console.log('[Login] Redirecting to checkout (payment needed)')
        window.location.replace('/checkout')
        return
      }
      
      // PRIORITY 4: Unknown status - log and redirect to checkout to be safe
      console.warn('[Login] Unknown subscription status:', subscriptionStatus, '- redirecting to checkout')
      window.location.replace('/checkout')
      // Note: We don't set loading to false on success because we're redirecting
    } catch (err) {
      // In catch: console.error for debugging, show user-friendly error
      console.error('[Login] Unexpected login error:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Something went wrong. Please try again.'
      setMessage({ 
        text: errorMessage, 
        type: 'error' 
      })
    } finally {
      // Make sure finally always runs so the spinner stops, even on failure
      // Check if we're still on the login page before setting loading to false
      // (If we redirected, the page will unmount anyway)
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      if (currentPath === '/login') {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100dvh-4rem)] flex-col-reverse lg:flex-row">
        {/* Left Column - Desktop Only, shown below on mobile */}
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
                  <div className="font-semibold text-slate-900 text-sm mb-1">Continue your studies</div>
                  <div className="text-xs text-slate-600">Pick up where you left off</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Your learning library</div>
                  <div className="text-xs text-slate-600">All your saved explanations and clips</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">Access your dashboard</div>
                  <div className="text-xs text-slate-600">View your progress and study patterns</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Auth Form - Shown first on mobile */}
        <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-white order-1 lg:order-2">
          <div className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl mb-4 shadow-lg">
                  <MessageSquare className="w-7 h-7 text-white" />
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
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
                      Welcome back
                    </h1>
                    <p className="text-sm text-slate-600">
                      Sign in to continue your clinical reasoning journey
                    </p>
                  </>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
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
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-indigo-600 text-white rounded-xl text-base font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[44px]"
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

              {/* Toggle */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 text-center">
                <span className="text-sm text-slate-600">
                  Don't have an account?{' '}
                </span>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
