import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Lazy initialization function for Stripe client
// This prevents Stripe from being initialized during build time
function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export const dynamic = 'force-dynamic'

// This endpoint handles Stripe webhooks to update subscription status
export async function POST(req: Request) {
  try {
    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Webhook] STRIPE_SECRET_KEY is missing from environment variables')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Initialize Stripe client only when needed (not at module level)
    const stripe = getStripeClient()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[Stripe Webhook] Received event:', event.type)

    const supabase = createClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get user ID from client_reference_id (we set this in checkout route)
        const userId = session.client_reference_id
        const customerId = session.customer as string

        if (!userId) {
          console.error('[Stripe Webhook] No client_reference_id in checkout session')
          break
        }

        // Get subscription ID from the session
        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          console.error('[Stripe Webhook] No subscription ID in checkout session')
          break
        }

        // Get subscription details to determine status
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'

        // Update user's profile with subscription info
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', userId)

        if (error) {
          console.error('[Stripe Webhook] Error updating profile:', error)
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          )
        }

        console.log('[Stripe Webhook] Updated profile:', {
          userId,
          status,
          customerId,
          subscriptionId,
        })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.warn('[Stripe Webhook] No profile found for customer:', customerId)
          break
        }

        // Map Stripe subscription status to our status
        let status: string
        if (subscription.status === 'trialing') {
          status = 'trialing'
        } else if (subscription.status === 'active') {
          status = 'active'
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          status = 'past_due'
        } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          status = 'canceled'
        } else {
          status = 'canceled' // Default for other statuses
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', profile.id)

        if (error) {
          console.error('[Stripe Webhook] Error updating subscription status:', error)
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          )
        }

        console.log('[Stripe Webhook] Updated subscription status:', {
          userId: profile.id,
          status,
          subscriptionId: subscription.id,
        })
        break
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

