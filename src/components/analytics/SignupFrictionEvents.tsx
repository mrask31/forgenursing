'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

function context() {
  return {
    path: window.location.pathname,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    is_mobile_viewport: window.innerWidth < 768,
    referrer: document.referrer || null,
  }
}

export function SignupFrictionEvents() {
  useEffect(() => {
    if (window.location.pathname !== '/signup') return

    const startedAt = Date.now()
    const focusedFields = new Set<string>()

    posthog.capture('signup_page_viewed', context())

    const trackFocus = (fieldName: string) => {
      if (focusedFields.has(fieldName)) return
      focusedFields.add(fieldName)
      posthog.capture('signup_field_focused', {
        ...context(),
        field_name: fieldName,
        time_on_page_ms: Date.now() - startedAt,
      })
    }

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      const testId = target?.getAttribute('data-testid')
      if (testId === 'signup-email') trackFocus('email')
      if (testId === 'signup-password') trackFocus('password')
    }

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null
      if (!form?.querySelector('[data-testid="signup-submit"]')) return

      posthog.capture('signup_submitted', {
        ...context(),
        time_on_page_ms: Date.now() - startedAt,
      })
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('submit', onSubmit)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('submit', onSubmit)
    }
  }, [])

  return null
}
