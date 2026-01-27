import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const HAS_ACCESS_STATUSES = ['trialing', 'active']

function getStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/subscription/status
 * Load subscription from Supabase first; if status missing but stripe_subscription_id exists,
 * fetch from Stripe, upsert status to Supabase, return. Handles trial subscriptions;
 * does NOT require invoices or payments.
 */
export async function GET(req: Request) {
  try {
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
      console.error('[Subscription Status] Non-200: unauthenticated', { error: authError?.message })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl) {
      console.error('[Subscription Status] Non-200: NEXT_PUBLIC_SUPABASE_URL missing')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const admin = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : null

    // Prefer service-role so RLS never blocks; anon can fail on profiles in some setups.
    const client = admin ?? supabase
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('subscription_status, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Subscription Status] profile fetch failed, returning nulls', {
        error: profileError.message,
        code: profileError.code,
        userId: user.id,
      })
      return NextResponse.json({
        status: null,
        trial_end: null,
        current_period_end: null,
        hasAccess: false,
      })
    }

    let subscriptionStatus: string | null = profile?.subscription_status ?? null
    let trial_end: number | null = null
    let current_period_end: number | null = null
    let cancel_at_period_end: boolean = false
    const stripe_subscription_id = profile?.stripe_subscription_id ?? null

    const stripe = getStripeClient()

    if (subscriptionStatus && stripe_subscription_id && stripe) {
      try {
        const sub = await stripe.subscriptions.retrieve(stripe_subscription_id, {
          expand: [], // no invoices/payments
        })
        trial_end = sub.trial_end ?? null
        current_period_end = (sub as any).current_period_end ?? null
        cancel_at_period_end = sub.cancel_at_period_end ?? false
      } catch (e) {
        console.error('[Subscription Status] Stripe fetch failed (using DB status)', {
          subscriptionId: stripe_subscription_id,
          err: e instanceof Error ? e.message : e,
        })
        // keep status from DB; trial_end/current_period_end stay null
      }
    }

    if (!subscriptionStatus && stripe_subscription_id && stripe && admin) {
      try {
        const sub = await stripe.subscriptions.retrieve(stripe_subscription_id, {
          expand: [],
        })
        const derived =
          sub.status === 'trialing' ? 'trialing' :
          sub.status === 'active' ? 'active' :
          sub.status === 'past_due' || sub.status === 'unpaid' ? 'past_due' : 'canceled'
        trial_end = sub.trial_end ?? null
        current_period_end = (sub as any).current_period_end ?? null
        cancel_at_period_end = sub.cancel_at_period_end ?? false

        const { error: updateErr } = await admin
          .from('profiles')
          .update({ subscription_status: derived })
          .eq('id', user.id)
        if (updateErr) {
          console.error('[Subscription Status] Non-200: Supabase upsert failed', {
            error: updateErr.message,
            userId: user.id,
          })
          return NextResponse.json(
            { error: 'Failed to save subscription status', details: updateErr.message },
            { status: 500 }
          )
        }
        subscriptionStatus = derived
      } catch (e) {
        console.error('[Subscription Status] Non-200: Stripe fetch for missing status failed', {
          subscriptionId: stripe_subscription_id,
          userId: user.id,
          err: e instanceof Error ? e.message : e,
        })
        return NextResponse.json(
          { error: 'Could not load subscription from Stripe', details: e instanceof Error ? e.message : 'Unknown' },
          { status: 502 }
        )
      }
    }

    const hasAccess = subscriptionStatus != null && HAS_ACCESS_STATUSES.includes(subscriptionStatus)
    const trial_end_display =
      subscriptionStatus === 'trialing' && trial_end
        ? new Date(trial_end * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null
    return NextResponse.json({
      status: subscriptionStatus,
      trial_end,
      current_period_end,
      hasAccess,
      trial_end_display,
      cancel_at_period_end,
      stripe_subscription_id,
    })
  } catch (err) {
    console.error('[Subscription Status] Non-200: unexpected error', {
      err: err instanceof Error ? err.message : err,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
