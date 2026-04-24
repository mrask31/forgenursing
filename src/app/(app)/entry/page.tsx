import { Suspense } from 'react'
import EntryChoiceClient from './EntryChoiceClient'

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>}>
      <EntryChoiceClient />
    </Suspense>
  )
}
