import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), entitlement: vi.fn(), admin: vi.fn() }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('404') }, redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/entitlement', () => ({ getEntitlementForUser: mocks.entitlement }))
vi.mock('@/lib/learning/server', () => ({ learningAdmin: mocks.admin }))
vi.mock('@/lib/learning/source-checked-server', () => ({ sourceCheckedContent: vi.fn() }))
vi.mock('@/app/(app)/preview/bank/[familyId]/BankPreviewClient', () => ({ default: () => null }))
import Page from '@/app/(app)/preview/bank/[familyId]/page'

describe('staging bank access', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('VERCEL_ENV', 'preview') })
  afterEach(() => vi.unstubAllEnvs())
  it('does not expose answers on production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(Page({ params: { familyId: 'qb1-d02' } })).rejects.toThrow('404')
    expect(mocks.getUser).not.toHaveBeenCalled(); expect(mocks.admin).not.toHaveBeenCalled()
  })
  it('requires sign in before reading the bank', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    await expect(Page({ params: { familyId: 'qb1-d02' } })).rejects.toThrow('redirect:/login')
    expect(mocks.admin).not.toHaveBeenCalled()
  })
  it('rejects accounts without study access before reading answers', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'qa' } } }); mocks.entitlement.mockResolvedValue({ hasAccess: false })
    await expect(Page({ params: { familyId: 'qb1-d02' } })).rejects.toThrow('redirect:/pricing')
    expect(mocks.admin).not.toHaveBeenCalled()
  })
  it('allows an entitled trial account to reach the preview lookup', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'qa' } } }); mocks.entitlement.mockResolvedValue({ hasAccess: true })
    const query: any = {}; for (const method of ['select','eq','order','limit']) query[method] = vi.fn(() => query)
    query.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    mocks.admin.mockReturnValue({ from: vi.fn(() => query) })
    await expect(Page({ params: { familyId: 'missing' } })).rejects.toThrow('404')
    expect(query.eq).toHaveBeenCalledWith('audience', 'preview')
    expect(mocks.entitlement).toHaveBeenCalledWith('qa')
  })
})
