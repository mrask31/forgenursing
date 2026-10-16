'use client'

type Plan = 'monthly' | 'annual'

const PRICE_IDS: Record<Plan, string> = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
  annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
}

async function captureCheckoutEvent(eventName: string, properties: Record<string, unknown>) {
  try {
    const posthog = (await import('posthog-js')).default
    posthog.capture(eventName, properties)
  } catch {}
}

export async function startStripeCheckout(plan: Plan) {
  const priceId = PRICE_IDS[plan]

  await captureCheckoutEvent('checkout_started', {
    source: 'stripe_client',
    plan,
    checkout_type: 'standard',
    has_price_id: Boolean(priceId),
  })

  // Log price IDs for debugging (first 10 chars only for security)

  // Missing legacy semester configuration must not block monthly or annual checkout.
  const availablePrices = Object.values(PRICE_IDS).filter(Boolean)
  if (new Set(availablePrices).size !== availablePrices.length) {
    throw new Error('Subscription plans are temporarily unavailable. Please contact support.')
  }

  if (!priceId) throw new Error('This subscription plan is temporarily unavailable. Please contact support.')

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })

    if (res.status === 401) {
      await captureCheckoutEvent('checkout_requires_signup', {
        source: 'stripe_client',
        plan,
        checkout_type: 'standard',
      })
      // Not logged in – send them to signup, preserving intended plan
      window.location.href = `/signup?plan=${plan}`
      return
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      await captureCheckoutEvent('checkout_start_failed', { source: 'stripe_client', plan, status: res.status })
      throw new Error(typeof errorData?.error === 'string' ? errorData.error : 'Unable to open checkout. Please try again.')
    }

    const { url, sessionId } = await res.json()
    if (!url) {
      console.error('Stripe checkout session missing URL')
      await captureCheckoutEvent('checkout_start_failed', {
        source: 'stripe_client',
        plan,
        checkout_type: 'standard',
        error_type: 'missing_checkout_url',
        session_id: sessionId || null,
      })
      throw new Error('Unable to open checkout. Please contact support.')
    }

    await captureCheckoutEvent('checkout_redirect_started', {
      source: 'stripe_client',
      plan,
      checkout_type: 'standard',
      session_id: sessionId || null,
    })
    window.location.href = url
  } catch (err) {
    console.error('Stripe checkout error', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await captureCheckoutEvent('checkout_start_failed', {
      source: 'stripe_client',
      plan,
      checkout_type: 'standard',
      error_type: 'network_or_exception',
      error_message: errorMessage,
    })
    throw new Error(errorMessage === 'Unknown error' ? 'Unable to open checkout. Please try again.' : errorMessage)
  }
}
