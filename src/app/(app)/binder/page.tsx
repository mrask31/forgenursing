'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /binder to /classes since we've unified the experience
export default function BinderPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/classes')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600">Redirecting to My Classes...</p>
      </div>
    </div>
  )
}
