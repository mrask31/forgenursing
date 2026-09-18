'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { DensityProvider } from '@/contexts/DensityContext'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { PHIAcknowledgmentModal } from '@/components/phi-acknowledgment-modal'
import { ProgramSelectionModal } from '@/components/program-selection-modal'
import Link from 'next/link'
import { Menu, Home, ClipboardList, BarChart3, Settings } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'

interface AppShellProps {
  children: ReactNode
  variant?: 'app' | 'public'
}

export function AppShell({ children, variant = 'app' }: AppShellProps) {
  const pathname = usePathname()
  const needsStudySetup = ['/tutor', '/classes', '/binder', '/library'].some(path => pathname.startsWith(path))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [programTrack, setProgramTrack] = useState<string | null>(null)
  const [graduationYear, setGraduationYear] = useState<number | null>(null)
  const [showPHIModal, setShowPHIModal] = useState(false)
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [programLevel, setProgramLevel] = useState<'LPN' | 'ADN' | 'BSN' | 'MSN' | null>(null)

  useEffect(() => {
    setShowPHIModal(false)
    setShowProgramModal(false)
    if (variant !== 'app' || !needsStudySetup) return

    const loadProfile = async () => {
      try {
  const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('program_track, graduation_date, phi_acknowledged_at, program_level')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.program_track) {
            setProgramTrack(profile.program_track)
          }
          if (profile.graduation_date) {
            setGraduationYear(new Date(profile.graduation_date).getFullYear())
          }
          if (profile.program_level) {
            setProgramLevel(profile.program_level as 'LPN' | 'ADN' | 'BSN' | 'MSN')
          }

          // Step 1: Show PHI modal if user hasn't acknowledged yet
          if (!profile.phi_acknowledged_at) {
            setShowPHIModal(true)
          }
          // Step 2: Show program selection if PHI acknowledged but program not set
          else if (!profile.program_level) {
            setShowProgramModal(true)
          }
          // Step 3: Both set → render app normally
        }
      } catch (error) {
        console.error('[AppShell] Error loading profile:', error)
      }
    }

    loadProfile()
  }, [variant, needsStudySetup])

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

      // After PHI acknowledgment, check if program_level needs to be set
      if (!programLevel) {
        setShowProgramModal(true)
      }
    } catch (error) {
      console.error('[AppShell] Error acknowledging PHI:', error)
    }
  }

  const handleProgramSelection = async (selectedLevel: 'LPN' | 'ADN' | 'BSN' | 'MSN') => {
    if (!userId) return

    try {
      const supabase = getBrowserClient()
      const { error } = await supabase
        .from('profiles')
        .update({ program_level: selectedLevel })
        .eq('id', userId)

      if (error) {
        console.error('[AppShell] Error updating program_level:', error)
        return
      }

      setProgramLevel(selectedLevel)
      setShowProgramModal(false)
    } catch (error) {
      console.error('[AppShell] Error selecting program:', error)
    }
  }

  if (variant === 'public') {
    // Public pages (landing, login, signup, checkout) use simpler layout
    return (
      <div className="min-h-screen-dynamic bg-[var(--gray-50)] flex flex-col">
        {/* Content will be wrapped by PublicLayout */}
        {children}
      </div>
    )
  }

  // App pages (tutor, dashboard, etc.) use full app shell with sidebar
  return (
    <DensityProvider>
      <div className="h-screen-dynamic bg-[var(--gray-50)] flex flex-col lg:flex-row overflow-hidden">
        {/* PHI Acknowledgment Modal - Step 1 */}
        <PHIAcknowledgmentModal open={showPHIModal} onAcknowledge={handlePHIAcknowledge} />

        {/* Program Selection Modal - Step 2 */}
        <ProgramSelectionModal open={showProgramModal} onComplete={handleProgramSelection} />

        {/* Mobile Header Bar - Sticky, only on mobile */}
        <header className="lg:hidden sticky top-0 z-50 bg-[#0B2545] border-b border-[#1E2D3D] flex-shrink-0 safe-t">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2.5 bg-[var(--teal)] text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#0BBCD4]"></div>
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
        <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-shrink-0 bg-[#0B2545] border-r border-[#1E2D3D] h-screen-dynamic overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto pb-20 lg:pb-0 bg-[var(--gray-50)] flex flex-col">
          {children}
        </main>

        <nav aria-label="Main navigation" className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          {[{ label: 'Home', href: '/entry', icon: Home }, { label: 'Practice', href: '/quiz', icon: ClipboardList }, { label: 'Progress', href: '/readiness', icon: BarChart3 }, { label: 'Account', href: '/settings', icon: Settings }].map(item => {
            const active = pathname === item.href || (item.href === '/quiz' && pathname.startsWith('/quiz/'))
            const Icon = item.icon
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? 'bg-teal-50 text-[#087986]' : 'text-slate-600'}`}><Icon aria-hidden="true" className="h-5 w-5" />{item.label}</Link>
          })}
        </nav>
        {/* Mobile Navigation Drawer */}
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      </div>
    </DensityProvider>
  )
}

