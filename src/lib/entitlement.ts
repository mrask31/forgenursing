import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { hasAccess, isTrialActive, isBetaActive } from '@/lib/subscription-access'

const ACCESS_STATUSES = new Set(['trialing', 'active'])

type EntitlementResult = {
  userId: string | null
  status: string | null
  hasAccess: boolean
  isTrialActive: boolean
  trialEndsAt: string | null
  isBeta: boolean
  betaExpiresAt: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export async function getEntitlementForUser(userId?: string | null): Promise<EntitlementResult> {
  if (!userId) {
    return {
      userId: null,
      status: null,
      hasAccess: false,
      isTrialActive: false,
      trialEndsAt: null,
      isBeta: false,
      betaExpiresAt: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    }
  }

  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at, is_beta, beta_expires_at, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return {
      userId,
      status: null,
      hasAccess: false,
      isTrialActive: false,
      trialEndsAt: null,
      isBeta: false,
      betaExpiresAt: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    }
  }

  const status = profile.subscription_status ?? null
  const trialEndsAt = profile.trial_ends_at ?? null
  const trialActive = isTrialActive(trialEndsAt)
  const betaFlag = profile.is_beta ?? false
  const betaExpiresAt = profile.beta_expires_at ?? null

  // Beta check takes priority — if active beta, grant access regardless of subscription
  return {
    userId,
    status,
    hasAccess: hasAccess(status, trialEndsAt, betaFlag, betaExpiresAt),
    isTrialActive: trialActive,
    trialEndsAt,
    isBeta: betaFlag,
    betaExpiresAt,
    stripe_customer_id: profile.stripe_customer_id ?? null,
    stripe_subscription_id: profile.stripe_subscription_id ?? null,
  }
}

export async function requireEntitlement(userId?: string | null): Promise<EntitlementResult> {
  return getEntitlementForUser(userId)
}
