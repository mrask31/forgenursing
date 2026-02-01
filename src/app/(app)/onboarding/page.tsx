'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/client'
import Step1Upload from '@/components/onboarding/Step1Upload'
import Step2Ask from '@/components/onboarding/Step2Ask'
import Step3Magic from '@/components/onboarding/Step3Magic'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [firstQuestion, setFirstQuestion] = useState<string | null>(null)
  const [firstResponse, setFirstResponse] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getBrowserClient()

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Not authenticated, redirect to signup
          router.push('/signup')
          return
        }

        // Check onboarding status
        const response = await fetch('/api/onboarding/status')
        const data = await response.json()

        if (data.completed || data.skipped) {
          // Already completed onboarding, redirect to tutor
          router.push('/tutor')
          return
        }

        // Set current step from API
        setCurrentStep(data.step || 1)
        setLoading(false)
      } catch (error) {
        console.error('[Onboarding] Error checking status:', error)
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [router, supabase])

  const handleStep1Complete = async (fileId: string, fileName: string) => {
    setUploadedFileId(fileId)
    setUploadedFileName(fileName)
    
    // Update onboarding step in database
    await fetch('/api/onboarding/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 2 }),
    })
    
    setCurrentStep(2)
  }

  const handleStep2Complete = async (question: string, response: string) => {
    setFirstQuestion(question)
    setFirstResponse(response)
    
    // Update onboarding step in database
    await fetch('/api/onboarding/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 3 }),
    })
    
    setCurrentStep(3)
  }

  const handleStep3Complete = async () => {
    // Mark onboarding as completed
    await fetch('/api/onboarding/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    
    // Redirect to tutor
    router.push('/tutor')
  }

  const handleSkip = async () => {
    // Mark onboarding as skipped
    await fetch('/api/onboarding/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skipped: true }),
    })
    
    // Redirect to tutor
    router.push('/tutor')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-slate-900">
              Getting Started
            </h2>
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step <= currentStep
                    ? 'bg-indigo-600'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              Step {currentStep} of 3
            </p>
            <p className="text-xs text-slate-500">
              {currentStep === 1 && 'Upload your first material'}
              {currentStep === 2 && 'Ask your first question'}
              {currentStep === 3 && 'See the magic'}
            </p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <Step1Upload onComplete={handleStep1Complete} onSkip={handleSkip} />
        )}
        {currentStep === 2 && uploadedFileId && uploadedFileName && (
          <Step2Ask
            fileId={uploadedFileId}
            fileName={uploadedFileName}
            onComplete={handleStep2Complete}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && firstResponse && (
          <Step3Magic
            response={firstResponse}
            onComplete={handleStep3Complete}
          />
        )}
      </div>
    </div>
  )
}
