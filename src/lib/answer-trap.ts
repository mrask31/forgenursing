/**
 * Answer Trap Check — shared types, taxonomy, scoring, and explanations.
 * Used by both API routes and client components.
 */

// ============================================================================
// Types
// ============================================================================

export type TrapType =
  | 'Assessment-first'
  | 'Priority-setting'
  | 'Safety'
  | 'Delegation'
  | 'Medication reasoning'
  | 'Therapeutic communication'
  | 'Lab / diagnostic interpretation'
  | 'Patient education'
  | 'Pathophysiology / knowledge gap';

export interface AnswerTrapQuestion {
  id: string;
  question_stem: string;
  options: { label: string; text: string }[];
  correct_answer: string;
  trap_type: TrapType;
  trap_display_name: string;
  key_cue: string;
  why_correct_short: string;
  why_wrong_short: string;
  one_line_fix: string;
  difficulty: number;
  nclex_category: string | null;
}

/** Question as returned to the client (no answer/feedback fields) */
export interface PublicQuestion {
  id: string;
  question_stem: string;
  options: { label: string; text: string }[];
  question_index: number;
}

export interface AnswerFeedback {
  is_correct: boolean;
  correct_answer: string;
  trap_type: string;
  trap_display_name: string;
  key_cue: string;
  why_correct_short: string;
  why_wrong_short: string;
  one_line_fix: string;
}

export interface SessionAnswer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  trap_type: string;
}

export interface TrapResult {
  score: number;
  total: number;
  all_correct: boolean;
  detected_trap: string | null;
  detected_trap_display: string | null;
  trap_explanation: string | null;
  trap_why_tempting: string | null;
  trap_what_to_practice: string | null;
  share_text: string;
}

// ============================================================================
// Taxonomy: internal mistake_type → student-facing display name
// ============================================================================

const TRAP_DISPLAY_MAP: Record<string, string> = {
  'Assessment-first': 'Assessment Trap',
  'Priority-setting': 'Priority Trap',
  'Safety': 'Safety Trap',
  'Delegation': 'Delegation Trap',
  'Medication reasoning': 'Medication Trap',
  'Therapeutic communication': 'Communication Trap',
  'Lab / diagnostic interpretation': 'Lab Trap',
  'Patient education': 'Teaching Trap',
  'Pathophysiology / knowledge gap': 'Content Trap',
};

export function trapDisplayName(mistakeType: string): string {
  return TRAP_DISPLAY_MAP[mistakeType] ?? 'Clinical Judgment Trap';
}

// ============================================================================
// Trap Explanations (used on results page)
// ============================================================================

interface TrapExplanation {
  explanation: string;
  why_tempting: string;
  what_to_practice: string;
}

const TRAP_EXPLANATIONS: Record<string, TrapExplanation> = {
  'Assessment-first': {
    explanation: 'You may tend to jump to intervention before gathering the assessment data needed to act safely.',
    why_tempting: 'Treating the symptom feels responsive and caring — but without assessing first, you cannot confirm what is actually happening.',
    what_to_practice: 'Train yourself to assess before acting when the cause of a condition change is unclear.',
  },
  'Priority-setting': {
    explanation: 'You may tend to pick an action that helps — just not the one that matters FIRST.',
    why_tempting: 'Multiple answers sound correct because they are all reasonable nursing actions. The trap is choosing one that can wait over one that cannot.',
    what_to_practice: 'When multiple actions are correct, identify which patient or problem is most time-sensitive or life-threatening.',
  },
  'Safety': {
    explanation: 'You may tend to miss the answer that prevents harm when a seemingly reasonable alternative exists.',
    why_tempting: 'The wrong answer feels cautious or like a reasonable compromise — but it does not fully eliminate the safety risk.',
    what_to_practice: 'When a safety threshold is breached, follow the protocol that removes the risk entirely rather than finding a workaround.',
  },
  'Delegation': {
    explanation: 'You may tend to assign tasks to the wrong team member based on scope, stability, or complexity.',
    why_tempting: 'The wrong assignment feels logical because the team member seems available or partially qualified — but scope of practice or patient acuity makes it unsafe.',
    what_to_practice: 'Match task complexity and patient stability to the team member with the right scope and experience level.',
  },
  'Medication reasoning': {
    explanation: 'You may tend to miss a medication safety cue — a hold parameter, adverse effect, or reversal agent confusion.',
    why_tempting: 'The wrong answer involves a real medication concept (reversal, dose adjustment, monitoring), but applies the wrong drug, wrong parameter, or wrong action.',
    what_to_practice: 'Before giving any medication, check hold parameters, contraindications, and know which reversal agent matches which drug.',
  },
  'Therapeutic communication': {
    explanation: 'You may tend to explain, teach, or reassure before acknowledging what the patient is feeling.',
    why_tempting: 'Providing information feels helpful and professional — but skipping the emotional acknowledgment closes the patient off from hearing it.',
    what_to_practice: 'When the patient expresses an emotion, acknowledge it first. Then teach.',
  },
  'Lab / diagnostic interpretation': {
    explanation: 'You may tend to miss what an abnormal lab value means for the clinical priority.',
    why_tempting: 'Another answer involves a related concept, but the critical abnormal value is the one that changes what the nurse should do right now.',
    what_to_practice: 'Connect abnormal values to clinical risk — what does this number mean for THIS patient right now?',
  },
  'Patient education': {
    explanation: 'You may tend to miss the most important teaching point for patient safety after discharge.',
    why_tempting: 'The wrong answer involves real patient education content, but it does not address the highest-risk behavior the patient needs to change.',
    what_to_practice: 'Prioritize teaching that prevents the most dangerous outcome — focus on what keeps the patient safest.',
  },
  'Pathophysiology / knowledge gap': {
    explanation: 'You may need to strengthen the underlying clinical concept behind this type of question.',
    why_tempting: 'The wrong answer uses real clinical terminology and sounds plausible, but reflects a common misconception about how the disease or drug actually works.',
    what_to_practice: 'Review the core pathophysiology or pharmacology concept — understand the mechanism, not just the name.',
  },
};

export function getTrapExplanation(trapType: string): TrapExplanation {
  return TRAP_EXPLANATIONS[trapType] ?? {
    explanation: 'A clinical judgment pattern showed up in your answers that is worth practicing.',
    why_tempting: 'The wrong answers feel reasonable because they involve real nursing concepts — but they miss the key clinical cue.',
    what_to_practice: 'Focus on the specific reasoning pattern behind the missed questions.',
  };
}

// ============================================================================
// Scoring Algorithm
// ============================================================================

export function scoreTrap(answers: SessionAnswer[]): TrapResult {
  const total = answers.length;
  const correct = answers.filter(a => a.is_correct).length;
  const missed = answers.filter(a => !a.is_correct);

  // All correct — no trap detected
  if (missed.length === 0) {
    return {
      score: correct,
      total,
      all_correct: true,
      detected_trap: null,
      detected_trap_display: null,
      trap_explanation: null,
      trap_why_tempting: null,
      trap_what_to_practice: null,
      share_text: buildShareText(null, correct, total),
    };
  }

  // Count trap occurrences in missed answers
  const trapCounts: Record<string, number> = {};
  for (const m of missed) {
    trapCounts[m.trap_type] = (trapCounts[m.trap_type] || 0) + 1;
  }

  // Find dominant trap (highest count; ties broken by first occurrence in answers)
  let dominantTrap = missed[0].trap_type;
  let maxCount = 1;
  for (const [trap, count] of Object.entries(trapCounts)) {
    if (count > maxCount) {
      dominantTrap = trap;
      maxCount = count;
    }
  }

  const display = trapDisplayName(dominantTrap);
  const explanation = getTrapExplanation(dominantTrap);

  return {
    score: correct,
    total,
    all_correct: false,
    detected_trap: dominantTrap,
    detected_trap_display: display,
    trap_explanation: explanation.explanation,
    trap_why_tempting: explanation.why_tempting,
    trap_what_to_practice: explanation.what_to_practice,
    share_text: buildShareText(display, correct, total),
  };
}

// ============================================================================
// Share Text Builder
// ============================================================================

function buildShareText(trapDisplay: string | null, score: number, total: number): string {
  if (!trapDisplay) {
    return `I got ${score}/${total} on the NCLEX Answer Trap Check — no obvious trap detected.\nFind yours: forgenursing.com/answer-trap-check`;
  }
  const explanation = TRAP_EXPLANATIONS[
    Object.keys(TRAP_DISPLAY_MAP).find(k => TRAP_DISPLAY_MAP[k] === trapDisplay) ?? ''
  ];
  const shortDesc = explanation?.explanation?.replace('You may tend to ', 'I tend to ') ?? '';
  return `My first NCLEX Answer Trap signal: ${trapDisplay}\n${shortDesc}\nFind yours: forgenursing.com/answer-trap-check`;
}

// ============================================================================
// Rate Limiting Helper
// ============================================================================

export function hashIp(ip: string): string {
  // Simple hash for rate limiting — not cryptographic security
  // Uses a basic string hash since we don't need crypto-grade hashing for rate limits
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export const RATE_LIMIT_MAX_SESSIONS_PER_HOUR = 5;
