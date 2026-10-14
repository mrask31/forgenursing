import posthog from 'posthog-js'
import { measurementContext } from './measurement'
const seen = new Set<string>()
export function captureLoop(event: string, props: Record<string, unknown>, onceKey?: string) {
  const key = onceKey ? `${event}:${onceKey}` : null
  if (key && seen.has(key)) return
  try {
    posthog.capture(event, { ...measurementContext(), loop_version: 2, retry_ui_version: 'retry-first-v2', ...props })
    if (key) seen.add(key)
  } catch { /* Analytics must never block learning. Reports also deduplicate by opportunity/question. */ }
}
