import { afterEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import { newTrialConversion, paidInvoiceConversion } from '../src/lib/analytics/conversions'
import { captureConversion, conversionUuid } from '../src/lib/analytics/server'
import { syncAnalyticsIdentity } from '../src/lib/analytics/identity'
import { recordInvoicePayment } from '../src/lib/analytics/stripe-payment'

const now = Date.parse('2026-09-20T12:00:00Z')
const user = { id: 'user-a', created_at: '2026-09-20T11:00:00Z' }
const trial = { is_beta: false, trial_ends_at: '2026-09-27T11:00:00Z', subscription_status: 'trialing', stripe_subscription_id: null }
const invoiceEvent = (changes = {}, eventChanges = {}) => ({
  id: 'evt_1', type: 'invoice.payment_succeeded', livemode: true, created: now / 1000,
  data: { object: { id: 'in_1', customer: 'cus_1', status: 'paid', amount_paid: 999, currency: 'usd', billing_reason: 'subscription_create',
    parent: { subscription_details: { subscription: 'sub_1' } }, status_transitions: { paid_at: now / 1000 }, ...changes } }, ...eventChanges,
}) as unknown as Stripe.Event

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('verified conversions', () => {
  it('uses actual payment amount and a stable invoice identity across deliveries', () => {
    const original = paidInvoiceConversion(invoiceEvent(), user.id)!
    const retry = paidInvoiceConversion(invoiceEvent({}, { id: 'evt_duplicate', created: now / 1000 + 60 }), user.id)!
    expect(retry).toEqual(original)
    expect(original.properties.amount_paid_minor).toBe(999)
    expect(original.properties.is_initial_subscription_invoice).toBe(true)
    expect(conversionUuid(original.conversion_id)).toBe(conversionUuid(retry.conversion_id))
  })
  it.each([
    [{ status: 'open' }, {}], [{ amount_paid: 0 }, {}], [{ parent: null }, {}],
    [{}, { livemode: false }], [{}, { type: 'invoice.payment_failed' }], [{}, { type: 'checkout.session.completed' }],
  ])('does not count unpaid, free, non-subscription, test or unrelated events (%j)', (invoice, event) => {
    expect(paidInvoiceConversion(invoiceEvent(invoice, event), user.id)).toBeNull()
  })
  it('separates renewals from initial invoices', () => {
    expect(paidInvoiceConversion(invoiceEvent({ billing_reason: 'subscription_cycle' }), user.id)?.properties.is_initial_subscription_invoice).toBe(false)
  })
  it('records new trials at their original creation time, never login time', () => {
    expect(newTrialConversion(user, trial, now)?.timestamp).toBe(user.created_at.replace('Z', '.000Z'))
    expect(newTrialConversion(user, trial, now)).toEqual(newTrialConversion(user, trial, now + 60000))
  })
  it('excludes beta, paid, expired, missing-trial and old accounts', () => {
    for (const profile of [{ ...trial, is_beta: true }, { ...trial, subscription_status: 'active' }, { ...trial, stripe_subscription_id: 'sub_1' },
      { ...trial, trial_ends_at: null }, { ...trial, trial_ends_at: '2026-09-19T11:00:00Z' }]) {
      expect(newTrialConversion(user, profile, now)).toBeNull()
    }
    expect(newTrialConversion({ ...user, created_at: '2026-08-20T11:00:00Z' }, trial, now)).toBeNull()
  })
  it('does not merge different signed-in users on a shared browser', () => {
    const analytics = { get_distinct_id: () => 'user-a', identify: vi.fn(), reset: vi.fn() }
    expect(syncAnalyticsIdentity(analytics, 'user-b', 'user-a')).toBe('user-b')
    expect(analytics.reset).toHaveBeenCalledOnce()
    expect(analytics.identify).toHaveBeenCalledWith('user-b')
    expect(analytics.reset.mock.invocationCallOrder[0]).toBeLessThan(analytics.identify.mock.invocationCallOrder[0])
  })
  it('preserves anonymous attribution and clears identity on logout', () => {
    const analytics = { get_distinct_id: () => 'anonymous', identify: vi.fn(), reset: vi.fn() }
    syncAnalyticsIdentity(analytics, 'user-a', null)
    expect(analytics.reset).not.toHaveBeenCalled()
    syncAnalyticsIdentity(analytics, null, 'user-a')
    expect(analytics.reset).toHaveBeenCalledOnce()
  })
  it('retries invoice analytics if the checkout customer mapping has not arrived', async () => {
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }
    const database = { from: vi.fn(() => chain) }
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    const result = await recordInvoicePayment(invoiceEvent(), database as never)
    expect(result.success).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('sends verified payment under the mapped account and retries analytics failures', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: user.id } }) }
    const database = { from: vi.fn(() => chain) }
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetcher)
    expect((await recordInvoicePayment(invoiceEvent(), database as never)).success).toBe(false)
    expect((await recordInvoicePayment(invoiceEvent(), database as never)).success).toBe(true)
    const firstBody = JSON.parse(fetcher.mock.calls[0][1].body)
    expect(firstBody.distinct_id).toBe(user.id)
    expect(firstBody).toEqual(JSON.parse(fetcher.mock.calls[1][1].body))
    expect(JSON.stringify(firstBody)).not.toContain('email')
  })
  it('isolates transport failures instead of throwing into auth', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await captureConversion(newTrialConversion(user, trial, now)!)).toBe(false)
  })
})
