'use client'

import { ReactNode, useState } from 'react'
import { DensityProvider } from '@/contexts/DensityContext'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { Menu } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
  variant?: 'app' | 'public'
}

export function AppShell({ children, variant = 'app' }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (variant === 'public') {
    // Public pages (landing, login, signup, checkout) use simpler layout
    return (
      <div className="min-h-screen-dynamic bg-slate-50 flex flex-col">
        {/* Content will be wrapped by PublicLayout */}
        {children}
      </div>
    )
  }

  // App pages (tutor, dashboard, etc.) use full app shell with sidebar
  return (
    <DensityProvider>
      <div className="h-screen-dynamic bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Menu Button - Fixed position, only on mobile */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar - Hidden on mobile, visible on lg+ - Fixed */}
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-shrink-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 border-r border-indigo-900/50 h-screen-dynamic overflow-y-auto">
          <Sidebar />
        </aside>
        
        {/* Main Content Area - Fixed height, no overflow */}
        <main className="flex-1 min-w-0 h-screen-dynamic overflow-hidden bg-slate-50 flex flex-col">
          {children}
        </main>

        {/* Mobile Navigation Drawer */}
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      </div>
    </DensityProvider>
  )
}

