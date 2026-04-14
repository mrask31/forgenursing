/**
 * Subscription access rule: only 'active' (paying) grants unconditional access.
 * 'trialing' requires a separate isTrialActive() check against trial_ends_at.
 * @deprecated HAS_ACCESS_STATUSES — kept for backward compatibility with external importers.
 * New code should use hasAccess() which correctly evaluates trial expiry.
 */
export const HAS_ACCESS_STATUSES = ['trialing', 'active'] as const

export function hasSubscriptionAccess(status: string | null | undefined): boolean {
  return status === 'active'
}

/**
 * Check if user's trial is currently active
 * @param trialEndsAt - ISO timestamp string or Date when trial ends
 * @returns true if trial is active (current date is before trial end date)
 */
export function isTrialActive(trialEndsAt: string | Date | null | undefined): boolean {
  if (!trialEndsAt) return false
  
  const trialEndDate = typeof trialEndsAt === 'string' ? new Date(trialEndsAt) : trialEndsAt
  const now = new Date()
  
  return trialEndDate > now
}

/**
 * Check if user's beta access is currently active
 */
export function isBetaActive(
  isBeta: boolean | null | undefined,
  betaExpiresAt: string | Date | null | undefined
): boolean {
  if (!isBeta) return false
  if (!betaExpiresAt) return false
  const expDate = typeof betaExpiresAt === 'string' ? new Date(betaExpiresAt) : betaExpiresAt
  return expDate > new Date()
}

/**
 * Check if user has access based on subscription status, active trial, or active beta
 * @param status - subscription_status from profiles table
 * @param trialEndsAt - trial_ends_at timestamp from profiles table
 * @param isBeta - is_beta flag from profiles table (optional)
 * @param betaExpiresAt - beta_expires_at timestamp from profiles table (optional)
 * @returns true if user has active subscription, active trial, or active beta access
 */
export function hasAccess(
  status: string | null | undefined,
  trialEndsAt: string | Date | null | undefined,
  isBeta?: boolean | null,
  betaExpiresAt?: string | Date | null
): boolean {
  // Paying subscriber
  if (hasSubscriptionAccess(status)) return true

  // Active trial (trialing status AND not expired)
  if (status === 'trialing' && isTrialActive(trialEndsAt)) return true

  // Active beta
  if (isBetaActive(isBeta, betaExpiresAt)) return true

  return false
}
