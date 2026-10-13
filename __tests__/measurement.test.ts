import { describe, it, expect, vi, beforeEach } from 'vitest'
const capture = vi.hoisted(() => vi.fn())
vi.mock('posthog-js', () => ({default:{capture}}))
import { resolveAttribution, measurementContext, campaignUrl, captureSample, ATTRIBUTION_KEY, QA_KEY } from '../src/lib/analytics/measurement'
function storage() { const data=new Map<string,string>(); return {getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)} }
beforeEach(()=>{
 vi.clearAllMocks()
 vi.stubGlobal('sessionStorage',storage());vi.stubGlobal('localStorage',storage())
 vi.stubGlobal('window',{location:{href:'https://forgenursing.com/?utm_source=instagram&utm_medium=social&utm_campaign=q05-ppe',search:'?utm_source=instagram&utm_medium=social&utm_campaign=q05-ppe',hostname:'forgenursing.com',origin:'https://forgenursing.com'}})
})
describe('reel attribution and QA',()=>{
 it('preserves tagged arrivals through untagged quiz navigation and signup',()=>{
  measurementContext()
  window.location.href='https://forgenursing.com/answer-trap-check'; window.location.search=''
  expect(measurementContext()).toMatchObject({utm_source:'instagram',utm_campaign:'q05-ppe',landing_page:'/'})
  expect(campaignUrl('/signup?plan=annual')).toContain('plan=annual')
  expect(campaignUrl('/signup')).toContain('utm_campaign=q05-ppe')
 })
 it('replaces attribution for a new tagged arrival without retaining an old reel',()=>{
  expect(resolveAttribution({utm_source:'instagram',utm_campaign:'old'},'https://forgenursing.com/?utm_source=facebook')).toEqual({utm_source:'facebook',landing_page:'/'})
 })
 it('leaves direct arrivals untagged',()=>{expect(resolveAttribution({},'https://forgenursing.com/')).toEqual({landing_page:'/'})})
 it('persists a QA device marker and supports clearing it',()=>{
  window.location.search='?qa=1'; expect(measurementContext().is_qa).toBe(true)
  window.location.search=''; expect(measurementContext().is_qa).toBe(true)
  window.location.search='?qa=0'; expect(measurementContext().is_qa).toBe(false)
 })
 it('deduplicates logical answers and separates original from retry',()=>{
  captureSample('question_answered',{attempt:1},'test-original')
  captureSample('question_answered',{attempt:1},'test-original')
  captureSample('question_answered',{attempt:2},'test-retry')
  expect(capture).toHaveBeenCalledTimes(2)
  expect(capture.mock.calls[1][1]).toMatchObject({attempt:2,experience:'free_sample',utm_source:'instagram'})
 })
})
