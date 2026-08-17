'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startStripeCheckout } from '@/lib/stripeClient'
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

function CheckoutContent() {
  const router = useRouter()
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
        console.warn('[Checkout] Access check failed or timed out; showing retake pass instead of spinner', error)
        setHasCurrentAccess(false)
        setIsExpired(false)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccess()
  }, [])

  const handleStartCheckout = async () => {
    setIsStartingCheckout(true)
    try {
      await startStripeCheckout('retake')
    } catch (error) {
      console.error('Failed to start Stripe checkout:', error)
      setIsStartingCheckout(false)
      router.push('/billing/payment-required')
    }
  }

  if (checkingAccess) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D8F9C] mx-auto mb-4" />
          <p className="text-[#1E2D3D]">Checking your access...</p>
        </div>
      </div>
    )
  }

  if (hasCurrentAccess) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-[#DDE5EE] rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-[#E0F4F6] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-[#0D8F9C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">You already have access</h1>
          <p className="text-[#1E2D3D]/70 mb-6 leading-relaxed">
            Your ForgeNursing access is active. Go back to the app to continue your recovery plan.
          </p>
          <div className="space-y-3">
            <Link href="/entry" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0D8F9C] text-white rounded-xl text-base font-bold hover:bg-[#0a7d88] transition-all">
              Go to ForgeNursing
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/quiz" className="block text-sm font-semibold text-[#0D8F9C] hover:text-[#0a7d88] transition-colors">
              Start a diagnostic-style practice set
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-white text-[#0B2545]">
      <section className="bg-gradient-to-br from-[#E0F4F6] via-white to-[#F7F9FB] py-14 sm:py-20" aria-labelledby="checkout-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="paywall">
          <Link href="/pricing" className="text-sm font-bold text-[#0D8F9C] hover:text-[#0a7d88]">
            ← Back to Pricing
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#0D8F9C]/30 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">
                {isExpired ? 'Renew Recovery Access' : '90-Day Retake Recovery Pass'}
              </p>
              <h1 id="checkout-heading" className="mt-5 font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-[#0B2545]">
                Unlock the plan that helps you know why you picked the wrong one.
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#1E2D3D]/75">
                Get diagnostic sets, Answer Autopsies, a Mistake Pattern Map, and a focused retake plan for one preparation window.
              </p>

              <div className="mt-8 rounded-2xl border border-[#0D8F9C]/25 bg-[#E0F4F6] p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0D8F9C]" />
                  <p className="text-sm leading-6 text-[#1E2D3D]/75">
                    ForgeNursing is an educational study aid. It is not affiliated with NCSBN and does not guarantee exam outcomes.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#0D8F9C]/25 bg-white p-6 sm:p-8 shadow-xl shadow-[#0B2545]/10">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D8F9C]">Retake Recovery Pass</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-bold text-[#0B2545]">$19.99</span>
                <span className="pb-2 text-base font-semibold text-[#1E2D3D]/65">/ 90 days</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#1E2D3D]/70">
                {isExpired ? 'Renew access and continue your recovery workflow.' : 'One focused retake window. No monthly plan grid.'}
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Retake Recovery Check',
                  'Diagnostic question sets',
                  'Answer Autopsies',
                  'Mistake Pattern Map',
                  '7-day and 14-day Fix Plans',
                  'Weekly Retake Readiness Reports',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[#1E2D3D]/75">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0D8F9C]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartCheckout}
                disabled={isStartingCheckout}
                className="mt-6 inline-flex w-full min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#0D8F9C] px-6 py-3 text-base font-bold text-white shadow-lg shadow-[#0D8F9C]/20 transition hover:bg-[#0a7d88] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingCheckout ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  <>
                    Continue to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="mt-4 text-xs leading-5 text-[#1E2D3D]/55">
                If checkout is not configured yet, contact support@forgenursing.com. Stripe must use the 90-day recovery pass price.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D8F9C] mx-auto mb-4" />
          <p className="text-[#1E2D3D]">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
