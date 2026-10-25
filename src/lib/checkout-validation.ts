export function isConfiguredCheckoutPrice(priceId: unknown, configured: Array<string | undefined>): priceId is string {
  return typeof priceId === 'string' && priceId.length > 0 && configured.some(value => Boolean(value) && value === priceId)
}

/** Fail closed if environment IDs point to a different offer in Stripe. */
export function matchesStandardOffer(price: {
  active: boolean; currency: string; unit_amount: number | null; type: string;
  recurring: { interval: string; interval_count: number; usage_type: string } | null;
}, interval: 'month' | 'year'): boolean {
  return price.active && price.currency === 'usd' && price.type === 'recurring'
    && price.unit_amount === (interval === 'month' ? 999 : 7900)
    && price.recurring?.interval === interval && price.recurring.interval_count === 1
    && price.recurring.usage_type === 'licensed'
}

export function checkoutSubscriptionStatus(status: string): string {
  if (status === 'active' || status === 'trialing') return status
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (status === 'incomplete') return 'incomplete'
  return 'canceled'
}
