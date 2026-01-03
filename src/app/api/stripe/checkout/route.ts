import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe client
// Note: Stripe will start a 7-day trial and only charge after the trial ends
// Make sure to install: npm install stripe
// And set STRIPE_SECRET_KEY in your .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Checkout] STRIPE_SECRET_KEY is missing from environment variables')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // 1. Authenticate user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Stripe Checkout] Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get price ID from request body
    const body = await req.json()
    const { priceId } = body

    console.log('[Stripe Checkout] Request received:', { 
      userId: user.id, 
      email: user.email,
      priceId: priceId ? `${priceId.substring(0, 10)}...` : 'missing'
    })

    if (!priceId || typeof priceId !== 'string') {
      console.error('[Stripe Checkout] Invalid price ID:', { priceId, body })
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // 3. Build base URL for redirects (use request origin as fallback)
    const requestUrl = new URL(req.url)
    let appUrl: string
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      // If NEXT_PUBLIC_APP_URL doesn't have a protocol, add it
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        appUrl = baseUrl
      } else {
        // Default to https:// unless it's localhost
        const protocol = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') ? 'http://' : 'https://'
        appUrl = `${protocol}${baseUrl}`
      }
    } else {
      // Use request origin (already includes protocol)
      appUrl = requestUrl.origin
    }
    
    console.log('[Stripe Checkout] Using app URL:', appUrl)
    
    // 4. Create Stripe Checkout Session with 7-day free trial
    // Note: Stripe will start a 7-day trial and only charge after the trial ends
    // payment_method_collection: 'always' ensures users must provide payment info upfront
    // allow_promotion_codes: true enables coupon/promo code entry in the checkout form
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId, // e.g. monthly / semester / annual price ID from Stripe
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      payment_method_collection: 'always', // Require payment method even during trial
      allow_promotion_codes: true, // Enable coupon/promo code entry field
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      customer_email: user.email || undefined,
      client_reference_id: user.id, // Link the session to the user
    })

    // 5. Return session URL
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
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

