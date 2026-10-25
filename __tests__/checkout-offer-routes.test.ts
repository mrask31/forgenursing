import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn(), user: { id: 'qa-user', email: 'qa@example.test' } as { id: string; email: string } | null, status: 'trialing' }))
vi.mock('stripe', () => ({ default: class { prices = { retrieve: mocks.retrieve }; checkout = { sessions: { create: mocks.create } }; static errors = { StripeError: Error } } }))
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => undefined, set: vi.fn(), delete: vi.fn() }) }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: mocks.user }, error: null }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { subscription_status: mocks.status, is_beta: true }, error: null }) }) }) }) }) }))
import { POST } from '../src/app/api/stripe/checkout/route'
import { POST as retiredFounder } from '../src/app/api/stripe/checkout-founder/route'
const request = (priceId: string) => new Request('https://example.test/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ priceId }) })
beforeEach(() => {
  vi.resetAllMocks(); mocks.user = { id: 'qa-user', email: 'qa@example.test' }; mocks.status = 'trialing'
  vi.stubEnv('STRIPE_SECRET_KEY', 'test-only-placeholder')
  vi.stubEnv('NEXT_PUBLIC_STRIPE_PRICE_MONTHLY', 'price_monthly')
  vi.stubEnv('NEXT_PUBLIC_STRIPE_PRICE_ANNUAL', 'price_annual')
  vi.stubEnv('NEXT_PUBLIC_STRIPE_PRICE_SEMESTER', 'price_retired_semester')
  mocks.retrieve.mockImplementation(async (id: string) => ({ active: true, currency: 'usd', unit_amount: id === 'price_monthly' ? 999 : 7900, type: 'recurring', recurring: { interval: id === 'price_monthly' ? 'month' : 'year', interval_count: 1, usage_type: 'licensed' } }))
  mocks.create.mockResolvedValue({ id: 'cs_test_fixture', url: 'https://example.test/mock-checkout' })
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })
describe('current paid offers', () => {
  it('rejects retired semester and founder prices even when a legacy semester env value remains', async () => {
    for (const price of ['price_retired_semester', 'price_founder', 'price_foreign']) expect((await POST(request(price))).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('allows the two offered plans for an eligible beta account without starting a second trial', async () => {
    for (const price of ['price_monthly', 'price_annual']) {
      expect((await POST(request(price))).status).toBe(200)
      const args = mocks.create.mock.calls.at(-1)![0]
      expect(args).toMatchObject({ mode: 'subscription', line_items: [{ price, quantity: 1 }], client_reference_id: 'qa-user' })
      expect(args.subscription_data?.trial_period_days).toBeUndefined()
    }
  })
  it('does not create checkout for an already-active subscriber', async () => {
    mocks.status = 'active'; expect((await POST(request('price_monthly'))).status).toBe(409)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('requires authentication', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.user = null; expect((await POST(request('price_monthly'))).status).toBe(401)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('retires the legacy founder purchase endpoint without touching subscriptions', async () => {
    expect((await retiredFounder()).status).toBe(410)
    expect(mocks.create).not.toHaveBeenCalled()
  })
})

// Regression: environment IDs alone must never authorize a wrongly priced offer.
describe('advertised price verification', () => {
  it('blocks a configured annual price charging 129 dollars before checkout', async () => {
    mocks.retrieve.mockResolvedValue({ active: true, currency: 'usd', unit_amount: 12900, type: 'recurring', recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed' } })
    expect((await POST(request('price_annual'))).status).toBe(503)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it('blocks annual plans pointing to a monthly, inactive, metered or foreign-currency price', async () => {
    const price = { active: true, currency: 'usd', unit_amount: 7900, type: 'recurring', recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed' } }
    for (const change of [{ active: false }, { currency: 'eur' }, { recurring: { ...price.recurring, interval: 'month' } }, { recurring: { ...price.recurring, usage_type: 'metered' } }, { recurring: { ...price.recurring, interval_count: 2 } }]) {
      mocks.retrieve.mockResolvedValue({ ...price, ...change })
      expect((await POST(request('price_annual'))).status).toBe(503)
    }
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
