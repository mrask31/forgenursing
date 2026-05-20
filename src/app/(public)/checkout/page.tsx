'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { startStripeCheckout } from '@/lib/stripeClient'
import { ArrowRight, Check, CheckCircle, Loader2 } from 'lucide-react'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

type Plan = 'monthly' | 'annual'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlPlan = searchParams.get('plan') as Plan | null
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(urlPlan === 'annual' ? 'annual' : urlPlan === 'monthly' ? 'monthly' : null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hasCurrentAccess, setHasCurrentAccess] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    localStorage.removeItem('forgenursing-pending-plan')
  }, [])

  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true)
      try {
        const response = await withTimeout(
          fetch('/api/subscription/status', {
            credentials: 'include',
            cache: 'no-store',
          }),
          5000,
          'CHECKOUT_ACCESS_TIMEOUT'
        )

        if (!response.ok) {
          setHasCurrentAccess(false)
          setIsExpired(false)
          return
        }

        const data = await response.json().catch(() => null)
        const access = Boolean(data?.hasAccess)
        const status = data?.status ?? null

        setHasCurrentAccess(access)
        setIsExpired(Boolean(!access && ['expired', 'past_due', 'canceled', 'incomplete_expired'].includes(status)))
      } catch (error) {
        console.warn('[Checkout] Access check failed or timed out; showing plans instead of spinner', error)
        setHasCurrentAccess(false)
        setIsExpired(false)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccess()
  }, [])

  const handleStartCheckout = async () => {
    if (!selectedPlan) return

    setIsStartingCheckout(true)
    try {
      await startStripeCheckout(selectedPlan)
    } catch (error) {
      console.error('Failed to start Stripe checkout:', error)
      setIsStartingCheckout(false)
      router.push('/billing/payment-required')
    }
  }

  if (checkingAccess) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-700">Checking your access...</p>
        </div>
      </div>
    )
  }

  if (hasCurrentAccess) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">You already have access</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Your ForgeNursing access is active. Go back to the app to practice, find your mistake type, and fix the weakness.
          </p>
          <div className="space-y-3">
            <Link href="/entry" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-base font-semibold hover:bg-indigo-700 transition-all">
              Go to Study Options
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/quiz" className="block text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
              Start a Practice Quiz
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 py-12 sm:py-16 pb-safe-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="paywall">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">Founding Student Plan</h1>
          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto">
            {isExpired ? 'Choose a plan to continue. Cancel anytime.' : 'Start free, then choose the plan that fits. Cancel anytime.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-8">
          <PlanCard
            selected={selectedPlan === 'monthly'}
            title="Monthly"
            price="$9.99"
            cadence="/ month"
            subtitle="Perfect for students who want flexibility."
            bullets={[
              'NCLEX-style practice quizzes',
              'Mistake-type feedback',
              'Retest missed weaknesses',
              'AI clinical reasoning tutor',
              isExpired ? 'Immediate access after subscribing' : '7-day free trial included',
            ]}
            onClick={() => setSelectedPlan('monthly')}
          />

          <PlanCard
            selected={selectedPlan === 'annual'}
            title="Annual"
            price="$79"
            cadence="/ year"
            subtitle="Best value for a full year. Save 34% vs monthly."
            featured
            bullets={[
              '12 months of unlimited access',
              'Mistake-type feedback and targeted retests',
              'Best overall savings',
              isExpired ? 'Immediate access after subscribing' : '7-day free trial included',
            ]}
            onClick={() => setSelectedPlan('annual')}
          />
        </div>

        <div className="text-center max-w-md mx-auto">
          <button
            onClick={handleStartCheckout}
            disabled={!selectedPlan || isStartingCheckout}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base sm:text-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isStartingCheckout ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                Starting checkout...
              </>
            ) : (
              <>
                Continue to Checkout
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 inline-block ml-2" />
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-3">
            {isExpired ? 'Subscribe to continue. Cancel anytime.' : 'Start free, then $9.99/month. Cancel anytime.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  selected,
  title,
  price,
  cadence,
  subtitle,
  bullets,
  featured = false,
  onClick,
}: {
  selected: boolean
  title: string
  price: string
  cadence: string
  subtitle: string
  bullets: string[]
  featured?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-white border-2 rounded-2xl p-6 sm:p-8 shadow-lg cursor-pointer transition-all duration-200 ${
        selected ? 'border-indigo-500 shadow-xl shadow-indigo-500/20' : featured ? 'border-indigo-300' : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      {featured && <div className="mb-3"><span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">Best Value</span></div>}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-slate-900">{price}</span>
        <span className="text-lg text-slate-600"> {cadence}</span>
      </div>
      <p className="text-sm text-slate-600 mb-4">{subtitle}</p>
      <ul className="space-y-2.5 mb-6 text-sm text-slate-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="flex items-center justify-center gap-2 text-indigo-600 font-semibold">
          <Check className="w-5 h-5" />
          <span>Selected</span>
        </div>
      )}
    </button>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-700">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
