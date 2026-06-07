'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

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
  const supabase = getBrowserClient()

  useEffect(() => {
    const identifySession = (session: Session | null) => {
      const userId = session?.user?.id
      if (userId) {
        posthog.identify(userId)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      identifySession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        identifySession(session)
      }

      if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
