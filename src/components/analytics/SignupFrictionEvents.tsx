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

function detectInAppBrowser() {
  const userAgent = navigator.userAgent || ''
  const rules = [
    { name: 'facebook', pattern: /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i },
    { name: 'instagram', pattern: /Instagram/i },
    { name: 'messenger', pattern: /Messenger|FBAN\/Messenger/i },
    { name: 'tiktok', pattern: /TikTok|musical_ly/i },
    { name: 'linkedin', pattern: /LinkedInApp/i },
    { name: 'twitter', pattern: /Twitter|X\/iOS|X\/Android/i },
    { name: 'line', pattern: /Line\//i },
    { name: 'pinterest', pattern: /Pinterest/i },
  ]

  const match = rules.find((rule) => rule.pattern.test(userAgent))

  return {
    isInAppBrowser: Boolean(match),
    browserName: match?.name || null,
  }
}

function ensureSignupHelpBanner(startedAt: number) {
  const { isInAppBrowser, browserName } = detectInAppBrowser()
  if (!isInAppBrowser || document.getElementById('signup-in-app-browser-help')) return null

  const submitButton = document.querySelector('[data-testid="signup-submit"]') as HTMLButtonElement | null
  const form = submitButton?.closest('form') as HTMLFormElement | null
  const card = form?.parentElement
  if (!card || !form) return null

  const banner = document.createElement('div')
  banner.id = 'signup-in-app-browser-help'
  banner.className = 'mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900'
  banner.innerHTML = `
    <p class="font-semibold text-amber-950">Having trouble creating your account?</p>
    <p class="mt-1 leading-relaxed">This in-app browser can block signup. Tap the menu and choose <strong>Open in browser</strong>, or copy this link into Chrome/Safari.</p>
    <button
      type="button"
      data-testid="signup-copy-link"
      class="mt-2 inline-flex min-h-[36px] items-center justify-center rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white"
    >
      Copy signup link
    </button>
  `

  card.insertBefore(banner, form)

  posthog.capture('signup_in_app_browser_detected', {
    ...context(),
    browser_name: browserName,
    source: 'visitor_b_mobile_signup_friction',
    time_on_page_ms: Date.now() - startedAt,
  })

  const copyButton = banner.querySelector('[data-testid="signup-copy-link"]') as HTMLButtonElement | null
  if (!copyButton) {
    return () => banner.remove()
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      copyButton.textContent = 'Link copied'
      posthog.capture('signup_copy_link_clicked', {
        ...context(),
        browser_name: browserName,
        source: 'in_app_browser_help_banner',
        time_on_page_ms: Date.now() - startedAt,
      })
    } catch {
      copyButton.textContent = 'Copy failed — long press address bar'
      posthog.capture('signup_copy_link_failed', {
        ...context(),
        browser_name: browserName,
        source: 'in_app_browser_help_banner',
        time_on_page_ms: Date.now() - startedAt,
      })
    }
  }

  copyButton.addEventListener('click', onCopy)

  return () => {
    copyButton.removeEventListener('click', onCopy)
    banner.remove()
  }
}

function ensureSignupSubmitHint(startedAt: number) {
  const submitButton = document.querySelector('[data-testid="signup-submit"]') as HTMLButtonElement | null
  const form = submitButton?.closest('form') as HTMLFormElement | null
  if (!form || !submitButton) return null

  const emailInput = form.querySelector('[data-testid="signup-email"]') as HTMLInputElement | null
  const passwordInput = form.querySelector('[data-testid="signup-password"]') as HTMLInputElement | null
  const termsInput = form.querySelector('input[type="checkbox"]') as HTMLInputElement | null
  if (!emailInput || !passwordInput || !termsInput) return null

  let hint = document.getElementById('signup-submit-hint') as HTMLParagraphElement | null
  if (!hint) {
    hint = document.createElement('p')
    hint.id = 'signup-submit-hint'
    hint.className = 'text-center text-xs font-medium text-slate-500'
    submitButton.insertAdjacentElement('afterend', hint)
    submitButton.setAttribute('aria-describedby', 'signup-submit-hint')
  }

  const trackedStates = new Set<string>()

  const getSubmitState = () => {
    const email = emailInput.value.trim()
    const password = passwordInput.value

    if (!email) {
      return {
        key: 'missing_email',
        text: 'Enter your email address to start.',
      }
    }

    if (!password) {
      return {
        key: 'missing_password',
        text: 'Create a password with at least 8 characters.',
      }
    }

    if (password.length < 8) {
      const remaining = 8 - password.length
      return {
        key: 'short_password',
        text: `${remaining} more character${remaining === 1 ? '' : 's'} needed for your password.`,
      }
    }

    if (!termsInput.checked) {
      return {
        key: 'terms_unchecked',
        text: 'Check the terms box to continue.',
      }
    }

    return {
      key: 'ready',
      text: 'Ready — tap Start Free Trial.',
    }
  }

  const updateHint = () => {
    const state = getSubmitState()
    hint!.textContent = state.text
    hint!.className =
      state.key === 'ready'
        ? 'text-center text-xs font-semibold text-[#0D8F9C]'
        : 'text-center text-xs font-medium text-slate-500'

    if (!trackedStates.has(state.key)) {
      trackedStates.add(state.key)
      posthog.capture('signup_submit_state_viewed', {
        ...context(),
        submit_state: state.key,
        time_on_page_ms: Date.now() - startedAt,
      })
    }
  }

  const onPointerDown = () => {
    const state = getSubmitState()
    if (state.key !== 'ready') {
      posthog.capture('signup_submit_attempt_blocked', {
        ...context(),
        submit_state: state.key,
        time_on_page_ms: Date.now() - startedAt,
      })
    }
  }

  updateHint()

  form.addEventListener('input', updateHint)
  form.addEventListener('change', updateHint)
  submitButton.addEventListener('pointerdown', onPointerDown)

  return () => {
    form.removeEventListener('input', updateHint)
    form.removeEventListener('change', updateHint)
    submitButton.removeEventListener('pointerdown', onPointerDown)
    hint?.remove()
  }
}

function ensureSignupFormVisibilityTracker(startedAt: number) {
  const emailInput = document.querySelector('[data-testid="signup-email"]') as HTMLInputElement | null
  if (!emailInput) return null

  let captured = false

  const captureVisible = (entry?: IntersectionObserverEntry) => {
    if (captured) return
    captured = true
    posthog.capture('signup_form_visible', {
      ...context(),
      ...detectInAppBrowser(),
      source: 'email_field_intersection_observer',
      time_on_page_ms: Date.now() - startedAt,
      intersection_ratio: entry?.intersectionRatio ?? null,
    })
  }

  if (!('IntersectionObserver' in window)) {
    captureVisible()
    return null
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) {
        captureVisible(entry)
        observer.disconnect()
      }
    },
    {
      threshold: 0.5,
    }
  )

  observer.observe(emailInput)

  return () => observer.disconnect()
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
    let fieldInteracted = false
    let noRedirectTimer: ReturnType<typeof setTimeout> | null = null
    let abandonmentTimer: ReturnType<typeof setTimeout> | null = null

    posthog.capture('signup_page_viewed', {
      ...context(),
      ...detectInAppBrowser(),
    })

    const cleanupBanner = ensureSignupHelpBanner(startedAt)
    const cleanupSubmitHint = ensureSignupSubmitHint(startedAt)
    const cleanupVisibilityTracker = ensureSignupFormVisibilityTracker(startedAt)

    abandonmentTimer = setTimeout(() => {
      if (window.location.pathname !== '/signup' || fieldInteracted) return

      posthog.capture('signup_form_abandoned', {
        ...context(),
        ...detectInAppBrowser(),
        source: 'no_field_interaction_after_20s',
        time_on_page_ms: Date.now() - startedAt,
      })
    }, 20000)

    const trackFocus = (fieldName: string) => {
      fieldInteracted = true
      if (abandonmentTimer) {
        clearTimeout(abandonmentTimer)
        abandonmentTimer = null
      }

      if (focusedFields.has(fieldName)) return
      focusedFields.add(fieldName)
      posthog.capture('signup_field_focused', {
        ...context(),
        ...detectInAppBrowser(),
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
        ...detectInAppBrowser(),
        time_on_page_ms: Date.now() - startedAt,
      })

      if (noRedirectTimer) clearTimeout(noRedirectTimer)
      noRedirectTimer = setTimeout(() => {
        if (window.location.pathname === '/signup') {
          const pendingSubmittedAt = window.localStorage.getItem(pendingSignupKey)
          posthog.capture('signup_no_redirect_after_submit', {
            ...context(),
            ...detectInAppBrowser(),
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
      cleanupBanner?.()
      cleanupSubmitHint?.()
      cleanupVisibilityTracker?.()
      if (noRedirectTimer) clearTimeout(noRedirectTimer)
      if (abandonmentTimer) clearTimeout(abandonmentTimer)
    }
  }, [pathname])

  return null
}
