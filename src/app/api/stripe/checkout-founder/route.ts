import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

type Plan = 'monthly' | 'semester' | 'annual'

// Server-side only — never sent to the client
const FOUNDER_PRICE_IDS: Record<Plan, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_FOUNDER,
  semester: process.env.STRIPE_PRICE_SEMESTER_FOUNDER,
  annual: process.env.STRIPE_PRICE_ANNUAL_FOUNDER,
}

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    // Authenticate user
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a beta founder who hasn't subscribed yet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_beta, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.is_beta) {
      return NextResponse.json({ error: 'Founder pricing is only available to beta users' }, { status: 403 })
    }

    if (profile.subscription_status === 'active') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
    }

    // Resolve founder price ID server-side
    const body = await req.json()
    const { plan } = body as { plan?: Plan }

    if (!plan || !['monthly', 'semester', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = FOUNDER_PRICE_IDS[plan]
    if (!priceId) {
      console.error('[Founder Checkout] Missing founder price ID for plan:', plan)
      return NextResponse.json({ error: 'Founder price not configured for this plan' }, { status: 500 })
    }

    // Build redirect URL
    const requestUrl = new URL(req.url)
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      const protocol = appUrl.includes('localhost') ? 'http://' : 'https://'
      appUrl = `${protocol}${appUrl}`
    }

    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      customer_email: user.email || undefined,
      client_reference_id: user.id,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (error: unknown) {
    console.error('[Founder Checkout] Error:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
