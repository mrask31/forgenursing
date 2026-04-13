'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Paperclip, Calculator, ImagePlus, X, Loader2, FileText, Check, CheckCircle, UploadCloud, ChevronLeft, AlertCircle } from 'lucide-react'
import SuggestedPrompts from '@/components/tutor/SuggestedPrompts'
import { useTutorContext } from './TutorContext'
import MedicalMathCalculator from './MedicalMathCalculator'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

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

interface UploadCourse {
  id: string
  code: string
  name: string
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
  onDetach,
  onAttachFiles
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const uploadFileInputRef = useRef<HTMLInputElement>(null)
  const tutorContext = useTutorContext()
  const hasMessages = !!sessionId || (messages && messages.length > 0)

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState<'pick-course' | 'upload'>('pick-course')
  const [courses, setCourses] = useState<UploadCourse[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<UploadCourse | null>(null)
  const [uploadDocType, setUploadDocType] = useState<'syllabus' | 'textbook' | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadedCourseName, setUploadedCourseName] = useState('')

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
    const message = inputValue.trim() || (pendingImages.length > 0 ? 'Please analyze this clinical image.' : '')
    const imagePayload = pendingImages.length > 0
      ? pendingImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }))
      : undefined
    // Signal that images are in flight so auto-send doesn't race ahead
    if (imagePayload && imagePayload.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('forgenursing-tutor-has-images', 'true')
    }
    try {
      await onSend(message, imagePayload)
      setInputValue('')
      pendingImages.forEach(img => URL.revokeObjectURL(img.preview))
      setPendingImages([])
      if (typeof window !== 'undefined') {
        localStorage.removeItem('forgenursing-tutor-has-images')
      }
    } catch (error) {
      console.error('[ChatInterface] Error sending message:', error)
    }
    setTimeout(() => { inputRef.current?.focus() }, 100)
  }

  const handleSuggestionClick = async (prompt: string) => { await onSend(prompt) }

  // === Upload modal logic ===

  const openUploadModal = async () => {
    setIsUploadModalOpen(true)
    setUploadStep('pick-course')
    setSelectedCourse(null)
    setUploadDocType(null)
    setUploadStatus('idle')
    setIsLoadingCourses(true)
    try {
      const res = await fetch('/api/classes', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const classList = (data.classes || data || []).map((c: any) => ({
          id: c.id,
          code: c.code || '',
          name: c.name || '',
        }))
        setCourses(classList)
      }
    } catch (error) {
      console.error('[ChatInterface] Failed to fetch courses:', error)
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const closeUploadModal = () => {
    setIsUploadModalOpen(false)
    setSelectedCourse(null)
    setUploadDocType(null)
    setUploadStatus('idle')
    setIsUploading(false)
  }

  const selectCourse = (course: UploadCourse) => {
    setSelectedCourse(course)
    setUploadStep('upload')
    setUploadDocType(null)
    setUploadStatus('idle')
  }

  const handleDocUpload = async (file: File) => {
    if (!uploadDocType || !selectedCourse) return

    const fileExtension = file.name.toLowerCase().split('.').pop()
    const fileType = file.type

    if (fileExtension === 'doc') {
      alert('Please save as .docx or PDF. Legacy .doc files are not supported.')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(fileType) && fileExtension !== 'pdf' && fileExtension !== 'docx') {
      alert('Please upload a PDF or DOCX file.')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')

    try {
      const buffer = await file.arrayBuffer()
      let text = ''

      if (fileExtension === 'pdf' || fileType === 'application/pdf') {
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n\n'
        }
      } else if (fileExtension === 'docx' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer })
        text = result.value
        text = text.replace(/\n{3,}/g, '\n\n')
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the document')
      }

      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          filename: file.name,
          document_type: uploadDocType,
          class_id: selectedCourse.id
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || 'Upload failed')
      }

      setUploadedCourseName(selectedCourse.name || selectedCourse.code)
      setUploadStatus('success')

      // If uploaded course matches the active session course, bring file into context
      if (tutorContext.selectedClassId === selectedCourse.id && onAttachFiles) {
        // Wait a moment for processing, then fetch updated binder files for this class
        setTimeout(async () => {
          try {
            const binderRes = await fetch('/api/binder', { credentials: 'include' })
            if (binderRes.ok) {
              const binderData = await binderRes.json()
              const allFiles = binderData.files || []
              // Find the newly uploaded file
              const classFiles = allFiles
                .filter((f: any) => {
                  const fClassId = f.metadata?.class_id || f.class_id || f.metadata?.classId
                  return fClassId === selectedCourse.id
                })
                .map((f: any) => ({
                  id: f.canonicalId || f.id || '',
                  name: f.filename || f.name || 'Unknown',
                  document_type: f.document_type ?? null,
                }))
                .filter((f: any) => f.id)

              // Merge with existing attached files (avoid duplicates)
              const existingIds = new Set(attachedFiles.map(f => f.id))
              const newFiles = classFiles.filter((f: any) => !existingIds.has(f.id))
              if (newFiles.length > 0) {
                onAttachFiles([...attachedFiles, ...newFiles])
              }
            }
          } catch (err) {
            console.error('[ChatInterface] Failed to refresh binder after upload:', err)
          }
        }, 2000)
      }

      // Auto-close after showing success
      setTimeout(() => { closeUploadModal() }, 3000)

    } catch (error: any) {
      console.error('[ChatInterface] Upload error:', error)
      setUploadStatus('error')
      alert(error.message || 'Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      if (uploadFileInputRef.current) uploadFileInputRef.current.value = ''
    }
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

      {/* Chat Input Dock */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-lg border border-[var(--gray-200)] px-4 py-2 flex items-center gap-3">
        {/* Paperclip — opens upload modal */}
        <button
          type="button"
          onClick={openUploadModal}
          className="rounded-full p-2 text-[var(--gray-400)] hover:bg-[var(--teal-light)] hover:text-[var(--teal)] transition-all duration-200"
          aria-label="Upload materials"
          title="Upload Materials"
        >
          <Paperclip className="h-5 w-5" />
        </button>

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
          onChange={(e) => setInputValue(e.target.value)}
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

      {/* Upload Materials Modal */}
      {isUploadModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeUploadModal} />
          <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-lg bg-white rounded-xl border border-[var(--gray-200)] shadow-xl max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--gray-200)] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                {uploadStep === 'upload' && selectedCourse && (
                  <button
                    onClick={() => { setUploadStep('pick-course'); setSelectedCourse(null); setUploadDocType(null); setUploadStatus('idle') }}
                    className="p-1 rounded hover:bg-[var(--gray-100)] text-[var(--gray-400)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-sm font-semibold text-[var(--gray-800)]">
                  {uploadStep === 'pick-course' ? 'Upload Materials' : `Upload to ${selectedCourse?.code || ''}`}
                </h3>
              </div>
              <button onClick={closeUploadModal} className="p-1 rounded hover:bg-[var(--gray-100)]">
                <X className="w-4 h-4 text-[var(--gray-400)]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Step 1: Pick course */}
              {uploadStep === 'pick-course' && (
                <div className="space-y-2">
                  {isLoadingCourses ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-[var(--teal)] animate-spin" />
                    </div>
                  ) : courses.length === 0 ? (
                    <p className="text-sm text-[var(--gray-400)] text-center py-8">
                      No courses found. Create a course in My Courses first.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--gray-400)] mb-3">Select which course to upload to:</p>
                      {courses.map(course => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => selectCourse(course)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-[var(--gray-200)] hover:border-[var(--teal)]/40 hover:bg-[var(--teal-light)]/30 text-left transition-colors"
                        >
                          <FileText className="w-4 h-4 text-[var(--gray-400)] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--gray-800)]">{course.code}</p>
                            <p className="text-xs text-[var(--gray-400)] truncate">{course.name}</p>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-[var(--gray-400)] rotate-180" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Pick type + Upload */}
              {uploadStep === 'upload' && selectedCourse && (
                <div className="space-y-4">
                  {uploadStatus === 'success' ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
                      <p className="text-sm font-medium text-[var(--gray-800)]">
                        Added to {uploadedCourseName}
                        {tutorContext.selectedClassId === selectedCourse.id ? ' — using it now' : ''}
                      </p>
                      {tutorContext.selectedClassId !== selectedCourse.id && (
                        <p className="text-xs text-[var(--gray-400)] mt-1">
                          Saved to My Courses. Switch to {selectedCourse.code} to use it.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Document type selector */}
                      <div>
                        <p className="text-xs text-[var(--gray-400)] mb-2">Document type:</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setUploadDocType('syllabus')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${uploadDocType === 'syllabus' ? 'bg-[var(--teal)] text-white' : 'bg-white text-[var(--gray-800)] border border-[var(--gray-200)] hover:border-[var(--teal)]/40'}`}
                          >
                            Syllabus
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadDocType('textbook')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${uploadDocType === 'textbook' ? 'bg-[var(--teal)] text-white' : 'bg-white text-[var(--gray-800)] border border-[var(--gray-200)] hover:border-[var(--teal)]/40'}`}
                          >
                            Textbook / PDF
                          </button>
                        </div>
                      </div>

                      {/* Upload area */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          uploadDocType
                            ? 'border-[var(--teal)]/40 bg-[var(--teal-light)]/20 cursor-pointer hover:border-[var(--teal)]'
                            : 'border-[var(--gray-200)] bg-[var(--gray-50)] opacity-50 cursor-not-allowed'
                        } ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' : ''}`}
                        onClick={() => uploadDocType && !isUploading && uploadFileInputRef.current?.click()}
                      >
                        <input
                          ref={uploadFileInputRef}
                          type="file"
                          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          disabled={!uploadDocType || isUploading}
                          onChange={(e) => {
                            if (e.target.files?.[0] && uploadDocType) {
                              handleDocUpload(e.target.files[0])
                            }
                          }}
                        />
                        {isUploading ? (
                          <>
                            <Loader2 className="w-8 h-8 mx-auto mb-2 text-[var(--teal)] animate-spin" />
                            <p className="text-sm text-[var(--gray-800)] font-medium">Processing your file...</p>
                            <p className="text-xs text-[var(--gray-400)] mt-1">This may take a moment</p>
                          </>
                        ) : uploadStatus === 'error' ? (
                          <>
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                            <p className="text-sm font-medium text-red-700">Upload failed</p>
                            <p className="text-xs text-red-600 mt-1">Please try again</p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8 mx-auto mb-2 text-[var(--teal)]" />
                            <p className="text-sm text-[var(--gray-800)] font-medium">
                              {uploadDocType ? 'Click to upload or drag and drop' : 'Select document type above'}
                            </p>
                            <p className="text-xs text-[var(--gray-400)] mt-1">PDF or DOCX</p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
