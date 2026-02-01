'use client'

import { useState } from 'react'
import { MessageSquare, Send, Loader2, ArrowLeft, Sparkles } from 'lucide-react'

interface Step2AskProps {
  fileId: string
  fileName: string
  onComplete: (question: string, response: string) => void
  onBack: () => void
}

export default function Step2Ask({ fileId, fileName, onComplete, onBack }: Step2AskProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate suggested questions based on file name
  const suggestedQuestions = [
    `Help me understand the key concepts from ${fileName}`,
    `What are the most important topics I should focus on?`,
    `Can you explain the main ideas in simple terms?`,
    `What should I know for my NCLEX exam from this material?`,
  ]

  const handleSubmit = async (questionText: string) => {
    if (!questionText.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Create a new chat session
      const chatId = crypto.randomUUID()

      // Send the question to the chat API with the uploaded file attached
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: questionText }],
          chatId,
          strictMode: false,
          filterMode: 'mixed',
          selectedDocIds: [],
          mode: 'tutor',
          attachedFileIds: [fileId],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              // Extract the content from the streaming format
              try {
                const content = line.substring(2).trim()
                if (content && content !== '""') {
                  fullResponse += content.replace(/^"|"$/g, '')
                }
              } catch (e) {
                // Skip malformed lines
              }
            }
          }
        }
      }

      if (!fullResponse) {
        throw new Error('No response received')
      }

      // Save the message to history
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          role: 'user',
          content: questionText,
        }),
      })

      await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          role: 'assistant',
          content: fullResponse,
        }),
      })

      // Complete step 2
      onComplete(questionText, fullResponse)
    } catch (err) {
      console.error('[Step2Ask] Error:', err)
      setError('Failed to get response. Please try again.')
      setLoading(false)
    }
  }

  const handleSuggestedClick = (suggested: string) => {
    setQuestion(suggested)
    handleSubmit(suggested)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to upload
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <MessageSquare className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">
          Ask Your First Question
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Now let's see ForgeNursing in action. Ask a question about{' '}
          <span className="font-semibold text-indigo-600">{fileName}</span>
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Try one of these questions:
        </h3>
        <div className="space-y-2">
          {suggestedQuestions.map((suggested, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedClick(suggested)}
              disabled={loading}
              className="w-full text-left p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">
                  {suggested}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Question Input */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Or ask your own question:
        </h3>
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            disabled={loading}
            className="w-full p-4 pr-12 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all resize-none disabled:opacity-50"
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(question)
              }
            }}
          />
          <button
            onClick={() => handleSubmit(question)}
            disabled={loading || !question.trim()}
            className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-indigo-700 font-medium">
            ForgeNursing is analyzing your material and crafting a response...
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            This may take 10-20 seconds
          </p>
        </div>
      )}
    </div>
  )
}
