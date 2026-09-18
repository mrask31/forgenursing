import { describe, expect, it } from 'vitest'
import { checkoutSubscriptionStatus, isConfiguredCheckoutPrice } from '../src/lib/checkout-validation'
import { hasAccess } from '../src/lib/subscription-access'

describe('checkout authorization', () => {
  it('allows offered plans without requiring a retired semester plan', () => {
    expect(isConfiguredCheckoutPrice('monthly', ['monthly', undefined, 'annual'])).toBe(true)
    expect(isConfiguredCheckoutPrice('annual', ['monthly', undefined, 'annual'])).toBe(true)
  })
  it('rejects arbitrary, founder, missing, and non-string client prices', () => {
    for (const value of ['foreign', 'founder', '', undefined, {}, 123]) {
      expect(isConfiguredCheckoutPrice(value, ['monthly', undefined, 'annual'])).toBe(false)
    }
  })
  it('does not grant study access for incomplete, unpaid, or canceled checkout subscriptions', () => {
    for (const status of ['incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'canceled', 'paused']) {
      expect(hasAccess(checkoutSubscriptionStatus(status), null, false, null)).toBe(false)
    }
    expect(hasAccess(checkoutSubscriptionStatus('active'), null, false, null)).toBe(true)
  })
})
