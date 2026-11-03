import { measurementContext } from './measurement'

// Keep the existing property/stream. These commands do not depend on GTM
// having a Custom Event trigger for a plain dataLayer object.
export const GA4_MEASUREMENT_ID = 'G-5BYYQ7382S'
type Gtag = (...args: unknown[]) => void
type AnalyticsWindow = Window & { gtag?: Gtag; forgeGa4Ready?: boolean }
const sent = new Set<string>()
function gtag(): Gtag | null {
  if (typeof window === 'undefined') return null
  const target = window as AnalyticsWindow
  target.dataLayer = target.dataLayer || []
  // Google's documented command queue uses an arguments object, not a dataLayer event object.
  // eslint-disable-next-line prefer-rest-params
  target.gtag = target.gtag || function () { target.dataLayer!.push(arguments) }
  if (!target.forgeGa4Ready) {
    target.forgeGa4Ready = true
    target.gtag('js', new Date())
    // GTM continues to own page views. Do not emit a second page_view here.
    target.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false })
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
      document.head.appendChild(script)
    }
  }
  return target.gtag
}
export function ga4Conversion(event: 'sign_up' | 'begin_checkout' | 'purchase', parameters: Record<string, unknown>, key: string): boolean {
  if (typeof window === 'undefined') return false
  // Sandbox, previews and explicit QA sessions never become live revenue.
  const context = measurementContext()
  if (!['forgenursing.com', 'www.forgenursing.com'].includes(window.location.hostname) || context.is_qa) return false
  const storageKey = `forgenursing:ga4:${event}:${key}`
  if (sent.has(storageKey)) return false
  try { if (window.localStorage.getItem(storageKey)) return false } catch { /* GA4 transaction_id remains the purchase dedupe key. */ }
  try {
    const tag = gtag()
    if (!tag) return false
    tag('event', event, { ...parameters, send_to: GA4_MEASUREMENT_ID, transport_type: 'beacon' })
    sent.add(storageKey)
    try { window.localStorage.setItem(storageKey, '1') } catch { /* In-memory guard still applies. */ }
    return true
  } catch { return false } // Analytics must not block account creation or paid access.
}
export const retakePassItem = { item_id: 'retake_pass_v1', item_name: 'ForgeNursing Retake Pass — 3 months', price: 29.99, quantity: 1 }
export function trackPassPurchase(receipt: unknown): boolean {
  const r = receipt as { transaction_id?: unknown; value?: unknown; currency?: unknown; livemode?: unknown } | null
  if (!r || typeof r.transaction_id !== 'string' || !/^pi_[A-Za-z0-9]+$/.test(r.transaction_id)
    || r.value !== 29.99 || r.currency !== 'USD' || r.livemode !== true) return false
  return ga4Conversion('purchase', { transaction_id: r.transaction_id, value: r.value, currency: r.currency, items: [retakePassItem] }, r.transaction_id)
}
/** Give the beacon a short chance to leave before redirecting to Stripe. */
export async function trackPassCheckout(checkoutId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(checkoutId)) return
  await new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, 800)
    const queued = ga4Conversion('begin_checkout', { value: 29.99, currency: 'USD', items: [retakePassItem],
      event_callback: () => { clearTimeout(timeout); resolve() }, event_timeout: 750 }, checkoutId)
    if (!queued) { clearTimeout(timeout); resolve() }
  })
}
