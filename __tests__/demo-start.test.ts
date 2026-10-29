import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DEMO_LESSONS } from '../src/lib/demo-lessons'
const mocks = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.create }))
import { POST } from '../src/app/api/answer-trap-check/start/route'
function setup(missing = false) {
  const rate: any = { select: vi.fn(), eq: vi.fn(), gte: vi.fn().mockResolvedValue({count:0}) }
  rate.select.mockReturnValue(rate); rate.eq.mockReturnValue(rate)
  const bank: any = {select: vi.fn(), eq: vi.fn(), in: vi.fn().mockResolvedValue({data: missing ? [] : DEMO_LESSONS.map(l=>({id:l.demoId,question_stem:l.sourceStem}))})}
  bank.select.mockReturnValue(bank); bank.eq.mockReturnValue(bank)
  const session: any = {insert:vi.fn(),select:vi.fn(),single:vi.fn().mockResolvedValue({data:{id:'session'}})}
  session.insert.mockReturnValue(session);session.select.mockReturnValue(session)
  mocks.create.mockReturnValue({from:vi.fn().mockReturnValueOnce(rate).mockReturnValueOnce(bank).mockReturnValueOnce(session)})
  return {bank,session}
}
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only')})
describe('rotated demo start',()=>{
  it('queries stable IDs, safely serves three distinct questions without answer keys',async()=>{
    const {bank,session}=setup()
    const response=await POST(new NextRequest('https://example.test/api/answer-trap-check/start',{method:'POST'}))
    expect(response.status).toBe(200)
    expect(bank.in).toHaveBeenCalledWith('id',DEMO_LESSONS.map(l=>l.demoId))
    const data=await response.json()
    expect(data.questions).toHaveLength(3)
    expect(new Set(data.questions.map((q:any)=>q.id)).size).toBe(3)
    for(const q of data.questions) expect(Object.keys(q).sort()).toEqual(['id','options','question_index','question_stem'])
    expect(session.insert).toHaveBeenCalledOnce()
  })
  it('does not create a partial session if seeded rows are missing',async()=>{
    const {session}=setup(true)
    expect((await POST(new NextRequest('https://example.test/api/answer-trap-check/start',{method:'POST'}))).status).toBe(503)
    expect(session.insert).not.toHaveBeenCalled()
  })
})
