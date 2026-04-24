import { Suspense } from 'react'
import QuizResultsClient from './QuizResultsClient'

export default function QuizResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading results...</p></div>}>
      <QuizResultsClient />
    </Suspense>
  )
}
