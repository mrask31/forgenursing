'use client'

import { useMemo } from 'react'

interface FollowUpPromptsProps {
  messageContent: string
  onPromptClick: (prompt: string) => void
  isLastMessage?: boolean // Only show on the last assistant message
}

// Generate contextual follow-up prompts based on message content
function generateFollowUpPrompts(content: string): string[] {
  const prompts: string[] = []
  const lowerContent = content.toLowerCase()

  // Detect topic/concept mentions
  const hasConcept = /(concept|topic|idea|principle|theory)/i.test(content)
  const hasMedication = /(medication|drug|med|dose|dosage|administration)/i.test(content)
  const hasPathophysiology = /(pathophysiology|patho|disease|disorder|condition|syndrome)/i.test(content)
  const hasAssessment = /(assessment|symptom|sign|finding|vital|lab)/i.test(content)
  const hasIntervention = /(intervention|treatment|care|nursing action|management)/i.test(content)
  const hasPriority = /(priority|first|immediate|urgent|abc|maslow)/i.test(content)
  const hasNCLEX = /(nclex|question|exam|test|practice)/i.test(content)
  const hasExplanation = /(explain|understand|clarify|break down|step by step)/i.test(content)
  const hasExample = /(example|scenario|case|patient|situation)/i.test(content)

  // General follow-ups (always available)
  prompts.push("Can you give me an example of this?")
  prompts.push("What are the key nursing considerations?")
  prompts.push("How would this appear on NCLEX?")

  // Context-specific prompts
  if (hasMedication) {
    prompts.push("What are the side effects I should watch for?")
    prompts.push("What are the contraindications?")
    prompts.push("How do I prioritize medication administration?")
  }

  if (hasPathophysiology) {
    prompts.push("What are the early warning signs?")
    prompts.push("What complications should I monitor for?")
    prompts.push("How does this relate to other conditions?")
  }

  if (hasAssessment) {
    prompts.push("What other assessments should I perform?")
    prompts.push("What findings would indicate a problem?")
    prompts.push("How do I prioritize these assessments?")
  }

  if (hasIntervention) {
    prompts.push("What are the expected outcomes?")
    prompts.push("What should I monitor after this intervention?")
    prompts.push("Are there any safety considerations?")
  }

  if (hasPriority) {
    prompts.push("Walk me through the priority reasoning")
    prompts.push("What would change the priority?")
    prompts.push("How does this apply to other scenarios?")
  }

  if (hasNCLEX || hasExample) {
    prompts.push("Give me another practice question")
    prompts.push("What are common distractors for this topic?")
    prompts.push("How do I recognize this pattern?")
  }

  if (hasExplanation || hasConcept) {
    prompts.push("Can you break this down further?")
    prompts.push("What's the most important thing to remember?")
    prompts.push("How does this connect to what I already know?")
  }

  // Remove duplicates and limit to 3-4 prompts
  const uniquePrompts = Array.from(new Set(prompts))
  return uniquePrompts.slice(0, 4)
}

export default function FollowUpPrompts({ 
  messageContent, 
  onPromptClick,
  isLastMessage = false 
}: FollowUpPromptsProps) {
  // Only show on the last assistant message
  if (!isLastMessage) return null

  const prompts = useMemo(() => generateFollowUpPrompts(messageContent), [messageContent])

  if (prompts.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <p className="text-xs text-slate-500 mb-2 font-medium">Continue learning:</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              onPromptClick(prompt)
            }}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

