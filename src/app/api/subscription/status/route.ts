import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { hasAccess, isTrialActive } from '@/lib/subscription-access'

function getStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  })
}

export const dynamic = 'force-dynamic'

async function fetchProfileWithOptionalTier(supabase: any, userId: string) {
  const fullSelect = 'subscription_status, stripe_subscription_id, trial_ends_at, is_beta, beta_expires_at, stripe_customer_id, program_level, quiz_first_enabled, default_entry_path, tier_type'
  const fallbackSelect = 'subscription_status, stripe_subscription_id, trial_ends_at, is_beta, beta_expires_at, stripe_customer_id, program_level, quiz_first_enabled, default_entry_path'

  const result = await supabase.from('profiles').select(fullSelect).eq('id', userId).single()
  if (!result.error) return result

  if (result.error.message?.toLowerCase().includes('tier_type')) {
    const fallback = await supabase.from('profiles').select(fallbackSelect).eq('id', userId).single()
    return fallback.error ? fallback : { data: { ...fallback.data, tier_type: null }, error: null }
  }

  return result
}

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })

    const admin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null
    const { data: profile, error: profileError } = await fetchProfileWithOptionalTier(supabase, user.id)

    if (profileError) {
      console.error('[Subscription Status] profile fetch failed, returning nulls', {
        error: profileError.message,
        code: profileError.code,
        userId: user.id,
      })
      return NextResponse.json({
        user_id: user.id,
        email: user.email ?? null,
        status: null,
        trial_end: null,
        current_period_end: null,
        hasAccess: false,
        profile: null,
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
        const sub = await stripe.subscriptions.retrieve(stripe_subscription_id, { expand: [] })
        trial_end = sub.trial_end ?? null
        current_period_end = (sub as any).current_period_end ?? null
        cancel_at_period_end = sub.cancel_at_period_end ?? false
      } catch (e) {
        console.error('[Subscription Status] Stripe fetch failed (using DB status)', {
          subscriptionId: stripe_subscription_id,
          err: e instanceof Error ? e.message : e,
        })
      }
    }

    if (!subscriptionStatus && stripe_subscription_id && stripe && admin) {
      try {
        const sub = await stripe.subscriptions.retrieve(stripe_subscription_id, { expand: [] })
        const derived =
          sub.status === 'trialing' ? 'trialing' :
          sub.status === 'active' ? 'active' :
          sub.status === 'past_due' || sub.status === 'unpaid' ? 'past_due' : 'canceled'
        trial_end = sub.trial_end ?? null
        current_period_end = (sub as any).current_period_end ?? null
        cancel_at_period_end = sub.cancel_at_period_end ?? false

        const { error: updateErr } = await admin.from('profiles').update({ subscription_status: derived }).eq('id', user.id)
        if (updateErr) return NextResponse.json({ error: 'Failed to save subscription status', details: updateErr.message }, { status: 500 })
        subscriptionStatus = derived
      } catch (e) {
        return NextResponse.json({ error: 'Could not load subscription from Stripe', details: e instanceof Error ? e.message : 'Unknown' }, { status: 502 })
      }
    }

    const isOneTimeRetakePass = subscriptionStatus === 'active' && !stripe_subscription_id && profile?.tier_type === 'retake'

    if (isOneTimeRetakePass && !isTrialActive(profile?.trial_ends_at)) {
      subscriptionStatus = 'expired'
      if (admin) {
        const { error: expireErr } = await admin.from('profiles').update({ subscription_status: 'expired' }).eq('id', user.id)
        if (expireErr) console.error('[Subscription Status] Failed to mark one-time retake pass expired', { error: expireErr.message, userId: user.id })
      }
    }

    const userHasAccess = isOneTimeRetakePass
      ? subscriptionStatus === 'active' && isTrialActive(profile?.trial_ends_at)
      : hasAccess(subscriptionStatus, profile?.trial_ends_at, profile?.is_beta, profile?.beta_expires_at)

    const trial_end_display =
      (subscriptionStatus === 'trialing' || isOneTimeRetakePass) && profile?.trial_ends_at
        ? new Date(profile.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null

    return NextResponse.json({
      user_id: user.id,
      email: user.email ?? null,
      status: subscriptionStatus,
      trial_end,
      current_period_end,
      hasAccess: userHasAccess,
      trial_end_display,
      cancel_at_period_end,
      stripe_subscription_id,
      profile: {
        subscription_status: subscriptionStatus,
        trial_ends_at: profile?.trial_ends_at ?? null,
        stripe_customer_id: profile?.stripe_customer_id ?? null,
        stripe_subscription_id,
        is_beta: profile?.is_beta ?? false,
        beta_expires_at: profile?.beta_expires_at ?? null,
        program_level: profile?.program_level ?? null,
        quiz_first_enabled: profile?.quiz_first_enabled ?? false,
        default_entry_path: profile?.default_entry_path ?? null,
        tier_type: profile?.tier_type ?? null,
      },
    })
  } catch (err) {
    console.error('[Subscription Status] Non-200: unexpected error', { err: err instanceof Error ? err.message : err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
