import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { retakePurchaseEmail, deliverPurchaseEmail, type PurchaseDelivery } from '@/lib/emails/retake-purchase'
const now = Date.parse('2026-10-29T19:00:00Z')
function fixture(options: { failSave?: boolean; failSend?: boolean; refunded?: boolean; preview?: boolean } = {}) {
 const row: PurchaseDelivery = {id:'queue',pass_id:'pass',user_id:'user',email:'fixture@example.invalid',access_until:'2027-01-29T18:54:02Z',status:'pending',first_attempt_at:null,updated_at:'2026-10-29T18:54:02Z',provider_message_id:null,payload:null}
 const requests: unknown[] = []
 const transport = vi.fn(async (_url: unknown, init: any) => { requests.push({body:init.body,key:init.headers['Idempotency-Key']}); if(options.failSend) throw new Error('timeout'); return new Response(JSON.stringify({id:'accepted'})) }) as unknown as typeof fetch
 const admin = { from(table: string) { const filters: [string,unknown][]=[]; let update: any; const q: any={select:()=>q,eq:(k:string,v:unknown)=>{filters.push([k,v]);return q},maybeSingle:()=>q,update:(v:any)=>{update=v;return q},then:(resolve:any,reject:any)=>Promise.resolve().then(()=>{
 if(table==='retake_passes') return {data:{audience:options.preview?'preview':'production',refunded_at:options.refunded?'date':null,access_until:row.access_until},error:null}
 if(!filters.every(([k,v])=>row[k as keyof PurchaseDelivery]===v))return {data:null,error:null}
 if(options.failSave&&update?.status==='sent')return {data:null,error:{message:'receipt failed'}}
 if(update)Object.assign(row,structuredClone(update));return {data:structuredClone(row),error:null}
 }).then(resolve,reject)};return q } } as unknown as SupabaseClient
 return {row,requests,send:(at=now)=>deliverPurchaseEmail(admin,structuredClone(row),{now:at,transport})}
}
describe('purchase email delivery',()=>{
 it('uses the saved expiry, product terms, useful links and no retired features',()=>{const e=retakePurchaseEmail('2027-01-29T18:54:02Z');expect(e.subject).toBe('Your Retake Pass is active');expect(e.text).toContain('January 29, 2027');expect(e.text).toContain('12:54 PM CST');expect(e.text).toContain('No proof is required');expect(e.text).toContain('https://forgenursing.com/settings');expect(e.text).not.toMatch(/upload|subscription|My Courses/i);expect(()=>retakePurchaseEmail('bad')).toThrow()})
 it('claims once during concurrent workers, then suppresses repeat sends',async()=>{const f=fixture();const results=await Promise.all([f.send(),f.send()]);expect(results.filter(x=>x==='sent')).toHaveLength(1);expect(f.requests).toHaveLength(1);expect(await f.send(now+600000)).toBe('skipped')})
 it('retries the same payload/key after a lost database receipt',async()=>{const options={failSave:true};const f=fixture(options);expect(await f.send()).toBe('reconciliation_required');options.failSave=false;expect(await f.send(now+600000)).toBe('sent');expect(f.requests[1]).toEqual(f.requests[0])})
 it('holds uncertain sends after the provider deduplication window',async()=>{const f=fixture({failSend:true});expect(await f.send()).toBe('failed');expect(await f.send(now+23*3600000)).toBe('reconciliation_required');expect(f.requests).toHaveLength(1);expect(f.row.status).toBe('reconciliation_required')})
 it.each([{refunded:true},{preview:true}])('suppresses ineligible pass %j',async options=>{const f=fixture(options);expect(await f.send()).toBe('skipped');expect(f.requests).toHaveLength(0)})
})
