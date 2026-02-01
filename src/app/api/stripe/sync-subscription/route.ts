import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
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

/**
 * Sync subscription status from Stripe to Supabase on login.
 * Fixes missed webhooks, delayed events, and edge cases.
 * Access = trialing | active (no payment/invoice required).
 */
export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
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
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ ok: true }) // nothing to sync
    }

    const stripe = getStripeClient()
    const stripeSubscriptionId = profile.stripe_subscription_id

    if (stripeSubscriptionId) {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      const status =
        sub.status === 'trialing' ? 'trialing' :
        sub.status === 'active' ? 'active' :
        sub.status === 'past_due' || sub.status === 'unpaid' ? 'canceled' :
        'canceled'

      const { error: updateError } = await admin
        .from('profiles')
        .update({
          subscription_status: status,
          stripe_subscription_id: sub.id,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[Sync Subscription] Update failed:', updateError)
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, status })
    }

    const customerId = profile.stripe_customer_id
    if (!customerId) {
      return NextResponse.json({ ok: true })
    }

    const { data: subscriptions } = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    // Prefer trialing or active; otherwise first subscription
    const sub = subscriptions.find((s) => s.status === 'trialing' || s.status === 'active') ?? subscriptions[0]
    if (!sub) {
      return NextResponse.json({ ok: true })
    }

    const status =
      sub.status === 'trialing' ? 'trialing' :
      sub.status === 'active' ? 'active' :
      sub.status === 'past_due' || sub.status === 'unpaid' ? 'canceled' :
      'canceled'

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        subscription_status: status,
        stripe_subscription_id: sub.id,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Sync Subscription] Update failed:', updateError)
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status })
  } catch (err) {
    console.error('[Sync Subscription] Error:', err)
    return NextResponse.json({ ok: false, error: 'Sync failed' }, { status: 500 })
  }
}
