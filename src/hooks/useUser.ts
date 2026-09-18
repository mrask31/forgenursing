'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { hasAccess as hasAccessCheck, isTrialActive as checkTrialActive } from '@/lib/subscription-access'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface UserProfile {
  subscription_status: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  is_beta: boolean | null
  beta_expires_at: string | null
}

interface UseUserReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isTrialActive: boolean
  isSubscribed: boolean
  hasAccess: boolean
  trialDaysRemaining: number
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

function makeServerUser(userId: string | null, email: string | null): User | null {
  if (!userId) return null

  return {
    id: userId,
    email: email ?? undefined,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  } as User
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let request = 0
    let authReload: ReturnType<typeof setTimeout> | undefined
    const supabase = getBrowserClient()
    async function loadUser() {
      const current = ++request
      try {
        const response = await withTimeout(fetch('/api/subscription/status', {
          credentials: 'include', cache: 'no-store',
        }), 5000, 'USER_STATUS_TIMEOUT')
        const data = response.ok ? await response.json() : null
        if (cancelled || current !== request) return
        setUser(data?.user_id ? makeServerUser(data.user_id, data.email) : null)
        setProfile(data?.profile ?? null)
      } catch (error) {
        if (cancelled || current !== request) return
        console.error('[useUser] Server status load failed:', error)
        setUser(null)
        setProfile(null)
      } finally {
        if (!cancelled && current === request) setIsLoading(false)
      }
    }
    void loadUser()
    // Return immediately: Supabase auth notifications can hold its session lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'INITIAL_SESSION') return
      clearTimeout(authReload)
      if (event === 'SIGNED_OUT') {
        ++request
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }
      authReload = setTimeout(() => { if (!cancelled) void loadUser() }, 0)
    })
    return () => {
      cancelled = true
      clearTimeout(authReload)
      subscription.unsubscribe()
    }
  }, [])

  const now = new Date()
  const trialEndDate = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null

  const isTrialActive = checkTrialActive(profile?.trial_ends_at)
  const isSubscribed = profile?.subscription_status === 'active'
  const hasAccess = hasAccessCheck(
    profile?.subscription_status,
    profile?.trial_ends_at,
    profile?.is_beta,
    profile?.beta_expires_at
  )

  const trialDaysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return {
    user,
    profile,
    isLoading,
    isTrialActive,
    isSubscribed,
    hasAccess,
    trialDaysRemaining,
  }
}
