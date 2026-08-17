'use client'

type Plan = 'monthly' | 'semester' | 'annual' | 'retake'

const PRICE_IDS: Record<Plan, string | undefined> = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
  semester: process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER,
  annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
  retake: process.env.NEXT_PUBLIC_STRIPE_PRICE_RETAKE_90_DAY,
}

// Founder / discounted price IDs — server-side only (no NEXT_PUBLIC_ prefix)
export const FOUNDER_PRICE_IDS: Record<Plan, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_FOUNDER,
  semester: process.env.STRIPE_PRICE_SEMESTER_FOUNDER,
  annual: process.env.STRIPE_PRICE_ANNUAL_FOUNDER,
  retake: process.env.STRIPE_PRICE_RETAKE_90_DAY_FOUNDER,
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
    product_positioning: plan === 'retake' ? 'retake_recovery_pass' : 'legacy_subscription',
    has_price_id: Boolean(priceId),
  })

  if (!priceId) {
    console.error('Missing Stripe price ID for plan:', plan)
    await captureCheckoutEvent('checkout_configuration_error', {
      source: 'stripe_client',
      plan,
      checkout_type: 'standard',
      error_type: 'missing_price_id',
    })
    alert(
      plan === 'retake'
        ? 'The Retake Recovery Pass checkout is not configured yet. Please contact support.'
        : `Pricing configuration error: Missing price ID for ${plan} plan. Please check your environment variables.`
    )
    return
  }

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan }),
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
      let errorData
      try {
        errorData = await res.json()
      } catch {
        errorData = { error: await res.text() }
      }
      console.error('Stripe checkout failed:', {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
      })
      await captureCheckoutEvent('checkout_start_failed', {
        source: 'stripe_client',
        plan,
        checkout_type: 'standard',
        status: res.status,
        error_message: errorData?.error || null,
      })

      const errorMessage = errorData?.error || 'Unknown error'
      if (process.env.NODE_ENV === 'development') {
        alert(`Error starting checkout: ${errorMessage} (Status: ${res.status})`)
      } else {
        alert('Something went wrong starting checkout. Please try again.')
      }
      return
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
      alert('Checkout session missing URL. Please contact support.')
      return
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
    if (process.env.NODE_ENV === 'development') {
      alert(`Network error: ${errorMessage}`)
    } else {
      alert('Network error starting checkout. Please try again.')
    }
  }
}
