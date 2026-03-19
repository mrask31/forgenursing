'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SuggestedPrompts from '@/components/tutor/SuggestedPrompts'

type Mode = 'tutor'

interface TutorLandingProps {
  mode: Mode
  onStartSession: (message: string) => Promise<void>
  attachedFiles?: { id: string, name: string, document_type: string | null }[]
  attachedContext?: 'none' | 'syllabus' | 'textbook' | 'mixed'
  selectedClassId?: string // To differentiate General Tutor from class-specific
  selectedClass?: { code: string; name: string; type?: string } | null // Class info for welcome message
}

export default function TutorLanding({
  mode,
  onStartSession,
  attachedFiles = [],
  attachedContext = 'none',
  selectedClassId,
  selectedClass
}: TutorLandingProps) {
  const router = useRouter()
  const hasAttachedFiles = attachedFiles.length > 0
  const isGeneralTutor = !selectedClassId
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null)
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(false)
  const [randomTopic, setRandomTopic] = useState<string | null>(null)
  const [lastChatMessage, setLastChatMessage] = useState<string | null>(null)
  const [hasAnyMaterials, setHasAnyMaterials] = useState<boolean | null>(null)
  const [hasAnyChats, setHasAnyChats] = useState<boolean | null>(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning."
    if (hour < 17) return "Good afternoon."
    return "Good evening."
  }

  const getMainHeading = () => {
    if (isGeneralTutor) {
      return `${getGreeting()} I'm your General Tutor — ready to help you learn!`
    }
    return `${getGreeting()} What are we studying today?`
  }

  // Fetch last chat and generate welcome message for class-specific landing
  useEffect(() => {
    // Check if user has any materials and chats (for contextual CTAs)
    const checkUserContent = async () => {
      try {
        // Check for materials
        const binderRes = await fetch('/api/binder', { credentials: 'include' })
        if (binderRes.ok) {
          const binderData = await binderRes.json()
          const materials = binderData.files || []
          setHasAnyMaterials(materials.length > 0)
        }

        // Check for chats
        const chatsRes = await fetch('/api/chats/list', { credentials: 'include' })
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json()
          const chats = chatsData.chats || []
          setHasAnyChats(chats.length > 0)
        }
      } catch (error) {
        console.error('[TutorLanding] Error checking user content:', error)
      }
    }

    checkUserContent()

    if (isGeneralTutor || !selectedClassId) {
      setWelcomeMessage(null)
      return
    }

    const generateWelcomeMessage = async () => {
      setIsLoadingWelcome(true)
      try {
        // Get last chat for this class
        const lastChatRes = await fetch(`/api/chats/last?classId=${selectedClassId}`, {
          credentials: 'include'
        })
        
        let lastTopic = null
        let lastAssistantMessage = null
        if (lastChatRes.ok) {
          const lastChatData = await lastChatRes.json()
          lastTopic = lastChatData.lastTopic
          // Try to get the last assistant message from the last chat
          if (lastChatData.lastChatId) {
            try {
              const historyRes = await fetch(`/api/history?id=${lastChatData.lastChatId}`, {
                credentials: 'include'
              })
              if (historyRes.ok) {
                const messages = await historyRes.json()
                if (Array.isArray(messages) && messages.length > 0) {
                  // Find the last assistant message
                  const lastAssistMsg = messages.filter((m: any) => m.role === 'assistant').pop()
                  if (lastAssistMsg?.content) {
                    lastAssistantMessage = lastAssistMsg.content
                  }
                }
              }
            } catch (error) {
              console.error('[TutorLanding] Error fetching last chat message:', error)
            }
          }
        }
        
        setLastChatMessage(lastAssistantMessage)

        // Get class materials to suggest a random topic
        const binderRes = await fetch('/api/binder', { credentials: 'include' })
        let materials: any[] = []
        if (binderRes.ok) {
          const binderData = await binderRes.json()
          materials = (binderData.files || []).filter((f: any) => {
            const fileClassId = f.metadata?.class_id || f.metadata?.classId
            return fileClassId === selectedClassId && f.document_type !== 'syllabus'
          })
        }

        // Pick a random material for topic suggestion
        let topicSuggestion = null
        if (materials.length > 0) {
          const randomMaterial = materials[Math.floor(Math.random() * materials.length)]
          const filename = randomMaterial.filename || randomMaterial.name || 'your materials'
          // Extract a topic from filename (remove extension, clean up)
          topicSuggestion = filename.replace(/\.(pdf|docx?|txt)$/i, '').replace(/[_-]/g, ' ')
        }

        // Build welcome message
        let message = `Welcome back to ${selectedClass?.code || 'your class'}! 👋\n\n`
        
        if (lastTopic) {
          message += `You were last studying: **${lastTopic}**\n\n`
          message += `💡 Want to continue where you left off? Check your **History** tab to open your last chat.\n\n`
        }
        
        if (topicSuggestion) {
          message += `📚 **Suggested topic to explore:**\n`
          message += `"${topicSuggestion}"\n\n`
          message += `I can help you:\n`
          message += `  • Understand key concepts from this topic\n`
          message += `  • Practice NCLEX-style questions\n`
          message += `  • Review step-by-step explanations\n`
          message += `  • Clarify anything you're unsure about\n\n`
        } else {
          message += `I can help you:\n`
          message += `  • Understand concepts from your materials\n`
          message += `  • Practice NCLEX-style questions\n`
          message += `  • Review key topics step-by-step\n`
          message += `  • Clarify anything you're unsure about\n\n`
        }
        
        message += `What would you like to study today?`

        setWelcomeMessage(message)
        setRandomTopic(topicSuggestion)
      } catch (error) {
        console.error('[TutorLanding] Error generating welcome message:', error)
        // Fallback to default message
        setWelcomeMessage(null)
      } finally {
        setIsLoadingWelcome(false)
      }
    }

    generateWelcomeMessage()
  }, [selectedClassId, mode, isGeneralTutor, selectedClass])

  const getSubtext = () => {
    if (isGeneralTutor) {
      return "I can help you with nursing concepts, NCLEX-style questions, clinical scenarios, and study strategies. Ask me anything!"
    }
    return "You can ask about class topics, NCLEX-style questions, or real clinical scenarios."
  }

  const getHelperText = () => {
    if (!isGeneralTutor) {
      return null
    }
    return (
      <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-200 rounded-xl max-w-2xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-indigo-600">💡</span>
          How I can help you:
        </h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Explain concepts:</strong> Ask me to break down any nursing topic step-by-step</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Practice questions:</strong> Request NCLEX-style questions on any subject</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Clinical scenarios:</strong> Work through patient cases and care planning</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-600 mt-0.5">•</span>
            <span><strong>Study strategies:</strong> Get tips on how to study effectively for nursing school</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-600 italic">
          💡 <strong>Tip:</strong> For class-specific help with your uploaded materials, select a class from the dropdown above.
        </p>
      </div>
    )
  }

  const handleSuggestionClick = async (prompt: string) => {
    await onStartSession(prompt)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 py-8 sm:py-12 text-center px-4">
      {/* Primary Text */}
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 max-w-2xl">
        {getMainHeading()}
      </h1>

      {/* Secondary Text */}
      <p className="text-sm sm:text-base text-slate-600 max-w-xl">
        {getSubtext()}
      </p>

      {/* Class-specific Welcome Message */}
      {!isGeneralTutor && selectedClassId && (
        <div className="mt-4 sm:mt-6 w-full max-w-2xl">
          {isLoadingWelcome ? (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-200 rounded-xl">
              <p className="text-slate-600 text-xs sm:text-sm">Loading your study context...</p>
            </div>
          ) : welcomeMessage ? (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-200 rounded-xl text-left welcome-message-card">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-xs sm:text-sm text-slate-700 leading-relaxed max-w-full">
                  {welcomeMessage.split('**').map((part, i) => {
                    // Simple markdown bold rendering
                    if (i % 2 === 1) {
                      return <strong key={i}>{part}</strong>
                    }
                    return <span key={i}>{part}</span>
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Helper Text for General Tutor */}
      <div className="w-full max-w-2xl">
        {getHelperText()}
      </div>

      {/* Contextual CTAs based on user state */}
      {isGeneralTutor && hasAnyMaterials === false && (
        <div className="w-full max-w-2xl mt-4">
          {/* First-Time Guidance Card */}
          <div className="mb-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Not sure where to start?
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              Try asking why one answer is unsafe. This builds clinical judgment faster than memorizing rationales.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSuggestionClick("Why is this answer unsafe?")}
                className="px-4 py-2 bg-white border-2 border-amber-300 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all"
              >
                Why is this answer unsafe?
              </button>
              <button
                onClick={() => handleSuggestionClick("Help me prioritize this scenario")}
                className="px-4 py-2 bg-white border-2 border-amber-300 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all"
              >
                Help me prioritize this scenario
              </button>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Get Started: Upload Your First Material
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              ForgeNursing works best when you upload your textbooks, lecture notes, or syllabus. This helps me provide answers specific to your nursing program.
            </p>
            <button
              onClick={() => router.push('/classes')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Upload Materials →
            </button>
          </div>
        </div>
      )}

      {isGeneralTutor && hasAnyMaterials === true && hasAnyChats === false && (
        <div className="w-full max-w-2xl mt-4">
          {/* First-Time Guidance Card */}
          <div className="mb-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Not sure where to start?
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              Try asking why one answer is unsafe. This builds clinical judgment faster than memorizing rationales.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSuggestionClick("Why is this answer unsafe?")}
                className="px-4 py-2 bg-white border-2 border-amber-300 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all"
              >
                Why is this answer unsafe?
              </button>
              <button
                onClick={() => handleSuggestionClick("Help me prioritize this scenario")}
                className="px-4 py-2 bg-white border-2 border-amber-300 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all"
              >
                Help me prioritize this scenario
              </button>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Ready to Start Studying
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              Great! You've uploaded your materials. Now ask me any question about your nursing content, or try one of the suggested prompts below.
            </p>
            <p className="text-xs text-slate-600 italic">
              💡 Tip: Select a specific class from the dropdown above to study with those materials.
            </p>
          </div>
        </div>
      )}

      {isGeneralTutor && hasAnyChats === true && (
        <div className="w-full max-w-2xl mt-4">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">📖</span>
              Welcome Back!
            </h3>
            <p className="text-sm text-slate-700 mb-3">
              Check your <strong>History</strong> tab to continue where you left off, or start a new conversation below.
            </p>
            <button
              onClick={() => {
                // Trigger history sheet open (you may need to pass a callback prop for this)
                const historyButton = document.querySelector('[data-history-button]') as HTMLButtonElement
                if (historyButton) historyButton.click()
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold underline"
            >
              View Recent Chats →
            </button>
          </div>
        </div>
      )}

      {/* Suggestion Chips - Mode-aware */}
      <div className="w-full">
        <SuggestedPrompts
          mode={mode}
          onPromptSelect={(prompt) => {
            // On landing, clicking a suggestion starts a session
            handleSuggestionClick(prompt)
          }}
          onSend={handleSuggestionClick}
          isVisible={true}
          isCompact={false}
          hasAttachedFiles={hasAttachedFiles}
          attachedContext={attachedContext}
          selectedClassId={selectedClassId}
          selectedCourseType={selectedClass?.type ?? null}
          lastAssistantMessage={lastChatMessage || undefined}
          hasExistingConversation={!!lastChatMessage}
        />
      </div>
    </div>
  )
}

