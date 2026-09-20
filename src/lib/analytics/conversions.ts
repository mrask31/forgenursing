import type Stripe from 'stripe'
import type { ConversionEvent } from './server'

export function paidInvoiceConversion(event: Stripe.Event, userId: string): ConversionEvent | null {
  if (event.type !== 'invoice.payment_succeeded' || !event.livemode) return null
  const invoice = event.data.object as Stripe.Invoice
  const subscription = invoice.parent?.subscription_details?.subscription
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id
  if (!subscriptionId || invoice.status !== 'paid' || invoice.amount_paid <= 0) return null
  return {
    event: 'subscription_payment_confirmed',
    distinct_id: userId,
    timestamp: new Date((invoice.status_transitions.paid_at || event.created) * 1000).toISOString(),
    conversion_id: `invoice:${invoice.id}`,
    properties: {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
      amount_paid_minor: invoice.amount_paid,
      currency: invoice.currency,
      billing_reason: invoice.billing_reason,
      is_initial_subscription_invoice: invoice.billing_reason === 'subscription_create',
      livemode: true,
    },
  }
}

export function newTrialConversion(
  user: { id: string; created_at: string },
  profile: { is_beta: boolean | null; trial_ends_at: string | null; subscription_status: string | null; stripe_subscription_id: string | null },
  now = Date.now(),
): ConversionEvent | null {
  const created = Date.parse(user.created_at)
  const expires = Date.parse(profile.trial_ends_at || '')
  // Observe newly provisioned app trials only. Existing beta/paid users and old
  // accounts logging in must not be relabelled as new conversions.
  if (!Number.isFinite(created) || !Number.isFinite(expires) || created > now || now - created > 86400000 ||
    expires <= now || profile.is_beta || profile.stripe_subscription_id || profile.subscription_status === 'active') return null
  return {
    event: 'trial_started',
    distinct_id: user.id,
    timestamp: new Date(created).toISOString(),
    conversion_id: `trial:${user.id}`,
    properties: { access_type: 'app_trial', is_beta: false, trial_ends_at: new Date(expires).toISOString() },
  }
}
