import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

// Snapshot events can be delivered or retried after later subscription changes.
// Reconcile from Stripe's current object instead of replaying the old status.
export async function syncSubscriptionEvent(
  subscriptionId: string,
  supabase: SupabaseClient,
  stripe: Pick<Stripe, 'subscriptions'>
): Promise<{ success: boolean; error?: string }> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer : subscription.customer.id
  const { data: profile, error } = await supabase.from('profiles')
    .select('id, stripe_subscription_id').eq('stripe_customer_id', customerId).single()
  if (error || !profile) {
    // Checkout may not have linked the profile yet. Return a retryable failure.
    return { success: false, error: error?.message || `No profile found for customer: ${customerId}` }
  }
  // A replacement checkout owns the new subscription; an old event must not
  // overwrite it even when both subscriptions belong to the same customer.
  if (profile.stripe_subscription_id && profile.stripe_subscription_id !== subscriptionId) {
    return { success: true }
  }
  const status = subscription.status === 'active' || subscription.status === 'trialing'
    ? subscription.status
    : subscription.status === 'past_due' || subscription.status === 'unpaid' ? 'past_due' : 'expired'
  const update = {
    subscription_status: status,
    stripe_subscription_id: subscriptionId,
    ...(status === 'active' || status === 'trialing' ? { quiz_first_enabled: true } : {}),
  }
  let query = supabase.from('profiles').update(update)
    .eq('id', profile.id).eq('stripe_customer_id', customerId)
  // Preserve a replacement or fixture cleanup that happened after the read.
  query = profile.stripe_subscription_id
    ? query.eq('stripe_subscription_id', profile.stripe_subscription_id)
    : query.is('stripe_subscription_id', null)
  const { error: updateError } = await query
  return updateError ? { success: false, error: updateError.message } : { success: true }
}
