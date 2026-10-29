import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hasPurchasedRetakePass } from '../src/lib/emails/retake-pass-eligibility'
import { buildTrialPayload } from '../src/lib/emails/trial-engagement'

describe('Retake Pass trial email suppression', () => {
  function client(data: unknown, error: unknown = null) {
    const q = { select: vi.fn(), eq: vi.fn(), limit: vi.fn(async () => ({ data, error })) }
    q.select.mockReturnValue(q); q.eq.mockReturnValue(q)
    const from = vi.fn(() => q)
    return { db: { from } as unknown as SupabaseClient, q, from }
  }
  it('suppresses any production purchase regardless of old profile trial state', async () => {
    const f=client([{id:'pass'}])
    expect(await hasPurchasedRetakePass(f.db,'owner')).toBe(true)
    expect(f.from).toHaveBeenCalledWith('retake_passes')
    expect(f.q.eq.mock.calls).toEqual([['user_id','owner'],['audience','production']])
  })
  it('allows a never-purchased trial user', async () => {
    expect(await hasPurchasedRetakePass(client([]).db,'owner')).toBe(false)
  })
  it('fails closed when paid access cannot be checked', async () => {
    await expect(hasPurchasedRetakePass(client(null,{code:'unavailable'}).db,'owner')).rejects.toThrow('eligibility unavailable')
  })
  it('offers only the nonrenewing pass in the day-five message', () => {
    const message=buildTrialPayload({user_id:'fixture',email:'fixture@example.invalid',trial_ends_at:'2026-11-05T12:00:00Z'},'trial_day_5').text
    expect(message).toContain('$29.99 one-time')
    expect(message).toContain('Nothing auto-renews')
    expect(message).toContain('one free three-month extension')
    expect(message).not.toMatch(/\$9\.99|\$79/)
  })
})
