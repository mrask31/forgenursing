// Suggested prompts for Clinical Studio modes

// General Tutor prompts (broad, NCLEX-focused for all nursing students)
export const GENERAL_TUTOR_PROMPTS = [
  "Give me an NCLEX practice question on [topic]",
  "Walk me through an NCLEX-style priority question",
  "Explain a nursing concept step-by-step using ABCs",
  "Help me practice medication dosage calculations",
  "Quiz me on pathophysiology (NCLEX format)",
]

// Class-specific prompts (when a class is selected)
export const CLASS_TUTOR_PROMPTS = [
  "Create NCLEX-style practice questions from this class",
  "Explain key concepts from this class step-by-step",
  "Help me understand the pathophysiology we're covering",
  "Walk me through nursing interventions for this class",
  "Test me on important topics from this class",
]

// Legacy: Keep for backward compatibility
export const TUTOR_PROMPTS = CLASS_TUTOR_PROMPTS

export const REFLECTION_PROMPTS = [
  "How do I manage feeling overwhelmed in clinical?",
  "Help me process a difficult patient interaction.",
  "I feel behind my classmates — help me reframe this.",
  "What's one small win I had this week?",
]

export const NOTES_PROMPTS = [
  "Test me on my uploaded notes — start simple.",
  "Turn my notes into fill-in-the-blank questions.",
  "Quiz me using real-life patient examples.",
  "Help me summarize the MOST important points.",
  "Ask me to teach this topic back to you.",
  "What should I prioritize learning first?",
  "Give me practice until I feel confident.",
]

