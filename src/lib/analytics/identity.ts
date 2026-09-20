type AnalyticsIdentity = {
  get_distinct_id(): string
  identify(id: string): void
  reset(): void
}

export function syncAnalyticsIdentity(analytics: AnalyticsIdentity, userId: string | null, previousUserId: string | null) {
  if (!userId) {
    if (previousUserId) analytics.reset()
    return null
  }
  if (previousUserId && previousUserId !== userId) analytics.reset()
  if (analytics.get_distinct_id() !== userId) analytics.identify(userId)
  return userId
}
