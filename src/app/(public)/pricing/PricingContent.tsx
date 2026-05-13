'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Loader2 } from 'lucide-react'

type Plan = 'monthly' | 'semester' | 'annual'

interface PricingContentProps {
  isBeta: boolean
  isSubscribed: boolean
}

async function startFounderCheckout(plan: Plan): Promise<void> {
  const res = await fetch('/api/stripe/checkout-founder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Checkout failed')
  }

  const { url } = await res.json()
  if (url) window.location.href = url
}

async function startStandardCheckout(plan: Plan): Promise<void> {
  const { startStripeCheckout } = await import('@/lib/stripeClient')
  await startStripeCheckout(plan)
}

export default function PricingContent({ isBeta, isSubscribed }: PricingContentProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isSubscribed) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You're subscribed</h1>
          <p className="text-slate-600 mb-6">Your ForgeNursing subscription is active. You have full access to everything.</p>
          <button
            onClick={() => router.push('/tutor')}
            className="w-full px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            Go to ForgeNursing →
          </button>
        </div>
      </div>
    )
  }

  const handleCheckout = async () => {
    if (!selectedPlan) return
    setLoading(true)
    setError(null)
    try {
      if (isBeta) {
        await startFounderCheckout(selectedPlan)
      } else {
        await startStandardCheckout(selectedPlan)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 py-12 sm:py-16 pb-safe-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Founder banner */}
        {isBeta && (
          <div className="max-w-3xl mx-auto mb-8 bg-teal-50 border border-teal-200 rounded-xl px-6 py-4 text-center">
            <p className="text-teal-800 font-medium text-sm sm:text-base">
              As a ForgeNursing beta founder, you've unlocked permanent discounted pricing. This offer expires when your beta access ends.
            </p>
          </div>
        )}

        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4">
            {isBeta ? 'Your Founder Pricing' : 'Founding Student Plan'}
          </h1>
          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto">
            {isBeta
              ? 'Locked-in forever as long as you stay subscribed. Never offered publicly.'
              : 'Start free, then choose the plan that fits your learning journey. Cancel anytime.'}
          </p>
        </div>

        {/* Pricing Cards — 2 public plans (monthly + annual), semester only for beta */}
        <div className={`grid grid-cols-1 ${isBeta ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-6 sm:gap-8 max-w-4xl mx-auto mb-8`}>

          {/* Monthly */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-6 sm:p-8 shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
              selectedPlan === 'monthly'
                ? 'border-teal-500 shadow-xl shadow-teal-500/30'
                : 'border-slate-200/60 hover:border-teal-300'
            }`}
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">Monthly</h3>
            <div className="mb-4">
              {isBeta ? (
                <>
                  <span className="text-4xl font-bold text-teal-700">$7.99</span>
                  <span className="text-lg text-slate-500"> / month</span>
                  <span className="ml-2 text-sm text-slate-400 line-through">$9.99</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-slate-900">$9.99</span>
                  <span className="text-lg text-slate-600"> / month</span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-4">Perfect for students who want flexibility.</p>
            <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>Unlimited NCLEX practice questions</span></li>
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>AI clinical reasoning tutor</span></li>
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>Upload your own study materials</span></li>
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>Cancel anytime</span></li>
              {isBeta && <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span className="font-medium text-teal-700">Founder rate — locked forever</span></li>}
              {!isBeta && <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>7-day free trial included</span></li>}
            </ul>
            {selectedPlan === 'monthly' && (
              <div className="flex items-center justify-center gap-2 text-teal-600 font-semibold mb-4">
                <Check className="w-5 h-5" /><span>Selected</span>
              </div>
            )}
          </div>

          {/* Semester — Only shown to beta/founder users */}
          {isBeta && (
            <div
              onClick={() => setSelectedPlan('semester')}
              className={`bg-gradient-to-br from-indigo-50/80 via-teal-50/80 to-indigo-50/80 backdrop-blur-sm border-2 rounded-2xl p-6 sm:p-8 shadow-xl relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                selectedPlan === 'semester'
                  ? 'border-teal-500 shadow-2xl shadow-teal-500/40'
                  : 'border-teal-400/60'
              }`}
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Semester</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-teal-700">$59</span>
                <span className="ml-2 text-sm text-slate-400 line-through">$89</span>
              </div>
              <p className="text-xs text-slate-600 mb-1">One-Time Payment • 4 Months</p>
              <p className="text-sm text-teal-700 mb-4 font-semibold">Founder rate — save $30 vs standard</p>
              <p className="text-sm text-slate-700 mb-4 font-medium">Designed for a single term or NCLEX prep cycle.</p>
              <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
                <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>4 full months of access</span></li>
                <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>No contracts or surprise renewals</span></li>
                <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span className="font-medium text-teal-700">Founder rate — locked forever</span></li>
              </ul>
              {selectedPlan === 'semester' && (
                <div className="flex items-center justify-center gap-2 text-teal-600 font-semibold mb-4">
                  <Check className="w-5 h-5" /><span>Selected</span>
                </div>
              )}
            </div>
          )}

          {/* Annual — Best Value */}
          <div
            onClick={() => setSelectedPlan('annual')}
            className={`bg-gradient-to-br from-indigo-50/80 via-teal-50/80 to-indigo-50/80 backdrop-blur-sm border-2 rounded-2xl p-6 sm:p-8 shadow-xl relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
              selectedPlan === 'annual'
                ? 'border-teal-500 shadow-2xl shadow-teal-500/40'
                : 'border-teal-400/60'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-teal-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold shadow-lg">
                Best Value
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 mt-2">Annual</h3>
            <div className="mb-1">
              {isBeta ? (
                <>
                  <span className="text-4xl font-bold text-teal-700">$59</span>
                  <span className="text-lg text-slate-500"> / year</span>
                  <span className="ml-2 text-sm text-slate-400 line-through">$79</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-slate-900">$79</span>
                  <span className="text-lg text-slate-600"> / year</span>
                </>
              )}
            </div>
            {isBeta ? (
              <p className="text-sm text-teal-700 mb-4 font-semibold">Founder rate — save $20 vs standard</p>
            ) : (
              <p className="text-sm text-indigo-700 mb-4 font-semibold">Save 34% vs monthly</p>
            )}
            <p className="text-sm text-slate-700 mb-4 font-medium">For students committed to mastery.</p>
            <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>12 months of unlimited access</span></li>
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>Best overall savings</span></li>
              <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>Renews annually (reminders sent)</span></li>
              {isBeta && <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span className="font-medium text-teal-700">Founder rate — locked forever</span></li>}
              {!isBeta && <li className="flex items-start gap-2"><span className="text-teal-600 mt-0.5">•</span><span>7-day free trial included</span></li>}
            </ul>
            {selectedPlan === 'annual' && (
              <div className="flex items-center justify-center gap-2 text-teal-600 font-semibold mb-4">
                <Check className="w-5 h-5" /><span>Selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center max-w-md mx-auto">
          {error && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}
          <button
            onClick={handleCheckout}
            disabled={!selectedPlan || loading}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-base sm:text-lg font-bold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg shadow-teal-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                Starting checkout...
              </>
            ) : (
              <>
                {isBeta ? 'Lock In My Founder Rate' : 'Start Free Trial'}
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-3">
            {isBeta
              ? 'Founder rate is yours permanently as long as you stay subscribed.'
              : 'Start free, then $9.99/month. Cancel anytime.'}
          </p>
        </div>

      </div>
    </div>
  )
}
