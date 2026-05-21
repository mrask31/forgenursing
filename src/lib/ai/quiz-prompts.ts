/**
 * Quiz question generation prompts for ForgeNursing Quiz-First V1
 * Spec reference: QUIZ_FIRST_SPEC.md Sections 4.1–4.3
 */

type ProgramLevel = 'LPN' | 'ADN' | 'BSN' | 'MSN';

const QUIZ_PROGRAM_LEVEL_BLOCKS: Record<ProgramLevel, string> = {
  LPN: 'Generate questions at the LPN/LVN level. Focus on task-based clinical reasoning, safety, and basic assessment. Use NCLEX-PN framework. Avoid graduate-level pathophysiology.',
  ADN: 'Generate questions at the ADN/associate degree level. Focus on acute care prioritization, delegation basics, pharmacology fundamentals. Use NCLEX-RN Next Generation format.',
  BSN: 'Generate questions at the BSN level. Include evidence-based practice, patient education, and leadership concepts. Higher complexity case studies. Full NCLEX-RN Next Generation depth.',
  MSN: 'Generate questions at the MSN/graduate level. Advanced pathophysiology, differential diagnosis, clinical decision-making at the provider level. DNP-level case complexity is appropriate.',
};

const CATEGORY_ROTATION: string[] = [
  'Pharmacological Therapies',
  'Pharmacological Therapies',
  'Management of Care',
  'Management of Care',
  'Physiological Adaptation',
  'Reduction of Risk Potential',
  'Safety and Infection Control',
  'Basic Care and Comfort',
  'Health Promotion and Maintenance',
  'Psychosocial Integrity',
];

export const MISTAKE_TYPES = [
  'Priority-setting',
  'Safety',
  'Assessment-first',
  'Therapeutic communication',
  'Delegation',
  'Medication reasoning',
  'Pathophysiology / knowledge gap',
  'Lab / diagnostic interpretation',
  'Patient education',
] as const;

export function getCategoryForIndex(questionIndex: number, userCategory?: string | null): string {
  if (userCategory) return userCategory;
  return CATEGORY_ROTATION[questionIndex] ?? 'Pharmacological Therapies';
}

const SHARED_INSTRUCTIONS = `Generate exactly ONE NCLEX-style multiple-choice question following these rules:

QUESTION STEM RULES:
- Write a clinical scenario in 2-3 sentences. Include a patient (age, relevant history, presenting signs/symptoms).
- End with a clear, single-action question: "Which action should the nurse take FIRST?" or "Which finding should the nurse report IMMEDIATELY?" or similar NCLEX phrasing.
- Do NOT use "all of the above" or "none of the above."
- Do NOT use negative stems ("Which is NOT correct?") unless testing safety.

QUESTION VARIETY RULES:
- Do NOT reuse or closely paraphrase any blocked/recent question stem provided below.
- Do NOT reuse the same patient scenario, medication/lab pairing, disease process, clinical setting, or priority decision from a blocked/recent question.
- Vary patient age, setting, condition, medication or lab value, nursing action, and clinical priority.
- Avoid defaulting to overused examples. For pharmacology, rotate among medication classes and adverse-effect patterns instead of repeatedly using anticoagulation/INR scenarios.
- If a blocked/recent question uses warfarin, INR, heparin, aPTT, bleeding, or anticoagulation, generate a different pharmacology concept unless the user explicitly selected anticoagulation.

ANSWER OPTIONS RULES:
- Provide exactly 4 options labeled A through D.
- Exactly 1 option is correct. The other 3 are plausible distractors.
- Distractors must reflect COMMON STUDENT MISCONCEPTIONS, not obviously wrong answers.
- Each option should be similar in length and grammatically parallel.
- Randomize the position of the correct answer.

RATIONALE RULES:
- rationale_correct: 2-3 sentences explaining WHY the correct answer is right.
- rationale_incorrect: For EACH wrong option, 1-2 sentences explaining WHY it is wrong and what misconception it targets.

MICRO-FEEDBACK RULES:
Students do not want long feedback by default. Generate short, sharp coaching fields:
- key_cue: 1 short sentence naming the cue the student needed to notice.
- why_correct_short: 1 short sentence explaining why the correct answer works.
- why_wrong_short: 1 short sentence explaining why the most tempting wrong answer pulls students in. Do not mention a specific option letter unless necessary.
- one_line_fix: 1 short coaching sentence the student can remember next time.

CLINICAL JUDGMENT MISTAKE METADATA:
- mistake_type: Assign exactly one value from this list:
  - Priority-setting
  - Safety
  - Assessment-first
  - Therapeutic communication
  - Delegation
  - Medication reasoning
  - Pathophysiology / knowledge gap
  - Lab / diagnostic interpretation
  - Patient education
- reasoning_trap: One plain-language sentence explaining the tempting thinking error.
- fix_instruction: One coaching sentence that teaches the reasoning move for next time.
- retest_focus: A short phrase describing what targeted pattern should be practiced next.

CATEGORY: Assign exactly one NCLEX category from this list:
- Management of Care
- Safety and Infection Control
- Health Promotion and Maintenance
- Psychosocial Integrity
- Basic Care and Comfort
- Pharmacological Therapies
- Reduction of Risk Potential
- Physiological Adaptation
- Priority Setting
- Delegation

DIFFICULTY: Rate 1-5 where:
- 1 = Pure recall
- 2 = Comprehension
- 3 = Application — target most questions here
- 4 = Analysis
- 5 = Synthesis`;

const OUTPUT_FORMAT = `Respond with ONLY valid JSON. No markdown, no explanation, no preamble.

{
  "question_stem": "...",
  "options": [
    {"label": "A", "text": "..."},
    {"label": "B", "text": "..."},
    {"label": "C", "text": "..."},
    {"label": "D", "text": "..."}
  ],
  "correct_answer": "C",
  "rationale_correct": "...",
  "rationale_incorrect": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "nclex_category": "...",
  "difficulty": 3,
  "mistake_type": "Priority-setting",
  "reasoning_trap": "The student may focus on a helpful later task instead of the action that protects the client first.",
  "fix_instruction": "When two actions both seem appropriate, choose the one that addresses the most immediate safety or physiologic threat first.",
  "retest_focus": "priority-setting with immediate safety cues",
  "key_cue": "The client has a new immediate safety cue that changes the priority.",
  "why_correct_short": "This answer addresses the most urgent nursing priority first.",
  "why_wrong_short": "The tempting answer helps later, but it does not address the immediate cue.",
  "one_line_fix": "When two answers sound right, choose the one that handles the most immediate risk first."
}`;

export function buildQuizPrompt(
  programLevel: ProgramLevel,
  sourceChunk: string,
  previousStems: string[] = []
): string {
  const programBlock = QUIZ_PROGRAM_LEVEL_BLOCKS[programLevel] ?? QUIZ_PROGRAM_LEVEL_BLOCKS.ADN;
  const previousStemsJson = previousStems.length > 0 ? JSON.stringify(previousStems) : '[]';

  return `<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions from nursing course materials. You are NOT a tutor — you are an exam item writer and clinical judgment pattern mapper.
</identity>

<program_level>
${programBlock}
</program_level>

<source_material>
Generate a question DIRECTLY from this content. The question must test a concept that appears in this material.

---
${sourceChunk}
---
</source_material>

<blocked_recent_questions>
${previousStemsJson}
</blocked_recent_questions>

<instructions>
${SHARED_INSTRUCTIONS}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

export function buildGenericQuizPrompt(
  programLevel: ProgramLevel,
  category: string,
  previousStems: string[] = []
): string {
  const programBlock = QUIZ_PROGRAM_LEVEL_BLOCKS[programLevel] ?? QUIZ_PROGRAM_LEVEL_BLOCKS.ADN;
  const previousStemsJson = previousStems.length > 0 ? JSON.stringify(previousStems) : '[]';

  return `<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions targeting the NCLEX test blueprint. You are NOT a tutor — you are an exam item writer and clinical judgment pattern mapper.
</identity>

<program_level>
${programBlock}
</program_level>

<nclex_blueprint_focus>
Generate a question from this NCLEX Client Needs category:

Category: ${category}

STRICT CATEGORY LOCK:
- The question must test ${category}.
- The returned JSON field nclex_category must be exactly "${category}".
- Do not drift into another category even if the clinical scenario overlaps with prioritization, safety, labs, or physiology.
</nclex_blueprint_focus>

<blocked_recent_questions>
${previousStemsJson}
</blocked_recent_questions>

<instructions>
${SHARED_INSTRUCTIONS}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

export function buildTargetedMistakePrompt(
  programLevel: ProgramLevel,
  targetMistakeType: string,
  targetFocus: string | null,
  previousStems: string[] = []
): string {
  const programBlock = QUIZ_PROGRAM_LEVEL_BLOCKS[programLevel] ?? QUIZ_PROGRAM_LEVEL_BLOCKS.ADN;
  const previousStemsJson = previousStems.length > 0 ? JSON.stringify(previousStems) : '[]';
  const focusText = targetFocus || `${targetMistakeType} clinical judgment practice`;

  return `<identity>
You are ForgeNursing Quiz Generator. You create targeted NCLEX-style questions that train one specific clinical judgment pattern. You are NOT a tutor — you are an exam item writer and clinical judgment pattern mapper.
</identity>

<program_level>
${programBlock}
</program_level>

<targeted_training_goal>
This is a short 3-question targeted drill from the student's Clinical Judgment Map.

Target mistake type: ${targetMistakeType}
Target focus: ${focusText}

STRICT TARGET LOCK:
- The question must test the target mistake type: ${targetMistakeType}.
- The returned JSON field mistake_type must be exactly "${targetMistakeType}".
- The distractors should make this exact mistake tempting.
- The micro-feedback should teach the cue and reasoning move for this target pattern.
- Use a fresh clinical scenario. Do not repeat earlier stems or the same medication/lab/diagnosis combination.
</targeted_training_goal>

<blocked_recent_questions>
${previousStemsJson}
</blocked_recent_questions>

<instructions>
${SHARED_INSTRUCTIONS}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

export function buildDigDeeperContext(questionData: {
  question_stem: string;
  user_answer: string;
  user_answer_text: string;
  correct_answer: string;
  correct_answer_text: string;
  rationale_correct: string;
  rationale_for_user_answer: string;
  nclex_category: string;
  difficulty: number;
  mistake_type?: string | null;
  reasoning_trap?: string | null;
  fix_instruction?: string | null;
  retest_focus?: string | null;
  source_doc_id?: string | null;
  source_chunk_text?: string | null;
}): string {
  const sourceBlock = questionData.source_doc_id && questionData.source_chunk_text
    ? `\nSOURCE MATERIAL: This question was generated from the student's uploaded document. The relevant excerpt:\n---\n${questionData.source_chunk_text}\n---`
    : '';

  const mistakeBlock = questionData.mistake_type
    ? `\nMISTAKE TYPE: ${questionData.mistake_type}\nREASONING TRAP: ${questionData.reasoning_trap || 'Help the student identify the reasoning trap.'}\nFIX INSTRUCTION: ${questionData.fix_instruction || 'Coach the student toward the correct clinical judgment move.'}\nRETEST FOCUS: ${questionData.retest_focus || 'Practice the same clinical judgment pattern again.'}`
    : '';

  return `<quiz_context>
The student just answered an NCLEX-style practice question incorrectly. They clicked "Fix with Tutor" to understand the reasoning. Use this context to guide a focused exploration of WHY the correct answer is right and WHERE their clinical judgment went wrong.

QUESTION:
${questionData.question_stem}

STUDENT'S ANSWER: ${questionData.user_answer} — "${questionData.user_answer_text}"
CORRECT ANSWER: ${questionData.correct_answer} — "${questionData.correct_answer_text}"

RATIONALE (correct): ${questionData.rationale_correct}
RATIONALE (student's choice): ${questionData.rationale_for_user_answer}

NCLEX CATEGORY: ${questionData.nclex_category}
DIFFICULTY: ${questionData.difficulty}/5
${mistakeBlock}
${sourceBlock}
</quiz_context>

<instructions>
1. Do NOT repeat the question or rationale verbatim — the student already saw it.
2. Start by naming the likely clinical judgment mistake in plain English.
3. Ask the student to explain what made their selected answer feel right.
4. Use the ADPIE framework when useful.
5. Keep it to 2-3 exchanges max. This is a focused fix, not a full tutoring session.
6. End with a CHECK question that tests whether they now understand the distinction.
</instructions>`;
}
