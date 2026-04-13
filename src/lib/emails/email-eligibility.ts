import { SupabaseClient } from '@supabase/supabase-js'

export interface EligibleUser {
  user_id: string
  email: string
}

/**
 * Returns trial users eligible for the Day 3 nudge email.
 *
 * Criteria:
 * - trial_ends_at IS NOT NULL
 * - created_at is at least 3 days ago
 * - last_sign_in_at IS NULL or within 1-minute tolerance of created_at (no real login)
 * - is_beta is NOT true
 * - No existing 'onboarding_day_3' record in email_queue
 */
export async function getDay3EligibleUsers(
  supabase: SupabaseClient
): Promise<EligibleUser[]> {
  const { data, error } = await supabase.rpc('get_day3_eligible_users')

  if (error) {
    console.error('[Email Eligibility] Error fetching Day 3 eligible users:', error)
    return []
  }

  return (data as EligibleUser[]) ?? []
}

/**
 * Returns trial users eligible for the Day 6 trial expiration warning email.
 *
 * Criteria:
 * - trial_ends_at IS NOT NULL
 * - created_at is at least 6 days ago
 * - is_beta is NOT true
 * - subscription_status != 'active'
 * - No existing 'onboarding_day_6' record in email_queue
 */
export async function getDay6EligibleUsers(
  supabase: SupabaseClient
): Promise<EligibleUser[]> {
  const { data, error } = await supabase.rpc('get_day6_eligible_users')

  if (error) {
    console.error('[Email Eligibility] Error fetching Day 6 eligible users:', error)
    return []
  }

  return (data as EligibleUser[]) ?? []
}

/**
 * Returns beta users eligible for the Day 7 re-engagement email.
 *
 * Criteria:
 * - is_beta = true
 * - created_at is at least 7 days ago
 * - last_sign_in_at IS NULL or within 1-minute tolerance of created_at (no real login)
 * - No existing 'beta_day_7_reengagement' record in email_queue
 */
export async function getBetaDay7EligibleUsers(
  supabase: SupabaseClient
): Promise<EligibleUser[]> {
  const { data, error } = await supabase.rpc('get_beta_day7_eligible_users')

  if (error) {
    console.error('[Email Eligibility] Error fetching Beta Day 7 eligible users:', error)
    return []
  }

  return (data as EligibleUser[]) ?? []
}
