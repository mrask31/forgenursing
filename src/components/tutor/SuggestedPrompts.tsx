'use client'

import { useEffect } from 'react'
import { GENERAL_TUTOR_PROMPTS, CLASS_TUTOR_PROMPTS, TUTOR_PROMPTS, NOTES_PROMPTS } from '@/lib/constants'
import { inferCourseType } from '@/lib/course-utils'

type Mode = 'tutor'

const SYLLABUS_PROMPTS = [
  "What's due this week based on this syllabus?",
  "List all exam dates and what they cover.",
  "Create a weekly study plan from this syllabus.",
  "Show me all graded items and their percentage weights."
]

const TEXTBOOK_PROMPTS = [
  "Summarize this chapter into a study guide.",
  "Create 10 NCLEX-style questions from this reading.",
  "Explain the most confusing concepts in simple terms.",
  "Pull out the top 5 clinical must-know points."
]

const DEFAULT_FILE_PROMPTS = [
  "Summarize this document for me.",
  "Create a 10-question quiz from this file.",
  "What are the key clinical takeaways?",
  "Explain the most important concepts for my exam."
]

const EXAM_PROMPTS = [
  "Walk me through the highest-yield concepts for this exam.",
  "Create 10 NCLEX-style questions from my exam topics.",
  "Drill me on weak areas and track my confidence.",
  "Help me build a study schedule for this exam.",
]

// Course-type specific starter chip sets
const COURSE_STARTER_PROMPTS: Record<string, string[]> = {
  peds: [
    "Walk me through pediatric assessment priorities",
    "How do I calculate a pediatric medication dose?",
    "What are the developmental milestones I need to know for NCLEX?",
    "Explain a common pediatric condition step-by-step",
    "Quiz me on pediatric nursing priorities",
  ],
  ob: [
    "Walk me through labor and delivery nursing priorities",
    "What are the priority assessments for a postpartum patient?",
    "Explain fetal heart rate monitoring and what to watch for",
    "How do I differentiate normal vs. concerning findings in OB?",
    "Quiz me on maternal-newborn nursing priorities",
  ],
  psych: [
    "Walk me through therapeutic communication techniques",
    "How do I prioritize safety in psychiatric nursing?",
    "Explain the mental status exam step-by-step",
    "What are the priority nursing interventions for a patient in crisis?",
    "Quiz me on psychiatric medications and their nursing considerations",
  ],
  pharm: [
    "Walk me through safe medication administration (the rights)",
    "How do I calculate IV drip rates?",
    "What are the priority drug-drug interactions I need to know?",
    "Help me understand a drug class step-by-step",
    "Quiz me on high-alert medications",
  ],
  med_surg: [
    "Walk me through medical-surgical nursing priorities",
    "Explain a common med-surg condition using ABCs",
    "Help me think through priority setting for multiple patients",
    "What are the most tested med-surg topics on NCLEX?",
    "Quiz me on pathophysiology and nursing interventions",
  ],
  fundamentals: [
    "Walk me through the nursing process step-by-step",
    "Help me understand basic nursing assessment priorities",
    "Explain a fundamental nursing skill and the reasoning behind it",
    "How do I apply ABCs and Maslow to a patient scenario?",
    "Quiz me on fundamental nursing concepts",
  ],
  pathophysiology: [
    "Walk me through the cellular mechanisms of a disease process",
    "Explain how a pathological process leads to clinical manifestations",
    "Help me understand the chain from cellular injury to organ dysfunction",
    "What are the key disease mechanisms I need to know for NCLEX?",
    "Quiz me on pathophysiology — clinical manifestations and underlying causes",
  ],
  community_health: [
    "Walk me through a community health needs assessment",
    "How do social determinants of health affect patient outcomes?",
    "Explain the epidemiological triangle for a communicable disease",
    "What are the priority health promotion strategies for a community?",
    "Quiz me on community and public health nursing priorities",
  ],
}

interface SuggestedPromptsProps {
  mode: Mode
  onPromptSelect: (prompt: string) => void
  isVisible: boolean
  isCompact?: boolean
  onSend?: (prompt: string, intent?: string) => void // Auto-send callback with optional intent
  hasAttachedFiles?: boolean
  attachedContext?: 'none' | 'syllabus' | 'textbook' | 'mixed' // Context based on attached files
  hasActiveExam?: boolean // Exam Mode context
  selectedClassId?: string // Class ID to determine if prompts should be class-specific
  selectedCourseType?: string | null // Course type for course-aware starter chips
  selectedClassCode?: string | null // Course code for keyword-based type inference
  selectedClassName?: string | null // Course name for keyword-based type inference
  lastAssistantMessage?: string // Last assistant message from conversation to generate contextual prompts
  hasExistingConversation?: boolean // Whether there's an active conversation with messages
}

// Generate contextual prompts from last assistant message (similar to FollowUpPrompts logic)
function generateContextualPrompts(lastMessage: string): string[] {
  const prompts: string[] = []
  const lowerContent = lastMessage.toLowerCase()

  // Detect key topics/concepts from the last message
  const hasMedication = /(medication|drug|med|dose|dosage|administration|pharmacology)/i.test(lastMessage)
  const hasPathophysiology = /(pathophysiology|patho|disease|disorder|condition|syndrome|diagnosis)/i.test(lastMessage)
  const hasAssessment = /(assessment|symptom|sign|finding|vital|lab|evaluate)/i.test(lastMessage)
  const hasIntervention = /(intervention|treatment|care|nursing action|management|therapy)/i.test(lastMessage)
  const hasPriority = /(priority|first|immediate|urgent|abc|maslow|most important)/i.test(lastMessage)
  const hasNCLEX = /(nclex|question|exam|test|practice|scenario)/i.test(lastMessage)
  const hasConcept = /(concept|topic|understand|explain|clarify)/i.test(lastMessage)
  const hasComplication = /(complication|risk|side effect|contraindication|warning)/i.test(lastMessage)

  // Build contextual prompts based on detected topics
  if (hasMedication) {
    prompts.push("What are the side effects I should watch for?")
    prompts.push("How do I prioritize medication administration?")
    prompts.push("What are the contraindications for this medication?")
  }

  if (hasPathophysiology) {
    prompts.push("What are the early warning signs of this condition?")
    prompts.push("What complications should I monitor for?")
    prompts.push("How does this relate to other conditions I've studied?")
  }

  if (hasAssessment) {
    prompts.push("What other assessments should I perform?")
    prompts.push("What findings would indicate a problem?")
    prompts.push("How do I prioritize these assessments?")
  }

  if (hasIntervention) {
    prompts.push("What are the expected outcomes of this intervention?")
    prompts.push("What should I monitor after this intervention?")
    prompts.push("Are there any safety considerations?")
  }

  if (hasPriority) {
    prompts.push("Walk me through the priority reasoning step-by-step")
    prompts.push("What would change the priority in different scenarios?")
    prompts.push("How does this apply to other patient situations?")
  }

  if (hasNCLEX || hasConcept) {
    prompts.push("Give me another practice question on this topic")
    prompts.push("What are common distractors for this type of question?")
    prompts.push("Can you break this down further?")
  }

  if (hasComplication) {
    prompts.push("How do I recognize this complication early?")
    prompts.push("What nursing interventions prevent this?")
    prompts.push("What are the priority actions if this occurs?")
  }

  // Add some general follow-ups if we don't have enough
  if (prompts.length < 3) {
    prompts.push("Can you explain this in simpler terms?")
    prompts.push("What's the most important thing to remember?")
    prompts.push("How would this appear on an NCLEX question?")
    prompts.push("Can you give me a practice scenario?")
  }

  // Remove duplicates and limit to 4-5 prompts
  const uniquePrompts = Array.from(new Set(prompts))
  return uniquePrompts.slice(0, 5)
}

export default function SuggestedPrompts({ mode, onPromptSelect, isVisible, isCompact = false, onSend, hasAttachedFiles = false, attachedContext = 'none', hasActiveExam = false, selectedClassId, selectedCourseType, selectedClassCode, selectedClassName, lastAssistantMessage, hasExistingConversation = false }: SuggestedPromptsProps) {
  if (!isVisible) return null

  // Logging for debugging
  useEffect(() => {
  }, [mode, hasAttachedFiles, attachedContext, hasExistingConversation, lastAssistantMessage])

  // Priority Logic:
  // 1. If there's an existing conversation with a last assistant message → Generate contextual prompts
  // 2. If hasActiveExam is true → Exam prompts
  // 3. If hasAttachedFiles is true, branch based on attachedContext
  // 4. If no files attached and no conversation → Use class-specific or General Tutor prompts
  let prompts: string[]
  
  // NEW: Generate contextual prompts from last assistant message if conversation exists
  if (hasExistingConversation && lastAssistantMessage && lastAssistantMessage.trim().length > 0) {
    prompts = generateContextualPrompts(lastAssistantMessage)
  } else if (hasActiveExam) {
    prompts = EXAM_PROMPTS
  } else if (hasAttachedFiles) {
    if (attachedContext === 'syllabus') {
      prompts = SYLLABUS_PROMPTS
    } else if (attachedContext === 'textbook') {
      prompts = TEXTBOOK_PROMPTS
    } else {
      // 'mixed' or unknown context → Default file prompts
      prompts = DEFAULT_FILE_PROMPTS
    }
  } else {
    // No files attached and no existing conversation
    // Resolve effective course type: keyword inference takes priority over stored type
    const inferredType = selectedClassCode != null && selectedClassName != null
      ? inferCourseType(selectedClassCode, selectedClassName)
      : null
    const effectiveCourseType = inferredType ?? selectedCourseType ?? null
    if (selectedClassId && effectiveCourseType && COURSE_STARTER_PROMPTS[effectiveCourseType]) {
      prompts = COURSE_STARTER_PROMPTS[effectiveCourseType]
    } else {
      prompts = selectedClassId ? CLASS_TUTOR_PROMPTS : GENERAL_TUTOR_PROMPTS
    }
  }
  
  // Log which prompt set is being used
  useEffect(() => {
    const isSyllabus = hasAttachedFiles && attachedContext === 'syllabus'
    const isTextbook = hasAttachedFiles && attachedContext === 'textbook'
    const isMixed = hasAttachedFiles && attachedContext === 'mixed'
    const isDefaultFile = hasAttachedFiles && !isSyllabus && !isTextbook
    
    const promptType = isSyllabus ? 'SYLLABUS'
      : isTextbook ? 'TEXTBOOK'
      : isMixed || isDefaultFile ? 'DEFAULT_FILE'
      : 'TUTOR'
    
  }, [hasAttachedFiles, attachedContext, mode])

  const handleClick = (prompt: string) => {
    // If onSend is provided, auto-send immediately
    if (onSend) {
      onSend(prompt)
    } else {
      // Otherwise, just populate the input (legacy behavior)
      onPromptSelect(prompt)
    }
  }

  // Compact mode: single scrollable row (for bottom of screen)
  if (isCompact) {
    return (
      <div className="pb-1">
        <div className="flex flex-row overflow-x-auto gap-1.5 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(prompt)}
              data-testid="study-chip"
              className="inline-flex items-center rounded-full border border-[var(--tutor-border-subtle)] bg-[var(--tutor-surface)] px-3 h-7 text-xs font-medium text-[var(--tutor-text-main)] transition-all hover:bg-[var(--tutor-primary)]/5 hover:border-[var(--tutor-primary)]/30 hover:text-[var(--tutor-primary)] cursor-pointer whitespace-nowrap flex-shrink-0 shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Full mode: wrap layout (for empty state - not used in new design)
  return (
    <div className="pb-4">
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(prompt)}
            data-testid="study-chip"
            className="inline-flex items-center rounded-full border border-[var(--tutor-border-subtle)] bg-[var(--tutor-surface)] px-4 py-2 text-sm font-medium text-[var(--tutor-text-main)] transition-all hover:bg-[var(--tutor-primary)]/5 hover:border-[var(--tutor-primary)]/30 hover:text-[var(--tutor-primary)] cursor-pointer shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

