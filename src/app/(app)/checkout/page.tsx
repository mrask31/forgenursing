'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { startStripeCheckout } from '@/lib/stripeClient'
import { Loader2 } from 'lucide-react'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') as 'monthly' | 'semester' | 'annual' | null

  useEffect(() => {
    // Clean up localStorage
    localStorage.removeItem('forgenursing-pending-plan')

    if (plan && (plan === 'monthly' || plan === 'semester' || plan === 'annual')) {
      // Initiate Stripe checkout
      startStripeCheckout(plan).catch((error) => {
        console.error('Failed to start Stripe checkout:', error)
        // If checkout fails, redirect to payment required page (not dashboard!)
        router.push('/billing/payment-required')
      })
    } else {
      console.warn('Invalid or missing plan parameter:', plan)
      // No valid plan, redirect to payment required page
      router.push('/billing/payment-required')
    }
  }, [plan, router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-700">Redirecting to checkout...</p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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

