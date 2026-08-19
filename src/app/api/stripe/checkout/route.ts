import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export const dynamic = 'force-dynamic'

function resolveAppUrl(req: Request): string {
  const requestUrl = new URL(req.url)

  if (process.env.NEXT_PUBLIC_APP_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      return baseUrl
    }
    const protocol = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') ? 'http://' : 'https://'
    return `${protocol}${baseUrl}`
  }

  return requestUrl.origin
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Checkout] STRIPE_SECRET_KEY is missing from environment variables')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const stripe = getStripeClient()

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Stripe Checkout] Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { priceId, plan } = body as { priceId?: string; plan?: string }

    if (!priceId || typeof priceId !== 'string') {
      console.error('[Stripe Checkout] Invalid price ID:', { priceId, body })
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    const appUrl = resolveAppUrl(req)
    const isRetakePass = plan === 'retake'

    if (isRetakePass) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        payment_method_collection: 'always',
        allow_promotion_codes: true,
        success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan=retake`,
        cancel_url: `${appUrl}/checkout?checkout=canceled&plan=retake`,
        customer_email: user.email || undefined,
        client_reference_id: user.id,
        metadata: {
          user_id: user.id,
          plan: 'retake',
          access_days: '90',
          offer: 'retake_recovery_pass',
        },
        payment_intent_data: {
          metadata: {
            user_id: user.id,
            plan: 'retake',
            access_days: '90',
            offer: 'retake_recovery_pass',
          },
        },
      })

      return NextResponse.json({
        url: session.url,
        sessionId: session.id,
      })
    }

    // Legacy subscription plans remain supported for existing routes/users.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${appUrl}/entry?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?checkout=canceled`,
      customer_email: user.email || undefined,
      client_reference_id: user.id,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })

  } catch (error: unknown) {
    console.error('[Stripe Checkout] Error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
