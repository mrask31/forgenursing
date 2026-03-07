'use client'

import { ReactNode, useState, useEffect } from 'react'
import { DensityProvider } from '@/contexts/DensityContext'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { PHIAcknowledgmentModal } from '@/components/phi-acknowledgment-modal'
import { Menu } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'

interface AppShellProps {
  children: ReactNode
  variant?: 'app' | 'public'
}

export function AppShell({ children, variant = 'app' }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [programTrack, setProgramTrack] = useState<string | null>(null)
  const [graduationYear, setGraduationYear] = useState<number | null>(null)
  const [showPHIModal, setShowPHIModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (variant !== 'app') return
    
    const loadProfile = async () => {
      try {
  const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('program_track, graduation_date, phi_acknowledged_at')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.program_track) {
            setProgramTrack(profile.program_track)
          }
          if (profile.graduation_date) {
            setGraduationYear(new Date(profile.graduation_date).getFullYear())
          }
          
          // Show PHI modal if user hasn't acknowledged yet
          if (!profile.phi_acknowledged_at) {
            setShowPHIModal(true)
          }
        }
      } catch (error) {
        console.error('[AppShell] Error loading profile:', error)
      }
    }

    loadProfile()
  }, [variant])

  const handlePHIAcknowledge = async () => {
    if (!userId) return

    try {
      const supabase = getBrowserClient()
      const { error } = await supabase
        .from('profiles')
        .update({ phi_acknowledged_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error('[AppShell] Error updating phi_acknowledged_at:', error)
        return
      }

      setShowPHIModal(false)
    } catch (error) {
      console.error('[AppShell] Error acknowledging PHI:', error)
    }
  }

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
        {/* PHI Acknowledgment Modal */}
        <PHIAcknowledgmentModal open={showPHIModal} onAcknowledge={handlePHIAcknowledge} />
        
        {/* Mobile Header Bar - Sticky, only on mobile */}
        <header className="lg:hidden sticky top-0 z-50 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 border-b border-indigo-900/50 flex-shrink-0 safe-t">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-lg font-bold text-white tracking-tight">
                {programTrack && graduationYear 
                  ? `${programTrack} • Class of ${graduationYear}`
                  : programTrack 
                    ? programTrack
                    : 'ForgeNursing'}
              </span>
            </div>
            <div className="w-10"></div>
          </div>
        </header>

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

