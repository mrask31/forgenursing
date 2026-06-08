'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

function BillingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    async function trackSuccess() {
      try {
        const posthog = (await import('posthog-js')).default
        posthog.capture('checkout_success_returned', {
          source: 'billing_success_page',
          stripe_checkout_session_id: sessionId || null,
          has_session_id: Boolean(sessionId),
        })
        posthog.capture('subscription_started', {
          source: 'billing_success_page_return',
          stripe_checkout_session_id: sessionId || null,
          confirmation_type: 'stripe_success_redirect',
        })
      } catch {}
    }

    trackSuccess()
  }, [sessionId])

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-lg text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">You&apos;re subscribed</h1>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Your ForgeNursing checkout completed. You can return to your study options and keep practicing.
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

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 flex items-center justify-center">
        <p className="text-slate-700">Loading...</p>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  )
}
