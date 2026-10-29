'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Calculator, ImagePlus, X, Loader2, Check } from 'lucide-react'
import SuggestedPrompts from '@/components/tutor/SuggestedPrompts'
import { useTutorContext } from './TutorContext'
import MedicalMathCalculator from './MedicalMathCalculator'
import posthog from 'posthog-js'


type Mode = 'tutor'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGES = 3
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

interface PendingImage {
  id: string
  file: File
  preview: string
  base64: string
  mimeType: string
}

interface ChatInterfaceProps {
  mode: Mode
  sessionId?: string
  onSend: (message: string, imageData?: Array<{ base64: string; mimeType: string }>) => Promise<void> | void
  initialPrompt?: string
  attachedFiles?: { id: string, name: string, document_type: string | null }[]
  attachedContext?: 'none' | 'syllabus' | 'textbook' | 'mixed'
  isLoading?: boolean
  messages?: any[]
  onDetach?: (fileId: string) => void
  onAttachFiles?: (files: { id: string, name: string, document_type: string | null }[]) => void
}

export default function ChatInterface({
  mode,
  sessionId,
  onSend,
  initialPrompt,
  attachedFiles = [],
  attachedContext = 'none',
  isLoading = false,
  messages = [],
  onDetach
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const tutorContext = useTutorContext()
  const hasMessages = !!sessionId || (messages && messages.length > 0)
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionStartedRef = useRef(false)
  const [stallNudge, setStallNudge] = useState<string | null>(null)
  const inputFocusedRef = useRef(false)
  const stallNudgeFiredRef = useRef(false)

  const STALL_NUDGE_HINTS = [
    "Still thinking? Try starting with the airway.",
    "What system would you assess first given these symptoms?",
    "Think about ABCs — what's the most immediate threat?",
    "What vital sign change concerns you most here?",
    "Consider: is this patient stable or unstable right now?",
  ]

  // Stall detection: fire event + show nudge if no input for 90 seconds after last assistant message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant') {
      // Reset stall state on new assistant message
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
      setStallNudge(null)
      stallNudgeFiredRef.current = false

      stallTimerRef.current = setTimeout(() => {
        posthog.capture('socratic_stall', { time_spent_seconds: 90 })
        // Only show nudge if input is not focused (user is not typing)
        if (!inputFocusedRef.current && !stallNudgeFiredRef.current) {
          stallNudgeFiredRef.current = true
          const hint = STALL_NUDGE_HINTS[Date.now() % STALL_NUDGE_HINTS.length]
          setStallNudge(hint)
          posthog.capture('socratic_stall_nudge_shown')
        }
      }, 90_000)
    }
    return () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    }
  }, [messages])

  useEffect(() => {
  }, [attachedFiles]);

  useEffect(() => {
    if (!hasMessages && initialPrompt && !inputValue) {
      setInputValue(initialPrompt)
      setTimeout(() => { inputRef.current?.focus() }, 100)
    }
  }, [initialPrompt, hasMessages]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`
    }
  }, [inputValue])

  useEffect(() => {
    return () => { pendingImages.forEach(img => URL.revokeObjectURL(img.preview)) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fileToBase64 = (file: File): Promise<{ base64: string; actualMimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const commaIndex = result.indexOf(',')
        const prefix = result.slice(0, commaIndex)
        const base64 = result.slice(commaIndex + 1)
        const actualMimeType = prefix.match(/data:([^;]+)/)?.[1] || file.type || 'image/jpeg'
        resolve({ base64, actualMimeType })
      }
      reader.onerror = () => reject(new Error('FileReader failed to read image'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const remaining = MAX_IMAGES - pendingImages.length
    if (remaining <= 0) { alert(`Maximum ${MAX_IMAGES} images per message.`); return }
    const filesToProcess = files.slice(0, remaining)
    setIsProcessingImages(true)
    try {
      const newImages: PendingImage[] = []
      for (const file of filesToProcess) {
        const isImageType = file.type === '' || file.type.startsWith('image/')
        if (!isImageType) { alert(`${file.name}: Unsupported format. Please select an image file.`); continue }
        if (file.size > MAX_IMAGE_SIZE) { alert(`${file.name}: File too large. Maximum 10MB per image.`); continue }
        const { base64, actualMimeType } = await fileToBase64(file)
        const preview = URL.createObjectURL(file)
        newImages.push({ id: crypto.randomUUID(), file, preview, base64, mimeType: actualMimeType })
      }
      setPendingImages(prev => [...prev, ...newImages])
    } finally {
      setIsProcessingImages(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    setPendingImages(prev => {
      const removed = prev.find(img => img.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter(img => img.id !== id)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValue.trim() && pendingImages.length === 0) || isLoading) return

    // Reset stall timer on user input
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current)
    setStallNudge(null)
    stallNudgeFiredRef.current = false

    // Track tutor session start on first message
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true
      posthog.capture('nclex_tutor_started', {
        topic: tutorContext.selectedTopicId || 'general',
      })
    }

    const message = inputValue.trim() || (pendingImages.length > 0 ? 'Please analyze this clinical image.' : '')
    const imagePayload = pendingImages.length > 0
      ? pendingImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }))
      : undefined
    // Signal that images are in flight so auto-send doesn't race ahead
    if (imagePayload && imagePayload.length > 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('forgenursing-tutor-has-images', 'true')
    }
    try {
      await onSend(message, imagePayload)
      setInputValue('')
      pendingImages.forEach(img => URL.revokeObjectURL(img.preview))
      setPendingImages([])
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('forgenursing-tutor-has-images')
      }
    } catch (error) {
      console.error('[ChatInterface] Error sending message:', error)
    }
    setTimeout(() => { inputRef.current?.focus() }, 100)
  }

  const handleSuggestionClick = async (prompt: string) => {
    posthog.capture('socratic_hint_requested')
    await onSend(prompt)
  }

  const getPlaceholderText = () => {
    if (pendingImages.length > 0) return "Describe what you'd like to know about this image..."
    if (attachedFiles.length > 0) return "Ask a question about your files..."
    return "Ask a clinical question..."
  }

  return (
    <div className="flex-shrink-0 pt-3 bg-[var(--gray-50)] relative">
      <MedicalMathCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

      {/* Context Pills */}
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-2 mb-2">
          {attachedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-2 rounded-full bg-[var(--teal-light)] border border-[var(--teal)]/20 px-3 py-1 text-xs text-[var(--teal)] shadow-sm transition-all duration-200">
              <span className="truncate max-w-[150px]">{file.name}</span>
              {onDetach && (
                <button onClick={() => onDetach(file.id)} className="hover:text-[var(--navy)] transition-colors" aria-label={`Remove ${file.name}`}>×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Thumbnails */}
      {pendingImages.length > 0 && (
        <div data-testid="image-preview" className="flex gap-2 overflow-x-auto px-2 mb-2">
          {pendingImages.map((img) => (
            <div key={img.id} className="relative flex-shrink-0 group">
              <img src={img.preview} alt={img.file.name} className="w-16 h-16 object-cover rounded-lg border border-[var(--gray-200)]" />
              <button onClick={() => removeImage(img.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--gray-800)] text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" aria-label={`Remove ${img.file.name}`}>
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center truncate rounded-b-lg px-0.5">{img.file.name}</span>
            </div>
          ))}
          {isProcessingImages && (
            <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-dashed border-[var(--gray-200)] bg-[var(--gray-50)]">
              <Loader2 className="w-5 h-5 text-[var(--gray-400)] animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Medical Math Button */}
      <div className="px-2 mb-2 flex justify-center md:justify-start">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsCalculatorOpen(!isCalculatorOpen) }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isCalculatorOpen ? 'bg-[var(--teal-light)] text-[var(--teal)] border border-[var(--teal)]/30' : 'bg-white text-[var(--gray-800)] hover:bg-[var(--teal-light)] hover:text-[var(--teal)] border border-[var(--gray-200)] hover:border-[var(--teal)]/30 shadow-sm'}`}
          aria-label="Toggle Medical Math Calculator"
        >
          <Calculator className="w-3.5 h-3.5" /><span>Medical Math</span>
        </button>
      </div>

      {/* Stall Nudge */}
      {stallNudge && (
        <div className="mx-auto max-w-2xl px-2 mb-2">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-500 italic">
            {stallNudge}
          </div>
        </div>
      )}

      {/* Chat Input Dock */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-lg border border-[var(--gray-200)] px-4 py-2 flex items-center gap-3">
        {/* Image Upload */}
        <div
          style={{ position: 'relative' }}
          className={`rounded-full p-2 text-[var(--gray-400)] hover:bg-[var(--teal-light)] hover:text-[var(--teal)] transition-all duration-200 ${pendingImages.length >= MAX_IMAGES || isProcessingImages ? 'opacity-40 pointer-events-none' : ''}`}
          title={pendingImages.length >= MAX_IMAGES ? `Maximum ${MAX_IMAGES} images` : 'Upload clinical image (EKG, labs, wound photos)'}
          aria-label="Upload clinical image"
        >
          <ImagePlus className="h-5 w-5" />
          <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleImageSelect} />
        </div>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          data-testid="chat-input"
          className="flex-1 max-h-32 min-h-[44px] resize-none bg-white rounded-xl border border-[var(--gray-200)] px-3 py-2 text-sm text-[var(--gray-800)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-[var(--teal)]"
          placeholder={getPlaceholderText()}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // Clear stall nudge when user starts typing
            if (stallNudge) {
              setStallNudge(null)
              stallNudgeFiredRef.current = false
            }
          }}
          onFocus={() => { inputFocusedRef.current = true }}
          onBlur={() => { inputFocusedRef.current = false }}
          disabled={isLoading}
          rows={1}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
        />

        {/* Send Button */}
        <button
          type="submit"
          data-testid="chat-send"
          disabled={isLoading || (!inputValue.trim() && pendingImages.length === 0)}
          className="rounded-lg bg-[var(--teal)] p-2.5 text-white shadow-lg hover:bg-[#0A7A85] transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {isLoading && pendingImages.length > 0 ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </form>

    </div>
  )
}
