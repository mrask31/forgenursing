import type { SupabaseClient } from '@supabase/supabase-js'

/** Trial acquisition prompts are inappropriate after a production pass purchase,
 * including expired/refunded passes. Errors fail closed; callers must not send. */
export async function hasPurchasedRetakePass(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await admin.from('retake_passes').select('id')
    .eq('user_id', userId).eq('audience', 'production').limit(1)
  if (error) throw new Error('Pass email eligibility unavailable')
  return Boolean(data?.length)
}
