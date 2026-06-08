'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function SignupFormEvents() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/signup') return

    const startedAt = Date.now()
    const seen = new Set<string>()

    const base = () => ({
      path: window.location.pathname,
      query: window.location.search || null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      referrer: document.referrer || null,
    })

    posthog.capture('signup_page_viewed', {
      ...base(),
      source: 'signup_form_tracker',
    })

    const markField = (field: string) => {
      if (seen.has(field)) return
      seen.add(field)
      posthog.capture('signup_field_focused', {
        ...base(),
        source: 'signup_form_tracker',
        field_name: field,
        time_on_page_ms: Date.now() - startedAt,
      })
    }

    const onFocus = (event: FocusEvent) => {
      const el = event.target as HTMLInputElement | null
      if (!el) return
      if (el.type === 'email' || el.name === 'email') markField('email')
      if (el.type === 'password' || el.name === 'password') markField('password')
    }

    const onInput = (event: Event) => {
      const el = event.target as HTMLInputElement | null
      if (!el) return
      if (el.type === 'email' || el.name === 'email') markField('email')
      if (el.type === 'password' || el.name === 'password') markField('password')
    }

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null
      if (!form) return
      const hasSignupInput = Boolean(form.querySelector('input[type="email"]')) && Boolean(form.querySelector('input[type="password"]'))
      if (!hasSignupInput) return
      posthog.capture('signup_submitted', {
        ...base(),
        source: 'signup_form_tracker',
        time_on_page_ms: Date.now() - startedAt,
      })
    }

    document.addEventListener('focusin', onFocus)
    document.addEventListener('input', onInput)
    document.addEventListener('submit', onSubmit)

    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('input', onInput)
      document.removeEventListener('submit', onSubmit)
    }
  }, [pathname])

  return null
}
