/**
 * Quiz question generation prompts for ForgeNursing Quiz-First V1
 * Spec reference: QUIZ_FIRST_SPEC.md Sections 4.1–4.3
 */

type ProgramLevel = 'LPN' | 'ADN' | 'BSN' | 'MSN';

// Program level blocks for quiz generation (mirrors system-prompt.ts)
const QUIZ_PROGRAM_LEVEL_BLOCKS: Record<ProgramLevel, string> = {
  LPN: 'Generate questions at the LPN/LVN level. Focus on task-based clinical reasoning, safety, and basic assessment. Use NCLEX-PN framework. Avoid graduate-level pathophysiology.',
  ADN: 'Generate questions at the ADN/associate degree level. Focus on acute care prioritization, delegation basics, pharmacology fundamentals. Use NCLEX-RN Next Generation format.',
  BSN: 'Generate questions at the BSN level. Include evidence-based practice, patient education, and leadership concepts. Higher complexity case studies. Full NCLEX-RN Next Generation depth.',
  MSN: 'Generate questions at the MSN/graduate level. Advanced pathophysiology, differential diagnosis, clinical decision-making at the provider level. DNP-level case complexity is appropriate.',
};

// NCLEX category rotation for 10-question generic quizzes (mirrors blueprint weighting)
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

/**
 * Get the NCLEX category for a given question index in a generic quiz.
 * If user selected a specific category, all questions use that category.
 */
export function getCategoryForIndex(questionIndex: number, userCategory?: string | null): string {
  if (userCategory) return userCategory;
  return CATEGORY_ROTATION[questionIndex] ?? 'Pharmacological Therapies';
}

const SHARED_INSTRUCTIONS = `Generate exactly ONE NCLEX-style multiple-choice question following these rules:

QUESTION STEM RULES:
- Write a clinical scenario in 2-3 sentences. Include a patient (age, relevant history, presenting signs/symptoms).
- End with a clear, single-action question: "Which action should the nurse take FIRST?" or "Which finding should the nurse report IMMEDIATELY?" or similar NCLEX phrasing.
- Do NOT use "all of the above" or "none of the above."
- Do NOT use negative stems ("Which is NOT correct?") unless testing safety (e.g., contraindications).

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
- Each option should be similar in length (within ~20% word count of each other).
- Options should be grammatically parallel.
- Randomize the position of the correct answer (do not always put it in B or C).

RATIONALE RULES:
- rationale_correct: 2-3 sentences explaining WHY the correct answer is right. Reference the clinical reasoning (ABCs, Maslow, safety, assessment-before-intervention).
- rationale_incorrect: For EACH wrong option, 1-2 sentences explaining WHY it's wrong AND what misconception it targets. Connect back to the correct reasoning.

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
- 1 = Pure recall (definition, normal range)
- 2 = Comprehension (explain why)
- 3 = Application (apply to clinical scenario) — target most questions here
- 4 = Analysis (compare, prioritize, differentiate)
- 5 = Synthesis (complex multi-system, SATA-style reasoning)`;

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
  "difficulty": 3
}`;

/**
 * Build the document-based quiz question generation prompt (Spec Section 4.1)
 */
export function buildQuizPrompt(
  programLevel: ProgramLevel,
  sourceChunk: string,
  previousStems: string[] = []
): string {
  const programBlock = QUIZ_PROGRAM_LEVEL_BLOCKS[programLevel] ?? QUIZ_PROGRAM_LEVEL_BLOCKS.ADN;
  const previousStemsJson = previousStems.length > 0
    ? JSON.stringify(previousStems)
    : '[]';

  return `<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions from nursing course materials. You are NOT a tutor — you are an exam item writer. Your questions must be clinically accurate, appropriately difficult, and follow NCLEX item-writing standards.
</identity>

<program_level>
${programBlock}
</program_level>

<source_material>
The following is an excerpt from the student's uploaded course material. Generate a question DIRECTLY from this content. The question must test a concept that appears in this material.

---
${sourceChunk}
---
</source_material>

<blocked_recent_questions>
The following question stems have already been used in this quiz session or recently used for this student. Do NOT repeat or closely paraphrase any of them. Generate a meaningfully different question, scenario, medication/lab combination, and priority decision.

${previousStemsJson}
</blocked_recent_questions>

<instructions>
${SHARED_INSTRUCTIONS}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

/**
 * Build the generic (no documents) quiz question generation prompt (Spec Section 4.2)
 */
export function buildGenericQuizPrompt(
  programLevel: ProgramLevel,
  category: string,
  previousStems: string[] = []
): string {
  const programBlock = QUIZ_PROGRAM_LEVEL_BLOCKS[programLevel] ?? QUIZ_PROGRAM_LEVEL_BLOCKS.ADN;
  const previousStemsJson = previousStems.length > 0
    ? JSON.stringify(previousStems)
    : '[]';

  return `<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions targeting the NCLEX test blueprint. You are NOT a tutor — you are an exam item writer.
</identity>

<program_level>
${programBlock}
</program_level>

<nclex_blueprint_focus>
Generate a question from the following NCLEX Client Needs category:

Category: ${category}

STRICT CATEGORY LOCK:
- The question must test ${category}.
- The returned JSON field nclex_category must be exactly "${category}".
- Do not drift into another category even if the clinical scenario overlaps with prioritization, safety, labs, or physiology.
- If the selected category is Pharmacological Therapies, the core decision must involve medication administration, adverse effects, contraindications, expected outcomes, drug toxicity, or medication safety.

NCLEX Client Needs categories and their approximate exam weight:
- Safe and Effective Care Environment
  - Management of Care (15-21%): delegation, prioritization, ethical/legal, advocacy, case management
  - Safety and Infection Control (10-16%): standard precautions, fall prevention, restraints, error prevention
- Health Promotion and Maintenance (6-12%): developmental stages, screening, immunizations, lifestyle choices
- Psychosocial Integrity (6-12%): therapeutic communication, crisis intervention, grief/loss, mental health
- Physiological Integrity
  - Basic Care and Comfort (6-12%): nutrition, mobility, elimination, rest/sleep, pain management
  - Pharmacological Therapies (13-19%): medication administration, adverse effects, dosage calculation, expected outcomes
  - Reduction of Risk Potential (9-15%): lab values, diagnostic tests, complications, vital sign changes
  - Physiological Adaptation (11-17%): fluid/electrolyte, emergency response, pathophysiology, medical emergencies

Generate a question that tests a HIGH-YIELD concept within the selected category. Prioritize topics that appear frequently on NCLEX, but do not repeat blocked/recent stems or their same clinical scenario.
</nclex_blueprint_focus>

<blocked_recent_questions>
The following question stems have already been used in this quiz session or recently used for this student. Do NOT repeat or closely paraphrase any of them. Generate a meaningfully different question, scenario, medication/lab combination, and priority decision.

${previousStemsJson}
</blocked_recent_questions>

<instructions>
${SHARED_INSTRUCTIONS}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

/**
 * Build the "Dig Deeper" handoff context for tutor (Spec Section 4.3)
 */
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
  source_doc_id?: string | null;
  source_chunk_text?: string | null;
}): string {
  const sourceBlock = questionData.source_doc_id && questionData.source_chunk_text
    ? `\nSOURCE MATERIAL: This question was generated from the student's uploaded document. The relevant excerpt:\n---\n${questionData.source_chunk_text}\n---`
    : '';

  return `<quiz_context>
The student just answered an NCLEX-style practice question incorrectly. They clicked "Dig Deeper" to understand the reasoning. Use this context to guide a Socratic exploration of WHY the correct answer is right and WHERE their reasoning went wrong.

QUESTION:
${questionData.question_stem}

STUDENT'S ANSWER: ${questionData.user_answer} — "${questionData.user_answer_text}"
CORRECT ANSWER: ${questionData.correct_answer} — "${questionData.correct_answer_text}"

RATIONALE (correct): ${questionData.rationale_correct}
RATIONALE (student's choice): ${questionData.rationale_for_user_answer}

NCLEX CATEGORY: ${questionData.nclex_category}
DIFFICULTY: ${questionData.difficulty}/5
${sourceBlock}
</quiz_context>

<instructions>
1. Do NOT repeat the question or rationale verbatim — the student already saw it.
2. Start by asking the student to explain their reasoning: "Walk me through why you chose ${questionData.user_answer}."
3. Use the ADPIE framework to guide them to the correct reasoning.
4. If source material is present, reference it: "Looking at your notes on [topic]..."
5. Keep it to 2-3 exchanges max. This is a focused dig-in, not a full tutoring session.
6. End with a CHECK question that tests whether they now understand the distinction.
</instructions>`;
}
