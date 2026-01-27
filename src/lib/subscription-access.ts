/**
 * Subscription access rule: trialing and active grant access.
 * Do NOT require payment or paid invoice — subscription status only.
 */
export const HAS_ACCESS_STATUSES = ['trialing', 'active'] as const

export function hasSubscriptionAccess(status: string | null | undefined): boolean {
  return status != null && HAS_ACCESS_STATUSES.includes(status as (typeof HAS_ACCESS_STATUSES)[number])
}
