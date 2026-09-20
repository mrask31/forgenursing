import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { paidInvoiceConversion } from './conversions'
import { captureConversion } from './server'

// Used by both signed Stripe delivery and the existing authenticated retry job.
// This branch only records analytics: it cannot grant/revoke access or charge.
export async function recordInvoicePayment(event: Stripe.Event, supabase: SupabaseClient) {
  const candidate = paidInvoiceConversion(event, 'pending')
  if (!candidate) return { success: true }
  const invoice = event.data.object as Stripe.Invoice
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return { success: false, error: 'Invoice customer unavailable for analytics' }
  const { data: profile, error } = await supabase.from('profiles').select('id')
    .eq('stripe_customer_id', customerId).single()
  // Invoice and checkout events can arrive in either order. Retry until the
  // existing checkout handler has attached the customer to its account.
  if (error || !profile?.id) return { success: false, error: 'Invoice account not linked yet' }
  const success = await captureConversion({ ...candidate, distinct_id: profile.id })
  return success ? { success: true } : { success: false, error: 'Payment analytics delivery unavailable' }
}
