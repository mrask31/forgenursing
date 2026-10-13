import posthog from 'posthog-js'

export const ATTRIBUTION_KEY = 'forgenursing-attribution-v1'
export const QA_KEY = 'forgenursing-qa-device'
const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
export type Attribution = Partial<Record<typeof campaignKeys[number], string>> & { landing_page?: string }

export function resolveAttribution(previous: Attribution, url: string): Attribution {
  const current = new URL(url)
  const incoming: Attribution = {}
  for (const key of campaignKeys) {
    const value = current.searchParams.get(key)
    if (value) incoming[key] = value.slice(0, 200)
  }
  // A newly tagged arrival replaces the prior campaign; untagged internal navigation preserves it.
  if (incoming.utm_source || incoming.utm_campaign) return { ...incoming, landing_page: current.pathname }
  return { ...previous, landing_page: previous.landing_page || current.pathname }
}

export function measurementContext(): Record<string, string | boolean | number> {
  if (typeof window === 'undefined') return {}
  let attribution: Attribution = {}
  let isQa = false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('qa') === '1') localStorage.setItem(QA_KEY, '1')
    if (params.get('qa') === '0') localStorage.removeItem(QA_KEY)
    isQa = localStorage.getItem(QA_KEY) === '1'
    attribution = resolveAttribution(JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || '{}'), window.location.href)
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution))
  } catch {
    attribution = resolveAttribution({}, window.location.href)
    isQa = new URLSearchParams(window.location.search).get('qa') === '1'
  }
  return { ...attribution, measurement_version: 1, is_qa: isQa, site_host: window.location.hostname }
}

export function campaignUrl(path: string): string {
  if (typeof window === 'undefined') return path
  const url = new URL(path, window.location.origin)
  const context = measurementContext()
  for (const key of campaignKeys) if (typeof context[key] === 'string') url.searchParams.set(key, context[key] as string)
  return url.pathname + url.search
}

const sent = new Set<string>()
export function captureSample(event: string, properties: Record<string, unknown> = {}, onceKey?: string) {
  if (onceKey && sent.has(onceKey)) return
  try {
    posthog.capture(event, { ...measurementContext(), experience: 'free_sample', ...properties })
    if (onceKey) sent.add(onceKey)
  } catch { /* Measurement never blocks practice or signup. */ }
}
