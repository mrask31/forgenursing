'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, BookOpen, FileCheck, Loader2, AlertCircle } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'

interface Step1UploadProps {
  onComplete: (fileId: string, fileName: string) => void
  onSkip: () => void
}

export default function Step1Upload({ onComplete, onSkip }: Step1UploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getBrowserClient()

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, Word document, or text file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be signed in to upload files')
        setUploading(false)
        return
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) {
        console.error('[Upload] Error uploading file:', uploadError)
        setError('Failed to upload file. Please try again.')
        setUploading(false)
        return
      }

      // Get the file URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Create document record in database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_key: fileName,
          file_url: publicUrl,
          document_type: 'reference', // Default to reference for onboarding
        })
        .select()
        .single()

      if (docError) {
        console.error('[Upload] Error creating document record:', docError)
        setError('Failed to save document. Please try again.')
        setUploading(false)
        return
      }

      // Trigger processing
      await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docData.id }),
      })

      // Complete step 1
      onComplete(docData.id, file.name)
    } catch (err) {
      console.error('[Upload] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">
          Let's personalize ForgeNursing for you
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Upload a textbook chapter or study guide so ForgeNursing can explain concepts using{' '}
          <span className="font-semibold text-indigo-600">your program's curriculum</span> — not generic content.
        </p>
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm text-indigo-900 font-medium">
            💡 Why upload materials?
          </p>
          <p className="text-sm text-indigo-700 mt-1">
            ForgeNursing uses your textbooks to ground every explanation in what your program teaches. This means better alignment with your exams and clinical training.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInputChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
            <p className="text-slate-600">Uploading and processing your file...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-slate-500">
                Supports PDF, Word, and text files (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Examples */}
      <div className="mt-8 p-6 bg-slate-100 rounded-xl">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Great materials to start with:
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>A chapter from your Med-Surg or Fundamentals textbook</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>Lecture notes from your current nursing class</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>Study guides or review sheets from your program</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 font-bold">•</span>
            <span>Clinical practice guidelines or care plans</span>
          </li>
        </ul>
      </div>

      {/* Skip Button */}
      <div className="mt-6 text-center">
        <button
          onClick={onSkip}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Skip for now — I'll upload later
        </button>
      </div>
    </div>
  )
}
