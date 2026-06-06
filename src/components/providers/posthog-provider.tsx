'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: "[name='password'], [type='password']"
    }
  })
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams])

  return null
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserClient()

  useEffect(() => {
    const identifyFromSession = async (session: Session | null) => {
      const user = session?.user
      if (!user) return

      posthog.identify(user.id, { email: user.email })

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed,onboarding_skipped,onboarding_step,subscription_status,trial_ends_at,is_beta,beta_expires_at,default_entry_path,quiz_first_enabled')
          .eq('id', user.id)
          .single()

        if (profile) {
          posthog.capture('profile_lifecycle_synced', {
            onboarding_completed: Boolean(profile.onboarding_completed),
            onboarding_skipped: Boolean(profile.onboarding_skipped),
            onboarding_step: profile.onboarding_step ?? 0,
            subscription_status: profile.subscription_status ?? null,
            trial_ends_at: profile.trial_ends_at ?? null,
            is_beta: Boolean(profile.is_beta),
            beta_expires_at: profile.beta_expires_at ?? null,
            default_entry_path: profile.default_entry_path ?? null,
            quiz_first_enabled: Boolean(profile.quiz_first_enabled),
          })
        }
      } catch {
        posthog.capture('profile_lifecycle_sync_failed')
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      identifyFromSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        identifyFromSession(session)
        posthog.capture('signup_success', { source: 'auth_state_change' })
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
