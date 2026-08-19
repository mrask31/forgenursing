'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen-dynamic bg-[#F7F9FB] flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-[#DDE5EE] bg-white/95 shadow-sm backdrop-blur flex-shrink-0 safe-t">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group flex-shrink min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0D8F9C] rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="1" y="10" width="3" height="6" rx="1" fill="white"/>
                  <rect x="5.5" y="7" width="3" height="9" rx="1" fill="white"/>
                  <rect x="10" y="4" width="3" height="12" rx="1" fill="white"/>
                  <rect x="14.5" y="1" width="3" height="15" rx="1" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-base sm:text-xl truncate">
                <span className="text-[#0B2545]">Forge</span><span className="text-[#0BBCD4]">Nursing</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-[#1E2D3D]/75">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-[#0D8F9C] ${pathname === link.href ? 'text-[#0D8F9C]' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {pathname !== '/login' && (
                <Link
                  href="/login"
                  className="flex px-3 sm:px-4 py-2 text-[#0B2545] hover:text-[#0D8F9C] text-xs sm:text-sm font-bold transition-colors min-h-[40px] items-center border border-[#DDE5EE] hover:border-[#0D8F9C] rounded-lg bg-white"
                >
                  Log In
                </Link>
              )}

              {pathname !== '/retake-recovery-check' && (
                <Link
                  href="/retake-recovery-check"
                  className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#0D8F9C] text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-[#0a7d88] transition-colors min-h-[40px] sm:min-h-[44px] flex items-center shadow-sm whitespace-nowrap"
                >
                  <span className="hidden xs:inline">Start Free Check</span>
                  <span className="xs:hidden">Free Check</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full overflow-visible pb-safe-b">
        {children}
      </main>

      <footer className="border-t border-[#DDE5EE] bg-white mt-auto flex-shrink-0 pb-safe-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col gap-5 text-xs sm:text-sm text-[#1E2D3D]">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="font-bold text-[#0B2545]">ForgeNursing</p>
                <p className="mt-1 max-w-xl text-[#1E2D3D]/65">
                  NCLEX retake recovery for students who need to know why they picked the wrong one before the next attempt.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 sm:justify-end">
                <Link href="/how-it-works" className="hover:text-[#0D8F9C] transition-colors font-medium">
                  How it works
                </Link>
                <Link href="/pricing" className="hover:text-[#0D8F9C] transition-colors font-medium">
                  Pricing
                </Link>
                <Link href="/faq" className="hover:text-[#0D8F9C] transition-colors font-medium">
                  FAQ
                </Link>
                <Link href="/terms" className="hover:text-[#0D8F9C] transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-[#0D8F9C] transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 border-t border-[#DDE5EE] pt-4 text-[#1E2D3D]/60">
              <p>© 2026 MJR Intelligence Group LLC</p>
              <p>
                Educational study aid. Not affiliated with NCSBN. No exam outcome guaranteed. Contact:{' '}
                <a href="mailto:support@forgenursing.com" className="hover:text-[#0D8F9C] transition-colors">
                  support@forgenursing.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
