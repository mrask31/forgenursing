'use client'

import { useMemo, useRef } from 'react'
import posthog from 'posthog-js'

interface FollowUpPromptsProps {
  messageContent: string
  onPromptClick: (prompt: string) => void
  isLastMessage?: boolean // Only show on the last assistant message
  activeCourse?: string | null
  activeCourseType?: string | null
}

// Generate contextual follow-up prompts based on message content and active course
function generateFollowUpPrompts(content: string, activeCourse?: string | null, activeCourseType?: string | null): string[] {
  const prompts: string[] = []
  const lowerContent = content.toLowerCase()

  // STATIC PROMPTS (always available)
  const staticPrompts = [
    "Give me an NCLEX question based on this material",
    "Give me a different example"
  ]

  // Detect topic/concept mentions for adaptive prompts
  const hasMedication = /(medication|drug|med|dose|dosage|administration|diuretic|beta-blocker|ace inhibitor|anticoagulant)/i.test(content)
  const hasPathophysiology = /(pathophysiology|patho|disease|disorder|condition|syndrome|failure|congestion)/i.test(content)
  const hasAssessment = /(assessment|symptom|sign|finding|vital|lab|monitor|auscultation|palpation)/i.test(content)
  const hasIntervention = /(intervention|treatment|care|nursing action|management|administer|educate)/i.test(content)
  const hasPriority = /(priority|first|immediate|urgent|abc|maslow|safety)/i.test(content)
  const hasRespiratory = /(respiratory|breathing|oxygen|dyspnea|crackles|wheezing|saturation)/i.test(content)
  const hasComplications = /(complication|risk|adverse|side effect|contraindication|warning)/i.test(content)

  // Heart failure chips are only relevant for adult med-surg courses, not peds/OB/psych
  // Require an explicit "heart failure" mention (not just "cardiac") when course is peds/OB/psych
  const adultCardiacCourses = ['med_surg', 'fundamentals', 'other', undefined, null]
  const isAdultCardiacContext = adultCardiacCourses.includes(activeCourseType as any)
  const hasHeartFailure = isAdultCardiacContext
    ? /(heart failure|cardiac|edema|jugular|hepatomegaly|ascites)/i.test(content)
    : /heart failure/i.test(content) // require explicit "heart failure" for non-adult courses

  // ADAPTIVE PROMPTS (context-specific, choose 2)
  const adaptivePrompts: string[] = []

  if (hasHeartFailure) {
    adaptivePrompts.push("What's the difference between left-sided and right-sided heart failure?")
    adaptivePrompts.push("What nursing interventions are priority for heart failure?")
    adaptivePrompts.push("How do I assess for worsening heart failure?")
  }

  if (hasMedication) {
    adaptivePrompts.push("What are the key side effects I should monitor for?")
    adaptivePrompts.push("What are the contraindications for this medication?")
    adaptivePrompts.push("How do I prioritize medication administration?")
  }

  if (hasPathophysiology && !hasHeartFailure) {
    adaptivePrompts.push("What are the early warning signs of this condition?")
    adaptivePrompts.push("What complications should I monitor for?")
    adaptivePrompts.push("How does this relate to other conditions I've studied?")
  }

  if (hasAssessment) {
    adaptivePrompts.push("What other assessments should I perform?")
    adaptivePrompts.push("What findings would indicate a problem?")
    adaptivePrompts.push("How do I prioritize these assessments using ABCs?")
  }

  if (hasIntervention) {
    adaptivePrompts.push("What are the expected outcomes of this intervention?")
    adaptivePrompts.push("What should I monitor after this intervention?")
    adaptivePrompts.push("Are there any safety considerations I need to know?")
  }

  if (hasPriority) {
    adaptivePrompts.push("Walk me through the priority reasoning step-by-step")
    adaptivePrompts.push("What would change the priority in this scenario?")
    adaptivePrompts.push("How does Maslow's hierarchy apply here?")
  }

  if (hasRespiratory) {
    adaptivePrompts.push("What are the priority assessments for respiratory distress?")
    adaptivePrompts.push("How do I differentiate between different respiratory conditions?")
    adaptivePrompts.push("What interventions are most critical for breathing problems?")
  }

  if (hasComplications) {
    adaptivePrompts.push("What are the most serious complications to watch for?")
    adaptivePrompts.push("How do I recognize early signs of complications?")
  }

  // If no specific context detected, use course-scoped general adaptive prompts
  if (adaptivePrompts.length === 0) {
    if (activeCourseType === 'peds') {
      adaptivePrompts.push("How does this differ between pediatric and adult patients?")
      adaptivePrompts.push("What are the key pediatric nursing considerations here?")
      adaptivePrompts.push("How do I adjust my assessment approach for a child?")
      adaptivePrompts.push("What growth and development factors are relevant?")
    } else if (activeCourseType === 'ob') {
      adaptivePrompts.push("How does this affect the mother and fetus differently?")
      adaptivePrompts.push("What are the priority nursing interventions in obstetrics?")
      adaptivePrompts.push("What maternal changes make this different from other patients?")
      adaptivePrompts.push("How would this present during labor vs. postpartum?")
    } else if (activeCourseType === 'psych') {
      adaptivePrompts.push("How does therapeutic communication apply here?")
      adaptivePrompts.push("What safety considerations are most important?")
      adaptivePrompts.push("How do I approach this using the mental status exam?")
      adaptivePrompts.push("What are the priority nursing diagnoses in this scenario?")
    } else if (activeCourseType === 'pharm') {
      adaptivePrompts.push("What are the key side effects I should monitor for?")
      adaptivePrompts.push("What patient teaching is most important for this drug class?")
      adaptivePrompts.push("How do I prioritize medication administration safely?")
      adaptivePrompts.push("What are the contraindications I need to know?")
    } else if (activeCourseType === 'pathophysiology') {
      adaptivePrompts.push("How does this cellular mechanism lead to the clinical signs we see?")
      adaptivePrompts.push("What compensatory responses does the body activate?")
      adaptivePrompts.push("Walk me through the full disease progression step-by-step")
      adaptivePrompts.push("How would this pathological process appear on an NCLEX question?")
    } else if (activeCourseType === 'community_health') {
      adaptivePrompts.push("How do social determinants of health factor into this?")
      adaptivePrompts.push("What population-level interventions are most effective here?")
      adaptivePrompts.push("How would I assess a community for this health issue?")
      adaptivePrompts.push("How would this appear on an NCLEX community health question?")
    } else {
      adaptivePrompts.push("What are the key nursing considerations here?")
      adaptivePrompts.push("Can you break this down into simpler steps?")
      adaptivePrompts.push("What's the most important thing to remember?")
      adaptivePrompts.push("How would this appear on an NCLEX question?")
    }
  }

  // Combine: 2 static + 2 adaptive (randomly selected from adaptive pool)
  prompts.push(...staticPrompts)
  
  // Randomly select 2 adaptive prompts to ensure variety
  const shuffledAdaptive = [...adaptivePrompts].sort(() => Math.random() - 0.5)
  prompts.push(...shuffledAdaptive.slice(0, 2))

  return prompts
}

export default function FollowUpPrompts({
  messageContent,
  onPromptClick,
  isLastMessage = false,
  activeCourse,
  activeCourseType,
}: FollowUpPromptsProps) {
  const lastChipClickRef = useRef<{ prompt: string; clickedAt: number; count: number } | null>(null)

  // Only show on the last assistant message
  if (!isLastMessage) return null

  const prompts = useMemo(
    () => generateFollowUpPrompts(messageContent, activeCourse, activeCourseType),
    [messageContent, activeCourse, activeCourseType]
  )

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
              const now = Date.now()
              const previous = lastChipClickRef.current
              const repeatCount = previous?.prompt === prompt && now - previous.clickedAt < 5000
                ? previous.count + 1
                : 1

              lastChipClickRef.current = { prompt, clickedAt: now, count: repeatCount }

              if (repeatCount > 1) {
                posthog.capture('tutor_prompt_chip_repeat_clicked', {
                  prompt_text: prompt,
                  repeat_count: repeatCount,
                  ms_since_previous_click: previous ? now - previous.clickedAt : null,
                  active_course_type: activeCourseType ?? null,
                  active_course_present: Boolean(activeCourse),
                  path: typeof window !== 'undefined' ? window.location.pathname : null,
                })
              }

              posthog.capture('tutor_prompt_chip_clicked', {
                prompt_text: prompt,
                prompt_index: index,
                active_course_type: activeCourseType ?? null,
                active_course_present: Boolean(activeCourse),
                path: typeof window !== 'undefined' ? window.location.pathname : null,
              })
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
