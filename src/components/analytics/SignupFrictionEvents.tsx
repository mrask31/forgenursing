'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const pendingSignupKey = 'forgenursing-pending-signup-submit'

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
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/entry') {
      const pendingSubmittedAt = window.localStorage.getItem(pendingSignupKey)
      if (pendingSubmittedAt) {
        window.localStorage.removeItem(pendingSignupKey)
        posthog.capture('signup_success', {
          ...context(),
          source: 'entry_redirect_after_signup_submit',
          signup_submit_to_entry_ms: Date.now() - Number(pendingSubmittedAt),
        })
      }
    }
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/readiness') return

    const viewedAt = Date.now()
    posthog.capture('judgment_map_viewed', {
      ...context(),
      source: 'readiness_page',
    })

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button')
      if (!button) return

      const label = button.textContent?.trim().replace(/\s+/g, ' ') || ''
      const isPracticeCta = label.includes('Practice') || label.includes('Start Building Map')
      if (!isPracticeCta) return

      posthog.capture('judgment_map_practice_cta_clicked', {
        ...context(),
        button_label: label,
        time_on_page_ms: Date.now() - viewedAt,
      })
    }

    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/signup') return

    const startedAt = Date.now()
    const focusedFields = new Set<string>()
    let noRedirectTimer: ReturnType<typeof setTimeout> | null = null

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

      window.localStorage.setItem(pendingSignupKey, String(Date.now()))
      posthog.capture('signup_submitted', {
        ...context(),
        time_on_page_ms: Date.now() - startedAt,
      })

      if (noRedirectTimer) clearTimeout(noRedirectTimer)
      noRedirectTimer = setTimeout(() => {
        if (window.location.pathname === '/signup') {
          const pendingSubmittedAt = window.localStorage.getItem(pendingSignupKey)
          posthog.capture('signup_no_redirect_after_submit', {
            ...context(),
            source: 'still_on_signup_after_submit',
            time_since_submit_ms: pendingSubmittedAt ? Date.now() - Number(pendingSubmittedAt) : null,
          })
        }
      }, 12000)
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('submit', onSubmit)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('submit', onSubmit)
      if (noRedirectTimer) clearTimeout(noRedirectTimer)
    }
  }, [pathname])

  return null
}
