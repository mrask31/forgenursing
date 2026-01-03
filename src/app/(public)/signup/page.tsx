'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, MessageSquare, BookOpen, GraduationCap, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
    
    if (!acceptedTerms) {
      setMessage({ text: 'You must accept the Terms of Service and Privacy Policy to create an account.', type: 'error' })
      return
    }
    
    setLoading(true)
    setMessage(null)

    // Get plan from localStorage or URL
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan') || localStorage.getItem('forgenursing-pending-plan')
    
    // Build callback URL with plan parameter if present
    let callbackUrl = `${window.location.origin}/auth/callback`
    if (plan && (plan === 'monthly' || plan === 'semester' || plan === 'annual')) {
      callbackUrl += `?plan=${plan}`
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl,
        },
      })
      if (error) throw error
      
      setShowSuccess(true)
      setMessage({ 
        text: "Check your email for the confirmation link!", 
        type: 'success' 
      })
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Column */}
          <div className="hidden lg:flex bg-gradient-to-br from-indigo-50 to-purple-50 border-r border-slate-200 flex flex-col justify-center items-center h-full px-8 text-center">
            <div className="max-w-md space-y-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <blockquote className="text-xl text-slate-700 italic leading-relaxed font-medium">
                "<span className="font-semibold text-indigo-700">Reasoning</span> is the difference between knowing the answer and saving a life."
              </blockquote>
            </div>
          </div>

          {/* Right Column - Success State */}
          <div className="flex items-center justify-center px-4 py-12 bg-white">
            <div className="w-full max-w-md">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-3">
                  Check your email
                </h1>
                <p className="text-base text-slate-600 mb-2">
                  We've sent a confirmation link to
                </p>
                <p className="text-base font-semibold text-indigo-600 mb-6 break-all">
                  {email}
                </p>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-left">
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span>Check your Spam/Junk folder if you don't see it</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span>Click the confirmation link to activate your account</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span>You'll be signed in automatically after confirming</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen flex-col-reverse lg:flex-row">
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
                  <div className="text-xs text-slate-600">7-day access, no credit card required</div>
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
                      placeholder="Create a password"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Use at least 8 characters for your password.
                    </p>
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
                  disabled={loading || !email || !password || !acceptedTerms}
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
                    Cancel anytime during your free preview • No credit card required
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
