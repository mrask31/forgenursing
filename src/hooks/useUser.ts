'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  subscription_status: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
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

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getBrowserClient()

    // Initial load
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setUser(authUser)

        if (authUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id')
            .eq('id', authUser.id)
            .single()

          setProfile(profileData)
        }
      } catch (error) {
        console.error('[useUser] Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Derived states
  const now = new Date()
  const trialEndDate = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  
  const isTrialActive = !!(trialEndDate && now < trialEndDate)
  const isSubscribed = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'
  const hasAccess = isSubscribed || isTrialActive
  
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
