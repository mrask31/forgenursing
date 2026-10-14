import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({ parentOwned: true, filters: [] as unknown[][] }))
vi.mock('@/lib/entitlement', () => ({ getEntitlementForUser: async () => ({ hasAccess: true }) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) },
  from: (table: string) => {
    const filters: unknown[][] = []
    const q: any = {
      select: () => q,
      eq: (...args: unknown[]) => { filters.push(args); state.filters.push(args); return q },
      not: () => q, lt: () => q,
      single: async () => ({ data: { id: 'retry', total_questions: 1 }, error: null }),
      order: async () => ({ data: [{ id: 'retry-question', source_question_id: 'original-question' }], error: null }),
      maybeSingle: async () => ({ data: table === 'quiz_questions'
        ? { session_id: 'original-session' }
        : state.parentOwned && filters.some(f => f[0] === 'user_id' && f[1] === 'owner') ? { id: 'original-session' } : null, error: null }),
    }
    return q
  },
}) }))
import { GET } from '../src/app/api/quiz/results/route'
beforeEach(() => { state.parentOwned = true; state.filters = [] })
describe('resumed retry navigation', () => {
  it('recovers the original session from persisted lineage', async () => {
    const response = await GET(new NextRequest('http://localhost/api/quiz/results?sessionId=retry'))
    expect(await response.json()).toMatchObject({ parent_session_id: 'original-session' })
  })
  it('does not expose a parent session owned by somebody else', async () => {
    state.parentOwned = false
    const response = await GET(new NextRequest('http://localhost/api/quiz/results?sessionId=retry'))
    expect(await response.json()).toMatchObject({ parent_session_id: null })
    expect(state.filters).toContainEqual(['user_id', 'owner'])
  })
})
