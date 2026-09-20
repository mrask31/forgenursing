'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/client'
import { syncAnalyticsIdentity } from '@/lib/analytics/identity'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    session_recording: {
      maskAllInputs: true,
    },
  })
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    let previousUserId: string | null = null
    // Persisted PostHog identity can outlive an expired Supabase session.
    const persistedId = posthog.get_distinct_id()
    if (posthog.get_property('$user_id') === persistedId) previousUserId = persistedId
    let trackedUserId: string | null = null
    const { data: { subscription } } = getBrowserClient().auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const userId = session?.user.id || null
      try {
        previousUserId = syncAnalyticsIdentity(posthog, userId, previousUserId)
      } catch {
        return // Analytics must never interrupt auth notifications.
      }
      if (!userId) trackedUserId = null
      if (userId && trackedUserId !== userId) {
        trackedUserId = userId
        // Don't await Supabase work inside its auth callback. Analytics never
        // delays navigation or alters access; server verifies the trial.
        void fetch('/api/analytics/trial', { method: 'POST', keepalive: true }).then(response => {
          if (!response.ok && trackedUserId === userId) trackedUserId = null
        }).catch(() => { if (trackedUserId === userId) trackedUserId = null })
      }
    })
    return () => subscription.unsubscribe()
  }, [])
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
