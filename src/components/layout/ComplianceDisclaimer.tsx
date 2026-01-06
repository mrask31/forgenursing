'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function ComplianceDisclaimer() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if disclaimer has been dismissed
    const hasSeenDisclaimer = localStorage.getItem('forgenursing-compliance-disclaimer-dismissed')
    if (!hasSeenDisclaimer) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('forgenursing-compliance-disclaimer-dismissed', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] sm:text-xs text-slate-500 flex-1 leading-tight">
            <span className="font-medium">Educational use only.</span> Not a medical device. Do not use for real-world medical decisions or patient data.
          </p>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded transition-all"
            aria-label="Dismiss disclaimer"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

