'use client'

import Sidebar from '@/components/layout/Sidebar'
import { DensityProvider } from '@/contexts/DensityContext'
import ComplianceDisclaimer from '@/components/layout/ComplianceDisclaimer'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DensityProvider>
      {/* Top Level Container (Viewport) */}
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <ComplianceDisclaimer />
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-950 text-white rounded-lg shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Column A: Left Sidebar (Navigation) - Hidden on mobile, drawer on mobile when open */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex-shrink-0 bg-indigo-950 border-r border-indigo-900/50 h-full overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-indigo-100 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </aside>
        
        {/* Column B: Main Content Area - Flexible, scrollable */}
        {/* min-h-0 is CRITICAL: allows flex child to shrink below content size, enabling overflow */}
        {/* h-0 with flex-1 ensures the element has a constrained height for children's h-full to work */}
        <main className="flex-1 min-w-0 min-h-0 h-0 overflow-y-auto bg-slate-50 lg:ml-0">
          {children}
        </main>
      </div>
    </DensityProvider>
  )
}
