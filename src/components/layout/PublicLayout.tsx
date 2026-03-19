'use client'

import Link from 'next/link'
import { hasSubscriptionAccess } from '@/lib/subscription-access'
import { usePathname } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    const supabase = getBrowserClient()

    const checkUserAndSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single()

        const subscriptionStatus = profile?.subscription_status
        setHasActiveSubscription(hasSubscriptionAccess(subscriptionStatus))
      } else {
        setHasActiveSubscription(false)
      }
    }

    checkUserAndSubscription()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single()
        setHasActiveSubscription(hasSubscriptionAccess(profile?.subscription_status))
      } else {
        setHasActiveSubscription(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen-dynamic bg-[#F7F9FB] flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-[#DDE5EE] bg-white shadow-sm flex-shrink-0 safe-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo — matches app sidebar */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0D8F9C] rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 flex-shrink-0">
                {/* Bar chart icon matching sidebar */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="1" y="10" width="3" height="6" rx="1" fill="white"/>
                  <rect x="5.5" y="7" width="3" height="9" rx="1" fill="white"/>
                  <rect x="10" y="4" width="3" height="12" rx="1" fill="white"/>
                  <rect x="14.5" y="1" width="3" height="15" rx="1" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-lg sm:text-xl">
                <span className="text-[#0B2545]">Forge</span><span className="text-[#0BBCD4]">Nursing</span>
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Go to Tutor for active subscribers */}
              {user && hasActiveSubscription && pathname !== '/checkout' && (
                <Link
                  href="/tutor"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0D8F9C] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#0a7d88] transition-colors min-h-[40px] sm:min-h-[44px] flex items-center"
                >
                  Go to Tutor
                </Link>
              )}
              {/* Log In ghost button */}
              {(!user || (pathname === '/' && !hasActiveSubscription)) && (
                <Link
                  href="/login"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-[#0B2545] hover:text-[#0D8F9C] text-xs sm:text-sm font-semibold transition-colors min-h-[40px] sm:min-h-[44px] flex items-center border border-[#DDE5EE] hover:border-[#0D8F9C] rounded-lg"
                >
                  Log In
                </Link>
              )}
              {/* Start Free Trial */}
              {pathname === '/' && (!user || !hasActiveSubscription) && (
                <Link
                  href="/signup?plan=monthly"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0D8F9C] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#0a7d88] transition-colors min-h-[40px] sm:min-h-[44px] flex items-center shadow-sm"
                >
                  Start Free Trial
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 w-full overflow-visible pb-safe-b">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DDE5EE] bg-white mt-auto flex-shrink-0 pb-safe-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[#1E2D3D]">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center sm:items-start">
              <Link href="/faq" className="hover:text-[#0D8F9C] transition-colors font-medium">
                FAQ
              </Link>
              <Link href="/terms" className="hover:text-[#0D8F9C] transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#0D8F9C] transition-colors">
                Privacy Policy
              </Link>
              <a href="mailto:support@forgenursing.com" className="hover:text-[#0D8F9C] transition-colors">
                Contact: support@forgenursing.com
              </a>
            </div>
            <div className="text-[#1E2D3D]/60 text-center sm:text-right">
              <p>© 2026 MJR Intelligence Group LLC</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
