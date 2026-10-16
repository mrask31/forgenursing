import { describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncSubscriptionEvent } from '../src/lib/stripe-subscription-sync'

function fixture(status: string, linkedSubscription: string | null = 'sub_qa') {
  let row: { id: string; stripe_subscription_id: string | null } | null = {
    id: 'qa-user', stripe_subscription_id: linkedSubscription,
  }
  const filters: unknown[][] = []
  const update = vi.fn()
  const write = {
    eq: (...args: unknown[]) => { filters.push(args); return write },
    is: (...args: unknown[]) => { filters.push(args); return write },
    then: (resolve: (value: { error: null }) => unknown) => Promise.resolve(resolve({ error: null })),
  }
  const db = { from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: row, error: null }) }) }),
    update: (value: unknown) => { update(value); return write },
  }) } as unknown as SupabaseClient
  const retrieve = vi.fn().mockResolvedValue({ id: 'sub_qa', customer: 'cus_qa', status })
  const stripe = { subscriptions: { retrieve } } as unknown as Pick<Stripe, 'subscriptions'>
  return { db, stripe, retrieve, update, filters, unlink: () => { row = null } }
}

describe('subscription event reconciliation', () => {
  it('keeps a canceled subscription expired when an earlier active event is retried', async () => {
    const f = fixture('canceled')
    expect(await syncSubscriptionEvent('sub_qa', f.db, f.stripe)).toEqual({ success: true })
    expect(f.retrieve).toHaveBeenCalledWith('sub_qa')
    expect(f.update).toHaveBeenCalledWith({ subscription_status: 'expired', stripe_subscription_id: 'sub_qa' })
  })
  it('uses the current active status when a stale past-due event arrives', async () => {
    const f = fixture('active')
    await syncSubscriptionEvent('sub_qa', f.db, f.stripe)
    expect(f.update).toHaveBeenCalledWith(expect.objectContaining({ subscription_status: 'active', quiz_first_enabled: true }))
  })
  it('does not let an old subscription replace the current subscription', async () => {
    const f = fixture('canceled', 'sub_replacement')
    expect(await syncSubscriptionEvent('sub_qa', f.db, f.stripe)).toEqual({ success: true })
    expect(f.update).not.toHaveBeenCalled()
  })
  it('returns a retryable failure if checkout has not linked a profile yet', async () => {
    const f = fixture('active'); f.unlink()
    expect((await syncSubscriptionEvent('sub_qa', f.db, f.stripe)).success).toBe(false)
    expect(f.update).not.toHaveBeenCalled()
  })
  it('guards the write against concurrent relinking and keeps unpaid access blocked', async () => {
    const f = fixture('unpaid')
    await syncSubscriptionEvent('sub_qa', f.db, f.stripe)
    expect(f.filters).toEqual([['id', 'qa-user'], ['stripe_customer_id', 'cus_qa'], ['stripe_subscription_id', 'sub_qa']])
    expect(f.update).toHaveBeenCalledWith(expect.objectContaining({ subscription_status: 'past_due' }))
  })
  it('does not apply an event snapshot if retrieving current Stripe state fails', async () => {
    const f = fixture('active'); f.retrieve.mockRejectedValue(new Error('Stripe unavailable'))
    await expect(syncSubscriptionEvent('sub_qa', f.db, f.stripe)).rejects.toThrow('Stripe unavailable')
    expect(f.update).not.toHaveBeenCalled()
  })
})
