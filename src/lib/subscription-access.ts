/**
 * Subscription access rule: trialing and active grant access.
 * Do NOT require payment or paid invoice — subscription status only.
 */
export const HAS_ACCESS_STATUSES = ['trialing', 'active'] as const

export function hasSubscriptionAccess(status: string | null | undefined): boolean {
  return status != null && HAS_ACCESS_STATUSES.includes(status as (typeof HAS_ACCESS_STATUSES)[number])
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
 * Check if user has access based on subscription status OR active trial
 * @param status - subscription_status from profiles table
 * @param trialEndsAt - trial_ends_at timestamp from profiles table
 * @returns true if user has active subscription OR active trial
 */
export function hasAccess(
  status: string | null | undefined,
  trialEndsAt: string | Date | null | undefined
): boolean {
  return hasSubscriptionAccess(status) || isTrialActive(trialEndsAt)
}
