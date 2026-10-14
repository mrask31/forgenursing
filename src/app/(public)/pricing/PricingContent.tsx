'use client'

import { useState } from 'react'
import { STANDARD_OFFER } from '@/lib/offer'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Loader2 } from 'lucide-react'

type Plan = 'monthly' | 'annual'
interface PricingContentProps { isSubscribed: boolean; isSignedIn: boolean }
const plans = [
  { id: 'monthly', title: 'Monthly', price: STANDARD_OFFER.monthly, period: 'month', description: 'A flexible monthly subscription.' },
  { id: 'annual', title: 'Annual', price: STANDARD_OFFER.annual, period: 'year', description: 'Save 34% compared with paying monthly for a year.' },
] as const

export default function PricingContent({ isSubscribed, isSignedIn }: PricingContentProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selected = plans.find(plan => plan.id === selectedPlan)!

  if (isSubscribed) return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
        <Check className="w-8 h-8 text-teal-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">You’re subscribed</h1>
        <p className="text-slate-600 mb-6">Your ForgeNursing subscription is active. Manage your subscription from Account.</p>
        <button onClick={() => router.push('/settings')} className="w-full px-6 py-3 bg-teal-600 text-white rounded-xl font-medium">Open Account →</button>
      </div>
    </div>
  )

  const handleCheckout = async () => {
    setLoading(true); setError(null)
    try {
      if (!isSignedIn) router.push(`/signup?plan=${selectedPlan}`)
      else {
        const { startStripeCheckout } = await import('@/lib/stripeClient')
        await startStripeCheckout(selectedPlan)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to open checkout. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 py-12 sm:py-16 pb-safe-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Study Plans</h1>
          <p className="text-lg text-slate-700">{isSignedIn ? 'Choose a paid plan when you are ready to subscribe.' : 'Try the full experience for 7 days. No credit card required.'}</p>
          <p className="text-sm text-slate-600 mt-3">You are charged only after completing paid checkout. Paid subscriptions renew until canceled.</p>
        </div>
        <div role="radiogroup" aria-label="Subscription plan" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8" onKeyDown={event => {
          if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return
          event.preventDefault()
          const radios = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'))
          const index = radios.indexOf(document.activeElement as HTMLElement)
          const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1
          const next = radios[(index + direction + radios.length) % radios.length]
          next?.focus(); next?.click()
        }}>
          {plans.map(plan => (
            <div key={plan.id} role="radio" aria-label={`${plan.title} plan`} aria-checked={selectedPlan === plan.id} tabIndex={selectedPlan === plan.id ? 0 : -1}
              onClick={() => setSelectedPlan(plan.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedPlan(plan.id) } }}
              className={`bg-white border-2 rounded-2xl p-6 sm:p-8 shadow-sm cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 ${selectedPlan === plan.id ? 'border-teal-600' : 'border-slate-200'}`}>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{plan.title}</h2>
              <p className="mb-4"><span className="text-4xl font-bold text-slate-900">${plan.price}</span><span className="text-lg text-slate-600"> / {plan.period}</span></p>
              <p className="text-sm text-slate-600 mb-5">{plan.description}</p>
              <ul className="space-y-3 text-slate-700 text-sm">
                <li>Short NCLEX-RN practice sessions</li><li>Answer explanations and related retries</li><li>AI clinical reasoning tutor</li><li>Practice history and progress</li>
                {!isSignedIn && <li>7-day free trial for new accounts</li>}
              </ul>
              {selectedPlan === plan.id && <div className="flex items-center gap-2 text-teal-700 font-semibold mt-5"><Check className="w-5 h-5" />Selected</div>}
            </div>
          ))}
        </div>
        <div className="text-center max-w-lg mx-auto">
          {error && <p role="alert" className="text-red-700 text-sm mb-3">{error}</p>}
          <button onClick={handleCheckout} disabled={loading} className="px-8 py-4 bg-teal-600 text-white rounded-xl text-lg font-bold disabled:opacity-50 min-h-[44px]">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />Opening…</> : <>{isSignedIn ? 'Continue to Checkout' : 'Start Free Trial'}<ArrowRight className="w-5 h-5 inline-block ml-2" /></>}
          </button>
          <p className="text-sm text-slate-600 mt-3">{isSignedIn ? `$${selected.price}/${selected.period}. Renews until canceled.` : `Start free, then $${selected.price}/${selected.period} if you subscribe. No automatic charge after your trial.`}</p>
        </div>
      </div>
    </div>
  )
}
