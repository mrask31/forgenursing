import { pageMetadata } from '@/lib/seo'
export const metadata = pageMetadata("Pricing and 7-Day Free Trial", "Try ForgeNursing free for 7 days without a credit card. Continue NCLEX-RN retake practice for $9.99/month or $79/year.", "/pricing")
import { createClient } from '@/lib/supabase/server'
import PricingContent from './PricingContent'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let isSubscribed = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    isSubscribed = profile?.subscription_status === 'active'
  }

  return <PricingContent isSubscribed={isSubscribed} isSignedIn={Boolean(user)} />
}
