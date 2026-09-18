export function isConfiguredCheckoutPrice(priceId: unknown, configured: Array<string | undefined>): priceId is string {
  return typeof priceId === 'string' && priceId.length > 0 && configured.some(value => Boolean(value) && value === priceId)
}

export function checkoutSubscriptionStatus(status: string): string {
  if (status === 'active' || status === 'trialing') return status
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (status === 'incomplete') return 'incomplete'
  return 'canceled'
}
