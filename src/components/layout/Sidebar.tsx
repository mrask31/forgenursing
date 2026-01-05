'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, FileText, Settings, Activity, Bookmark, GraduationCap, Library } from 'lucide-react'
import { useDensity } from '@/contexts/DensityContext'
import { getDensityTokens } from '@/lib/density-tokens'

const NAV_ITEMS = [
  { label: 'Clinical Studio', href: '/tutor', icon: MessageSquare },
  { label: 'My Classes', href: '/classes', icon: GraduationCap },
  { label: 'Dashboard', href: '/readiness', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps = { onNavigate: undefined }) {
  const pathname = usePathname()
  const { density } = useDensity()
  const tokens = getDensityTokens(density)

  return (
    <aside className="flex w-full h-full flex-col bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-indigo-100">
      {/* Sidebar Content */}
      <div className="flex h-full flex-col px-6 py-8">
        <div className="mb-10 px-2">
          {/* Logo or Brand with Icon */}
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-xl font-bold text-white tracking-tight">ForgeNursing</span>
          </div>
        </div>
        
        {/* Nav Container - Increased padding */}
        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/classes' && pathname.startsWith('/classes'))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`
                  group flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md" 
                    : "text-indigo-300 hover:bg-gradient-to-r hover:from-indigo-900/50 hover:to-purple-900/50 hover:text-indigo-100"}
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        {/* User Profile / Footer */}
        <div className="mt-auto pt-6 border-t border-indigo-900/50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-500/50 flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Student Account</span>
              <span className="text-xs text-indigo-300">RN Track</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}