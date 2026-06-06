'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

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

function getSignupTrackingContext() {
  if (typeof window === 'undefined') return {}

  return {
    path: window.location.pathname,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    is_mobile_viewport: window.innerWidth < 768,
  }
}

async function identifyPostHogUser(supabase: any, user: User) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed,onboarding_skipped,onboarding_step,subscription_status,trial_ends_at,is_beta,beta_expires_at,default_entry_path,quiz_first_enabled')
    .eq('id', user.id)
    .single()

  const personProperties = {
    email: user.email,
    onboarding_completed: Boolean(profile?.onboarding_completed),
    onboarding_skipped: Boolean(profile?.onboarding_skipped),
    onboarding_step: profile?.onboarding_step ?? 0,
    subscription_status: profile?.subscription_status ?? null,
    trial_ends_at: profile?.trial_ends_at ?? null,
    is_beta: Boolean(profile?.is_beta),
    beta_expires_at: profile?.beta_expires_at ?? null,
    default_entry_path: profile?.default_entry_path ?? null,
    quiz_first_enabled: Boolean(profile?.quiz_first_enabled),
  }

  posthog.identify(user.id, personProperties)

  if (typeof window !== 'undefined' && profile?.trial_ends_at) {
    const trialEventKey = `forgenursing-trial-started-captured-${user.id}`
    if (!localStorage.getItem(trialEventKey)) {
      localStorage.setItem(trialEventKey, 'true')
      posthog.capture('trial_started', {
        subscription_status: profile.subscription_status ?? null,
        trial_ends_at: profile.trial_ends_at,
        source: 'profile_identify_sync',
      })
    }
  }
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

function SignupFrictionTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/signup') return

    const pageStartedAt = Date.now()
    const focusedFields = new Set<string>()

    posthog.capture('signup_page_viewed', getSignupTrackingContext())

    const trackFieldFocus = (fieldName: string) => {
      if (focusedFields.has(fieldName)) return
      focusedFields.add(fieldName)
      posthog.capture('signup_field_focused', {
        ...getSignupTrackingContext(),
        field_name: fieldName,
        time_on_page_ms: Date.now() - pageStartedAt,
      })
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const testId = target.getAttribute('data-testid')
      if (testId === 'signup-email') trackFieldFocus('email')
      if (testId === 'signup-password') trackFieldFocus('password')
    }

    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null
      if (!target) return

      if (target.type === 'checkbox' && target.required) {
        posthog.capture('signup_terms_checked', {
          ...getSignupTrackingContext(),
          checked: target.checked,
          time_on_page_ms: Date.now() - pageStartedAt,
        })
      }
    }

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null
      const submitButton = form?.querySelector('[data-testid="signup-submit"]')
      if (!submitButton) return

      posthog.capture('signup_submitted', {
        ...getSignupTrackingContext(),
        time_on_page_ms: Date.now() - pageStartedAt,
      })
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('change', handleChange)
    document.addEventListener('submit', handleSubmit)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('change', handleChange)
      document.removeEventListener('submit', handleSubmit)
    }
  }, [pathname])

  return null
}

function TutorChipClickGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/tutor') return

    let guardUntil = 0
    let resetTimer: ReturnType<typeof setTimeout> | null = null

    const setChipState = (disabled: boolean) => {
      const chips = Array.from(document.querySelectorAll('button.rounded-full')) as HTMLButtonElement[]
      chips.forEach((chip) => {
        const text = chip.textContent?.trim()
        if (!text || text.length < 8) return

        chip.disabled = disabled
        chip.setAttribute('aria-busy', disabled ? 'true' : 'false')
        chip.style.opacity = disabled ? '0.6' : ''
        chip.style.cursor = disabled ? 'not-allowed' : ''
      })
    }

    const clearGuard = () => {
      guardUntil = 0
      setChipState(false)
      if (resetTimer) {
        clearTimeout(resetTimer)
        resetTimer = null
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button.rounded-full') as HTMLButtonElement | null
      if (!button) return

      const text = button.textContent?.trim()
      if (!text || text.length < 8) return

      const now = Date.now()
      if (now < guardUntil) {
        event.preventDefault()
        event.stopPropagation()
        posthog.capture('tutor_chip_repeat_click_blocked', {
          path: window.location.pathname,
          time_remaining_ms: guardUntil - now,
        })
        return
      }

      guardUntil = now + 12000
      setChipState(true)
      posthog.capture('tutor_chip_click_guard_started', {
        path: window.location.pathname,
      })

      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(clearGuard, 12000)
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      clearGuard()
    }
  }, [pathname])

  return null
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserClient()

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session?.user) {
        identifyPostHogUser(supabase, session.user)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        identifyPostHogUser(supabase, session.user)
        posthog.capture('signup_success', {
          ...getSignupTrackingContext(),
          source: 'auth_state_change',
        })
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <SignupFrictionTracker />
        <TutorChipClickGuard />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
