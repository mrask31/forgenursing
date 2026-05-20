'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showBetaBanner, setShowBetaBanner] = useState(false)
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)
  const [betaFull, setBetaFull] = useState(false)

  // Fetch beta spots for the banner
  useEffect(() => {
    fetch('/api/beta-spots', { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ spotsRemaining, isFull }) => {
        setSpotsRemaining(spotsRemaining)
        setBetaFull(isFull)
      })
      .catch(() => {
        // Fail safe: assume beta is full when fetch fails
        setSpotsRemaining(0)
        setBetaFull(true)
      })
  }, [])

  // Show beta banner unless dismissed this session or beta is full
  useEffect(() => {
    if (betaFull) {
      setShowBetaBanner(false)
      return
    }
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('forge-beta-banner-dismissed')
      if (!dismissed) setShowBetaBanner(true)
    }
  }, [betaFull])

  return (
    <div className="min-h-screen-dynamic bg-[#F7F9FB] flex flex-col">
      {/* Beta Tester Recruitment Banner — hidden when beta is full */}
      {showBetaBanner && !betaFull && (
        <div className="w-full bg-[#0D8F9C] text-white text-center text-xs sm:text-sm py-2.5 px-4 relative flex-shrink-0 z-50">
          <span className="inline-flex items-center gap-2 flex-wrap justify-center">
            Free beta —{' '}
            <strong data-testid="beta-counter">
              {spotsRemaining !== null ? spotsRemaining : '...'} spot{spotsRemaining !== 1 ? 's' : ''} remaining
            </strong>
            . No credit card needed.
            <Link
              href="/signup?plan=monthly"
              className="inline-flex items-center gap-1 px-3 py-1 bg-white text-[#0D8F9C] rounded-full text-xs font-bold hover:bg-white/90 transition-colors"
            >
              Claim Your Spot →
            </Link>
          </span>
          <button
            onClick={() => {
              setShowBetaBanner(false)
              sessionStorage.setItem('forge-beta-banner-dismissed', 'true')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              {pathname !== '/login' && (
                <Link
                  href="/login"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-[#0B2545] hover:text-[#0D8F9C] text-xs sm:text-sm font-semibold transition-colors min-h-[40px] sm:min-h-[44px] flex items-center border border-[#DDE5EE] hover:border-[#0D8F9C] rounded-lg"
                >
                  Log In
                </Link>
              )}

              {pathname === '/' && (
                <Link
                  href="/signup"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0D8F9C] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#0a7d88] transition-colors min-h-[40px] sm:min-h-[44px] flex items-center shadow-sm"
                >
                  {betaFull ? 'Start Free Trial' : 'Join Free Beta'}
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
