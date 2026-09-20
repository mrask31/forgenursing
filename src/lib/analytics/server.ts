import { createHash } from 'node:crypto'

export type ConversionEvent = {
  event: string
  distinct_id: string
  timestamp: string
  conversion_id: string
  properties: Record<string, string | number | boolean | null>
}

// Stable UUID and timestamp make retries refer to the same event. Reports should
// count unique conversion_id values (or users), never raw webhook deliveries.
export function conversionUuid(key: string) {
  const bytes = createHash('sha256').update(`forgenursing:${key}`).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x80
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function captureConversion(event: ConversionEvent): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return false
  try {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    const response = await fetch(`${host.replace(/\/$/, '')}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({
        api_key: apiKey,
        event: event.event,
        distinct_id: event.distinct_id,
        timestamp: event.timestamp,
        uuid: conversionUuid(event.conversion_id),
        properties: { ...event.properties, conversion_id: event.conversion_id, source: 'server_verified', $geoip_disable: true },
      }),
    })
    return response.ok
  } catch {
    // No secrets, emails, or payment payloads in analytics logs.
    console.warn('[Analytics] Conversion delivery unavailable')
    return false
  }
}
