import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('../src/lib/analytics/measurement', () => ({ measurementContext: vi.fn(() => ({ is_qa: false })) }))
import { measurementContext } from '../src/lib/analytics/measurement'
import { ga4Conversion, GA4_MEASUREMENT_ID, trackPassPurchase, trackPassCheckout } from '../src/lib/analytics/ga4-conversions'
let store: Map<string,string>
let target: { location: { hostname: string }; localStorage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> }; gtag: ReturnType<typeof vi.fn>; forgeGa4Ready: boolean }
beforeEach(() => {
  store = new Map()
  target = { location: { hostname: 'forgenursing.com' }, localStorage: { getItem: vi.fn(k => store.get(k)), setItem: vi.fn((k,v) => store.set(k,v)) }, gtag: vi.fn(), forgeGa4Ready: true }
  vi.stubGlobal('window', target)
  vi.mocked(measurementContext).mockReturnValue({ is_qa: false })
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
it('queues only a confirmed live receipt, with Stripe intent, amount/currency and item', () => {
  expect(trackPassPurchase({ transaction_id: 'pi_confirmed123', value: 29.99, currency: 'USD', livemode: true })).toBe(true)
  expect(target.gtag).toHaveBeenCalledWith('event','purchase',expect.objectContaining({transaction_id:'pi_confirmed123',value:29.99,currency:'USD',send_to:GA4_MEASUREMENT_ID,items:[expect.objectContaining({item_id:'retake_pass_v1',quantity:1})]}))
  expect(trackPassPurchase({ transaction_id: 'pi_confirmed123', value: 29.99, currency: 'USD', livemode: true })).toBe(false)
  expect(target.gtag).toHaveBeenCalledTimes(1)
})
it.each([
  null, {}, { transaction_id:'cs_unconfirmed',value:29.99,currency:'USD',livemode:true },
  { transaction_id:'pi_test',value:29.99,currency:'USD',livemode:false },
  { transaction_id:'pi_badamount',value:2999,currency:'USD',livemode:true },
])('does not turn invalid/sandbox receipts into live revenue: %j', receipt => {
  expect(trackPassPurchase(receipt)).toBe(false); expect(target.gtag).not.toHaveBeenCalled()
})
it('suppresses QA and preview conversion events', () => {
  vi.mocked(measurementContext).mockReturnValue({ is_qa:true })
  expect(ga4Conversion('sign_up',{method:'email'},'qa')).toBe(false)
  vi.mocked(measurementContext).mockReturnValue({ is_qa:false })
  target.location.hostname='forgenursing-preview.vercel.app'
  expect(ga4Conversion('sign_up',{method:'email'},'preview')).toBe(false)
  expect(target.gtag).not.toHaveBeenCalled()
})
it('does not require dataLayer to have been initialized by GTM; disables its own page view', () => {
  delete (target as Partial<typeof target>).gtag
  target.forgeGa4Ready=false
  const append=vi.fn()
  vi.stubGlobal('document',{querySelector:()=>null,createElement:()=>({}),head:{appendChild:append}})
  expect(ga4Conversion('sign_up',{method:'email'},'new-account')).toBe(true)
  const commands=(target as unknown as {dataLayer: IArguments[]}).dataLayer.map(v=>Array.from(v))
  expect(commands[1]).toEqual(['config',GA4_MEASUREMENT_ID,{send_page_view:false}])
  expect(commands[2]).toEqual(['event','sign_up',expect.objectContaining({method:'email'})])
  expect(append).toHaveBeenCalledTimes(1)
})
it('uses persistent purchase guard on a repeated page visit', () => {
  store.set('forgenursing:ga4:purchase:pi_stored','1')
  expect(trackPassPurchase({ transaction_id:'pi_stored',value:29.99,currency:'USD',livemode:true })).toBe(false)
  expect(target.gtag).not.toHaveBeenCalled()
})
it('analytics storage failures cannot interrupt paid access', () => {
  target.localStorage.getItem.mockImplementation(()=>{throw Error('blocked')})
  target.localStorage.setItem.mockImplementation(()=>{throw Error('blocked')})
  expect(trackPassPurchase({ transaction_id:'pi_storageblocked',value:29.99,currency:'USD',livemode:true })).toBe(true)
})
it('checkout waits at most 800ms and never treats opening checkout as purchase', async () => {
  vi.useFakeTimers()
  const queued=trackPassCheckout('cs_live_abc')
  expect(target.gtag).toHaveBeenCalledWith('event','begin_checkout',expect.objectContaining({value:29.99,currency:'USD'}))
  await vi.advanceTimersByTimeAsync(800); await queued
  expect(target.gtag).toHaveBeenCalledTimes(1)
})
