'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, BarChart3, GraduationCap, BookOpen, Settings, LogOut, ChevronUp, ClipboardList } from 'lucide-react'
import { getBrowserClient, resetBrowserClient } from '@/lib/supabase/client'
import { clearSupabaseStorage } from '@/lib/auth-utils'
import HistoryButton from './HistoryButton'

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname()
  const [preferredName, setPreferredName] = useState<string | null>(null)
  const [programTrack, setProgramTrack] = useState<string | null>(null)
  const [graduationDate, setGraduationDate] = useState<string | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [quizFirstEnabled, setQuizFirstEnabled] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_name, program_track, graduation_date, quiz_first_enabled')
          .eq('id', user.id)
          .single()

        if (profile) {
          setPreferredName(profile.preferred_name || null)
          setProgramTrack(profile.program_track || null)
          setGraduationDate(profile.graduation_date || null)
          setQuizFirstEnabled(profile.quiz_first_enabled ?? false)
        }
      } catch (error) {
        console.error('[Sidebar] Error loading profile:', error)
      }
    }

    loadProfile()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileMenuOpen])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setIsProfileMenuOpen(false)

    try {
      const supabase = getBrowserClient()
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])
    } catch (error) {
      console.warn('[Sidebar] Supabase signOut failed; continuing cleanup:', error)
    }

    try {
      clearSupabaseStorage()
      resetBrowserClient()
      await Promise.race([
        fetch('/api/auth/clear-session', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])
      clearSupabaseStorage()
      resetBrowserClient()
    } catch (error) {
      console.warn('[Sidebar] Server session cleanup failed; redirecting anyway:', error)
    } finally {
      window.location.replace('/login?loggedOut=true')
    }
  }

  const mainNav = [
    { label: 'Clinical Tutor', href: '/tutor', icon: MessageSquare },
    ...(quizFirstEnabled ? [{ label: 'Practice Questions', href: '/quiz', icon: ClipboardList }] : []),
    { label: 'Judgment Map', href: '/readiness', icon: BarChart3, badge: true },
    { label: 'My Courses', href: '/classes', icon: GraduationCap },
  ]

  const clinicalTools = [
    { label: 'Med Dictionary', href: '/dictionary', icon: BookOpen },
  ]

  const isActive = (href: string, label: string) => {
    if (pathname === href) return true
    if (href === '/classes' && pathname.startsWith('/classes')) return true
    if (href === '/dictionary' && pathname.startsWith('/dictionary')) return true
    if (href === '/readiness' && pathname.startsWith('/readiness') && label === 'Judgment Map') return true
    if (href === '/quiz' && pathname.startsWith('/quiz')) return true
    if (href === '/settings' && pathname.startsWith('/settings')) return true
    return false
  }

  const getInitials = () => {
    if (preferredName) {
      return preferredName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'SN'
  }

  return (
    <aside className="flex w-full h-full flex-col text-[#94A3B8]" style={{ backgroundColor: '#0B2545' }}>
      <div className="flex h-full flex-col px-5 py-6">
        <div className="mb-8 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0D8F9C' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="6" width="2.5" height="6" rx="1" fill="white" />
                <rect x="6.5" y="3" width="2.5" height="12" rx="1" fill="white" />
                <rect x="10" y="5" width="2.5" height="8" rx="1" fill="white" />
                <rect x="13.5" y="7" width="2.5" height="4" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Forge</span>
              <span style={{ color: '#0BBCD4' }}>Nursing</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-6">
          <div className="space-y-1">
            {mainNav.map((item) => {
              const active = isActive(item.href, item.label)
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className={`
                    group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150
                    ${active
                      ? 'border-l-[3px] text-white'
                      : 'border-l-[3px] border-transparent text-[#94A3B8] hover:text-[#DDE5EE]'}
                  `}
                  style={active ? { borderLeftColor: '#0BBCD4', color: '#0BBCD4', backgroundColor: 'rgba(11, 188, 212, 0.08)' } : {}}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]/60">
              Clinical Tools
            </p>
            <div className="space-y-1">
              {clinicalTools.map((item) => {
                const active = isActive(item.href, item.label)
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onNavigate}
                    className={`
                      group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150
                      ${active
                        ? 'border-l-[3px] text-white'
                        : 'border-l-[3px] border-transparent text-[#94A3B8] hover:text-[#DDE5EE]'}
                    `}
                    style={active ? { borderLeftColor: '#0BBCD4', color: '#0BBCD4', backgroundColor: 'rgba(11, 188, 212, 0.08)' } : {}}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]/60">
              Session
            </p>
            <div className="space-y-1">
              <HistoryButton onNavigate={onNavigate} />
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-5 border-t border-white/10 relative" ref={profileMenuRef}>
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 mx-1 rounded-lg overflow-hidden border border-white/10" style={{ backgroundColor: '#112D4E' }}>
              <Link
                href="/settings"
                onClick={() => { setIsProfileMenuOpen(false); onNavigate?.() }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                data-testid="logout-button"
                disabled={isLoggingOut}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors w-full text-left disabled:opacity-60 disabled:cursor-wait"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Logging out…' : 'Log Out'}
              </button>
            </div>
          )}

          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            data-testid="user-menu"
            className="w-full flex items-center gap-3 px-1 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0B2545, #0D8F9C)' }}
            >
              {getInitials()}
            </div>
            <div className="flex flex-col min-w-0 text-left flex-1">
              {preferredName ? (
                <>
                  <span className="text-sm font-bold text-white truncate">{preferredName}</span>
                  {programTrack && graduationDate ? (
                    <span className="text-xs text-[#94A3B8] truncate">
                      {programTrack} &middot; Class of {new Date(graduationDate).getFullYear()}
                    </span>
                  ) : programTrack ? (
                    <span className="text-xs text-[#94A3B8] truncate">{programTrack}</span>
                  ) : graduationDate ? (
                    <span className="text-xs text-[#94A3B8] truncate">
                      Class of {new Date(graduationDate).getFullYear()}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-white">Student Account</span>
                  <span className="text-xs text-[#94A3B8]">{programTrack || 'RN Track'}</span>
                </>
              )}
            </div>
            <ChevronUp className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform duration-200 ${isProfileMenuOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>
    </aside>
  )
}
