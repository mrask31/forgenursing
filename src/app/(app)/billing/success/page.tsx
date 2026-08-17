'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

function BillingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  useEffect(() => {
    let isMounted = true
    const start = Date.now()
    const delays = [1000, 2000, 4000, 6000, 7000]

    const checkStatus = async (attempt = 0) => {
      try {
        const res = await fetch('/api/subscription/status', { cache: 'no-store' })
        if (!res.ok) {
          if (isMounted) setLoading(false)
          return
        }
        const data = await res.json()
        const shouldPoll = !data?.hasAccess && Date.now() - start < 20000

        if (!shouldPoll) {
          try {
            const onboardingRes = await fetch('/api/onboarding/status')
            if (onboardingRes.ok) {
              const onboardingData = await onboardingRes.json()
              const completed = onboardingData.completed || onboardingData.skipped || false

              if (isMounted) {
                setOnboardingCompleted(completed)
                setLoading(false)

                if (!completed) {
                  setTimeout(() => {
                    window.location.href = '/onboarding'
                  }, 1500)
                }
              }
            }
          } catch (e) {
            console.error('[Billing Success] Error checking onboarding status:', e)
            if (isMounted) {
              setLoading(false)
              setTimeout(() => {
                window.location.href = '/onboarding'
              }, 1500)
            }
          }

          if (isMounted) setLoading(false)
          return
        }

        const delay = delays[Math.min(attempt, delays.length - 1)]
        setTimeout(() => checkStatus(attempt + 1), delay)
      } catch {
        if (isMounted) setLoading(false)
      }
    }

    const initialTimer = setTimeout(() => {
      checkStatus()
    }, 500)

    return () => {
      isMounted = false
      clearTimeout(initialTimer)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D8F9C] mx-auto mb-4" />
          <p className="text-[#1E2D3D]">Confirming your Retake Recovery Pass...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-[#DDE5EE] rounded-2xl p-8 shadow-lg text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">
            Your 90-Day Retake Recovery Pass is active.
          </h1>

          <p className="text-[#1E2D3D]/70 mb-6 leading-relaxed">
            You now have access to the retake recovery dashboard, diagnostic sets, Answer Autopsies, the Mistake Pattern Map, and focused Fix Plans.
          </p>

          {sessionId && (
            <p className="text-xs text-slate-500 mb-6">
              Session ID: {sessionId.substring(0, 20)}...
            </p>
          )}

          <div className="space-y-3">
            <Link
              href={onboardingCompleted ? '/entry' : '/onboarding'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0D8F9C] text-white rounded-xl text-base font-bold hover:bg-[#0a7d88] transition-all shadow-lg hover:shadow-xl"
            >
              {onboardingCompleted ? 'Go to Recovery Dashboard' : 'Finish Setup'}
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/quiz"
              className="block text-sm font-semibold text-[#0D8F9C] hover:text-[#0a7d88] transition-colors"
            >
              Start a retake diagnostic
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">
                support@forgenursing.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100dvh-4rem)] bg-[#F7F9FB] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D8F9C] mx-auto mb-4" />
          <p className="text-[#1E2D3D]">Loading...</p>
        </div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  )
}
