import { createClient } from '@/lib/supabase/server'
import PricingContent from './PricingContent'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let isBeta = false
  let isSubscribed = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_beta, subscription_status')
      .eq('id', user.id)
      .single()

    isBeta = profile?.is_beta === true
    isSubscribed = profile?.subscription_status === 'active'
  }

  return <PricingContent isBeta={isBeta} isSubscribed={isSubscribed} />
}
