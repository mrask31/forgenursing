import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  updateStripe: vi.fn(), updateProfile: vi.fn(), getUser: vi.fn(),
}))
vi.mock('next/headers', () => ({ cookies: () => ({ get: vi.fn() }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({
      data: { stripe_subscription_id: 'sub_test' }, error: null,
    }) }) }) }),
  }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ update: mocks.updateProfile }) }),
}))
vi.mock('stripe', () => ({ default: class Stripe {
  subscriptions = { update: mocks.updateStripe }
  static errors = { StripeError: class extends Error {} }
} }))

import { POST } from '../src/app/api/stripe/cancel-subscription/route'

describe('subscription cancellation access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_SECRET_KEY', 'unit-test-placeholder')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'unit-test-placeholder')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.invalid')
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'qa-owner' } }, error: null })
    mocks.updateProfile.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  })
  afterEach(() => vi.unstubAllEnvs())

  it.each(['active', 'trialing'])('preserves %s while cancellation is scheduled', async status => {
    mocks.updateStripe.mockResolvedValue({ status, cancel_at_period_end: true })
    const response = await POST(new Request('https://example.invalid/api/stripe/cancel-subscription', { method: 'POST' }))
    expect(response.status).toBe(200)
    expect(mocks.updateStripe).toHaveBeenCalledWith('sub_test', { cancel_at_period_end: true })
    expect(mocks.updateProfile).toHaveBeenCalledWith({ subscription_status: status })
  })
  it('does not grant access when Stripe reports the subscription has ended', async () => {
    mocks.updateStripe.mockResolvedValue({ status: 'canceled', cancel_at_period_end: false })
    await POST(new Request('https://example.invalid/api/stripe/cancel-subscription', { method: 'POST' }))
    expect(mocks.updateProfile).toHaveBeenCalledWith({ subscription_status: 'canceled' })
  })
})
