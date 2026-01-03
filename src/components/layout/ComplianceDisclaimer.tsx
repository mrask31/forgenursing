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
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-600 flex-1">
            ForgeNursing is an educational tool only. It is not a medical device or clinical support system. Do not use ForgeNursing to make real-world medical decisions or enter real patient data.
          </p>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss disclaimer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

