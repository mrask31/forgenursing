import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
async function account() {
  const db = createClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Please sign in to manage billing.' }, { status: 401 }) }
  const { data: profile, error: profileError } = await db.from('profiles')
    .select('stripe_customer_id,stripe_subscription_id').eq('id', user.id).single()
  if (profileError || !profile) return { error: NextResponse.json({ error: 'Your billing account could not load. Please retry.' }, { status: 503 }) }
  return { profile }
}
function stripeMode() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  return /^(sk|rk)_live_/.test(key) ? 'live' : /^(sk|rk)_test_/.test(key) ? 'test' : 'unknown'
}
function billingErrorCode(error: unknown) {
  const value = error as { code?: string; type?: string } | null
  if (value?.code === 'resource_missing') return 'stripe_resource_missing'
  if (value?.type === 'StripeAuthenticationError') return 'stripe_authentication_failed'
  if (value?.type === 'StripePermissionError') return 'stripe_permission_denied'
  return 'billing_unavailable'
}
function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Billing unavailable')
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
}
export async function GET() {
  try {
    const auth = await account(); if (auth.error) return auth.error
    const profile = auth.profile!
    if (!profile.stripe_customer_id || !profile.stripe_subscription_id) return NextResponse.json({ subscription: null, canManage: Boolean(profile.stripe_customer_id), stripeMode: stripeMode() }, { headers: { 'Cache-Control': 'private, no-store' } })
    const subscription = await stripeClient().subscriptions.retrieve(profile.stripe_subscription_id)
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    if (customerId !== profile.stripe_customer_id) throw new Error('Billing ownership mismatch')
    const item = subscription.items.data[0]
    return NextResponse.json({ canManage: true, stripeMode: stripeMode(), subscription: {
      status: subscription.status, amount: item?.price.unit_amount ?? null,
      currency: item?.price.currency ?? null, interval: item?.price.recurring?.interval ?? null,
      intervalCount: item?.price.recurring?.interval_count ?? null,
      currentPeriodEnd: item?.current_period_end ?? null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    } }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return NextResponse.json({ error: 'Billing details are temporarily unavailable. Please retry or contact support.', stripeMode: stripeMode(), code: billingErrorCode(error) }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } }) }
}
export async function POST() {
  let stage: 'account' | 'return_url' | 'stripe_portal' = 'account'
  try {
    const auth = await account(); if (auth.error) return auth.error
    if (!auth.profile!.stripe_customer_id) return NextResponse.json({ error: 'No Stripe billing account is linked. Contact support if you already paid.' }, { status: 409 })
    // Never accept a client-supplied customer or redirect URL.
    stage = 'return_url'
    const configured = process.env.NEXT_PUBLIC_APP_URL
    const base = configured ? new URL(configured.startsWith('http') ? configured : `https://${configured}`) : null
    if (!base || !['http:', 'https:'].includes(base.protocol)) throw new Error('Return URL unavailable')
    stage = 'stripe_portal'
    const session = await stripeClient().billingPortal.sessions.create({ customer: auth.profile!.stripe_customer_id, return_url: new URL('/settings', base).href })
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const code = stage === 'return_url' ? 'billing_return_url_invalid' : billingErrorCode(error)
    return NextResponse.json({ error: 'Billing management could not open. Please retry or contact support.', code, stage, stripeMode: stripeMode() }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
