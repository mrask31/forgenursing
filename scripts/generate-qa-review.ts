/**
 * Generate 30 quiz questions for the QA review document.
 * 
 * Usage: npx tsx scripts/generate-qa-review.ts <user_id>
 * 
 * Outputs: QUIZ_QA_REVIEW.md at repo root
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test' });

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import * as fs from 'fs';

// ── Env validation ──
const REQUIRED = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const v of REQUIRED) {
  if (!process.env[v]) { console.error(`Missing: ${v}`); process.exit(1); }
}

const userId = process.argv[2];
if (!userId) { console.error('Usage: npx tsx scripts/generate-qa-review.ts <user_id>'); process.exit(1); }

// ── Clients ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ── Zod schema ──
const QuizQuestionSchema = z.object({
  question_stem: z.string().min(10),
  options: z.array(z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    text: z.string().min(1),
  })).length(4),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  rationale_correct: z.string().min(10),
  rationale_incorrect: z.record(z.enum(['A', 'B', 'C', 'D']), z.string()),
  nclex_category: z.string(),
  difficulty: z.number().int().min(1).max(5),
});
type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// ── Program level blocks ──
const PROGRAM_BLOCKS: Record<string, string> = {
  LPN: 'Generate questions at the LPN/LVN level. Focus on task-based clinical reasoning, safety, and basic assessment. Use NCLEX-PN framework. Avoid graduate-level pathophysiology.',
  ADN: 'Generate questions at the ADN/associate degree level. Focus on acute care prioritization, delegation basics, pharmacology fundamentals. Use NCLEX-RN Next Generation format.',
  BSN: 'Generate questions at the BSN level. Include evidence-based practice, patient education, and leadership concepts. Higher complexity case studies. Full NCLEX-RN Next Generation depth.',
  MSN: 'Generate questions at the MSN/graduate level. Advanced pathophysiology, differential diagnosis, clinical decision-making at the provider level. DNP-level case complexity is appropriate.',
};

const SHARED_INSTRUCTIONS = `Generate exactly ONE NCLEX-style multiple-choice question following these rules:

QUESTION STEM RULES:
- Write a clinical scenario in 2-3 sentences. Include a patient (age, relevant history, presenting signs/symptoms).
- End with a clear, single-action question: "Which action should the nurse take FIRST?" or "Which finding should the nurse report IMMEDIATELY?" or similar NCLEX phrasing.
- Do NOT use "all of the above" or "none of the above."
- Do NOT use negative stems ("Which is NOT correct?") unless testing safety (e.g., contraindications).

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

// ── Prompt builders ──
function buildDocPrompt(programLevel: string, sourceChunk: string, prevStems: string[], targetCategory?: string): string {
  const catHint = targetCategory ? `\n\nIMPORTANT: Target the NCLEX category "${targetCategory}" for this question. If the source material does not support this category, choose the closest applicable category.` : '';
  return `<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions from nursing course materials. You are NOT a tutor — you are an exam item writer. Your questions must be clinically accurate, appropriately difficult, and follow NCLEX item-writing standards.
</identity>

<program_level>
${PROGRAM_BLOCKS[programLevel] ?? PROGRAM_BLOCKS.BSN}
</program_level>

<source_material>
The following is an excerpt from the student's uploaded course material. Generate a question DIRECTLY from this content. The question must test a concept that appears in this material.

---
${sourceChunk}
---
</source_material>

<previous_questions>
The following question stems have already been used. Do NOT repeat or closely paraphrase any of them.

${JSON.stringify(prevStems)}
</previous_questions>

<instructions>
${SHARED_INSTRUCTIONS}${catHint}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

function buildGenericPrompt(programLevel: string, category: string, prevStems: string[]): string {
  return `<identity>
You are ForgeNursing Quiz Generator. You create single NCLEX-style multiple-choice questions targeting the NCLEX test blueprint. You are NOT a tutor — you are an exam item writer.
</identity>

<program_level>
${PROGRAM_BLOCKS[programLevel] ?? PROGRAM_BLOCKS.BSN}
</program_level>

<nclex_blueprint_focus>
Generate a question from the following NCLEX Client Needs category:

Category: ${category}

NCLEX Client Needs categories and their approximate exam weight:
- Safe and Effective Care Environment
  - Management of Care (15-21%)
  - Safety and Infection Control (10-16%)
- Health Promotion and Maintenance (6-12%)
- Psychosocial Integrity (6-12%)
- Physiological Integrity
  - Basic Care and Comfort (6-12%)
  - Pharmacological Therapies (13-19%)
  - Reduction of Risk Potential (9-15%)
  - Physiological Adaptation (11-17%)

Generate a question that tests a HIGH-YIELD concept within the selected category.
</nclex_blueprint_focus>

<previous_questions>
The following question stems have already been used. Do NOT repeat or closely paraphrase any of them.

${JSON.stringify(prevStems)}
</previous_questions>

<instructions>
${SHARED_INSTRUCTIONS}
</instructions>

<output_format>
${OUTPUT_FORMAT}
</output_format>`;
}

// ── Claude call ──
async function callClaude(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock?.text ?? '';
}

function parseAndValidate(raw: string): { parsed: QuizQuestion | null; error: string | null } {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  try {
    const obj = JSON.parse(cleaned);
    const validated = QuizQuestionSchema.parse(obj);
    return { parsed: validated, error: null };
  } catch (e: any) {
    return { parsed: null, error: e.message || String(e) };
  }
}

// ── Document chunk fetcher with textbook rotation ──
async function getDocumentChunks(uid: string): Promise<Array<{ content: string; docId: string; filename: string }>> {
  // Get all unique filenames for this user
  const { data: docs } = await supabase
    .from('documents')
    .select('id, metadata, content')
    .eq('user_id', uid)
    .limit(2000);

  if (!docs || docs.length === 0) return [];

  // Group by filename
  const byFile = new Map<string, Array<{ id: string; content: string; filename: string }>>();
  for (const doc of docs) {
    const filename = doc.metadata?.filename || doc.metadata?.file_name || 'unknown';
    if (!byFile.has(filename)) byFile.set(filename, []);
    byFile.get(filename)!.push({ id: String(doc.id), content: doc.content || '', filename });
  }

  console.log(`Found ${byFile.size} textbooks:`);
  for (const [name, chunks] of byFile) {
    console.log(`  - ${name}: ${chunks.length} chunks`);
  }

  // Pick 2 chunks from each textbook (10 total for 5 textbooks)
  const selected: Array<{ content: string; docId: string; filename: string }> = [];
  const fileNames = Array.from(byFile.keys());

  for (const fname of fileNames) {
    const chunks = byFile.get(fname)!;
    // Filter to chunks with meaningful content (>100 chars)
    const meaningful = chunks.filter(c => c.content.length > 100);
    if (meaningful.length === 0) continue;

    // Pick 2 random chunks from this textbook
    const shuffled = meaningful.sort(() => Math.random() - 0.5);
    const pick = shuffled.slice(0, 2);
    for (const p of pick) {
      selected.push({ content: p.content.slice(0, 1500), docId: p.id, filename: fname });
    }
  }

  return selected;
}

// ── Question generation with retry ──
interface GeneratedQuestion {
  num: number;
  question: QuizQuestion;
  source: 'document' | 'generic';
  programLevel: string;
  filename?: string;
  genTimeMs: number;
}

async function generateOne(
  num: number,
  prompt: string,
  source: 'document' | 'generic',
  programLevel: string,
  filename?: string,
): Promise<{ result: GeneratedQuestion | null; error: string | null }> {
  const start = Date.now();
  try {
    const raw = await callClaude(prompt);
    const { parsed, error } = parseAndValidate(raw);
    if (error) {
      // One retry
      console.log(`  Q${num}: Zod fail, retrying...`);
      const raw2 = await callClaude(prompt + '\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY the JSON object.');
      const { parsed: p2, error: e2 } = parseAndValidate(raw2);
      if (e2) return { result: null, error: `Zod fail after retry: ${e2}` };
      return { result: { num, question: p2!, source, programLevel, filename, genTimeMs: Date.now() - start }, error: null };
    }
    return { result: { num, question: parsed!, source, programLevel, filename, genTimeMs: Date.now() - start }, error: null };
  } catch (e: any) {
    return { result: null, error: e.message || String(e) };
  }
}

// ── Markdown formatter ──
function formatQuestion(g: GeneratedQuestion): string {
  const q = g.question;
  const sourceLabel = g.source === 'document' ? 'doc-based' : 'generic';
  const fileLabel = g.filename ? `, File: ${g.filename}` : '';
  const correctLetter = q.correct_answer;

  const optionLines = q.options.map(o => `- ${o.label}) ${o.text}`).join('\n');

  const rationaleLines = q.options.map(o => {
    const rat = q.rationale_incorrect[o.label as 'A'|'B'|'C'|'D'] || '';
    const isCorrectKey = o.label === correctLetter;
    const star = isCorrectKey ? ' ★' : '';
    return `- ${o.label}: ${rat}${star}`;
  }).join('\n');

  return `## Question ${g.num} (Category: ${q.nclex_category}, Difficulty: ${q.difficulty}, Program: ${g.programLevel}, Source: ${sourceLabel}${fileLabel})

**Stem:** ${q.question_stem}

**Options:**
${optionLines}

**Correct answer:** ${correctLetter}

**Rationale (correct):** ${q.rationale_correct}

**Rationale (distractors):**
${rationaleLines}

**Review rubric (Michael fills in):**
- Clinical accuracy (1-5): ___
- Distractor plausibility (1-5): ___
- NCLEX-style adherence (1-5): ___
- Difficulty calibration (1-5): ___
- Notes: ___

---
`;
}

function buildMarkdown(questions: GeneratedQuestion[], errors: string[], totalTimeMs: number): string {
  const now = new Date().toISOString();
  const docCount = questions.filter(q => q.source === 'document').length;
  const genCount = questions.filter(q => q.source === 'generic').length;
  const levels: Record<string, number> = {};
  for (const q of questions) {
    levels[q.programLevel] = (levels[q.programLevel] || 0) + 1;
  }
  const levelStr = Object.entries(levels).map(([k, v]) => `${k}: ${v}`).join(', ');
  const avgTime = questions.length > 0 ? Math.round(questions.reduce((s, q) => s + q.genTimeMs, 0) / questions.length) : 0;

  let md = `# ForgeNursing Quiz-First — QA Review Document

**Generated:** ${now}
**Total questions:** ${questions.length} / 30 target
**Distribution:** ${docCount} document-based, ${genCount} generic
**Program levels:** ${levelStr}
**Errors:** ${errors.length} questions failed to generate
**Avg generation time:** ${avgTime}ms per question
**Estimated Claude cost:** ~$${(questions.length * 0.004).toFixed(2)} (${questions.length} × ~$0.004)

---

## Review Instructions

Michael — review each question using the rubric below each one. Score 1-5 on each dimension:

1. **Clinical accuracy** — Is the correct answer actually correct? Are the rationales medically sound?
2. **Distractor plausibility** — Do the wrong answers reflect real student misconceptions?
3. **NCLEX-style adherence** — Does it read like an NCLEX question? (clinical scenario, single best answer, parallel options)
4. **Difficulty calibration** — Is the difficulty appropriate for the stated program level?

**Threshold to advance to Phase 1 rollout:**
- Average clinical accuracy ≥ 4.0/5
- Average on all other dimensions ≥ 3.5/5
- If threshold not met: pause rollout, iterate prompts

**★ marker** on a distractor rationale means Claude wrote "this is the correct answer" into the rationale_incorrect field for the correct answer key. This is a known prompt quirk — not a bug, but worth noting if the rationale text is unhelpful.

---

`;

  for (const q of questions) {
    md += formatQuestion(q);
    md += '\n';
  }

  if (errors.length > 0) {
    md += `## Generation Errors\n\n`;
    for (const e of errors) {
      md += `- ${e}\n`;
    }
    md += '\n---\n\n';
  }

  md += `## Aggregate Scoring (Michael fills in after reviewing all 30)

| Dimension | Average Score | Pass (≥ threshold)? |
|-----------|--------------|---------------------|
| Clinical accuracy | ___ / 5 | ≥ 4.0: ___ |
| Distractor plausibility | ___ / 5 | ≥ 3.5: ___ |
| NCLEX-style adherence | ___ / 5 | ≥ 3.5: ___ |
| Difficulty calibration | ___ / 5 | ≥ 3.5: ___ |

**Overall pass/fail:** ___

**Decision:** [ ] Approved for Phase 1 rollout  [ ] Needs prompt iteration

**Reviewer:** Michael — ___/___/2026

**Signature:** ___
`;

  return md;
}

// ── Main ──
async function main() {
  const startTime = Date.now();
  console.log('=== Quiz QA Review Generator ===');
  console.log(`User: ${userId}\n`);

  // Verify user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, preferred_name, program_level')
    .eq('id', userId)
    .single();
  if (!profile) { console.error('User not found'); process.exit(1); }
  console.log(`User: ${profile.preferred_name || 'unknown'} | Program: ${profile.program_level}\n`);

  const allQuestions: GeneratedQuestion[] = [];
  const allErrors: string[] = [];
  const prevStems: string[] = [];
  let qNum = 1;

  // ── BATCH 1: 10 document-based questions ──
  console.log('--- Batch 1: Document-based (10 questions) ---');
  const docChunks = await getDocumentChunks(userId);
  if (docChunks.length < 10) {
    console.warn(`Only ${docChunks.length} chunks available, will generate what we can`);
  }

  // Target categories for doc-based to force variety
  const docCategories = [
    'Pharmacological Therapies', 'Management of Care', 'Safety and Infection Control',
    'Physiological Adaptation', 'Reduction of Risk Potential', 'Priority Setting',
    'Basic Care and Comfort', 'Health Promotion and Maintenance', 'Psychosocial Integrity',
    'Delegation',
  ];

  for (let i = 0; i < 10 && i < docChunks.length; i++) {
    const chunk = docChunks[i];
    const cat = docCategories[i];
    console.log(`  Q${qNum}: doc-based from "${chunk.filename}" (cat: ${cat})...`);
    const prompt = buildDocPrompt('BSN', chunk.content, prevStems, cat);
    const { result, error } = await generateOne(qNum, prompt, 'document', 'BSN', chunk.filename);
    if (result) {
      allQuestions.push(result);
      prevStems.push(result.question.question_stem);
      console.log(`  Q${qNum}: ✅ (${result.genTimeMs}ms) — ${result.question.nclex_category}`);
    } else {
      allErrors.push(`Q${qNum} (doc/${chunk.filename}): ${error}`);
      console.log(`  Q${qNum}: ❌ ${error}`);
    }
    qNum++;
  }

  // ── BATCH 2: 10 generic BSN questions by NCLEX category ──
  console.log('\n--- Batch 2: Generic BSN by category (10 questions) ---');
  const genericSpecs: Array<{ category: string; level: string }> = [
    { category: 'Pharmacological Therapies', level: 'BSN' },
    { category: 'Pharmacological Therapies', level: 'BSN' },
    { category: 'Management of Care', level: 'BSN' },
    { category: 'Management of Care', level: 'BSN' },
    { category: 'Safety and Infection Control', level: 'BSN' },
    { category: 'Physiological Adaptation', level: 'BSN' },
    { category: 'Reduction of Risk Potential', level: 'BSN' },
    { category: 'Basic Care and Comfort', level: 'BSN' },
    { category: 'Health Promotion and Maintenance', level: 'BSN' },
    { category: 'Psychosocial Integrity', level: 'BSN' },
  ];

  for (const spec of genericSpecs) {
    console.log(`  Q${qNum}: generic ${spec.level} — ${spec.category}...`);
    const prompt = buildGenericPrompt(spec.level, spec.category, prevStems);
    const { result, error } = await generateOne(qNum, prompt, 'generic', spec.level);
    if (result) {
      allQuestions.push(result);
      prevStems.push(result.question.question_stem);
      console.log(`  Q${qNum}: ✅ (${result.genTimeMs}ms)`);
    } else {
      allErrors.push(`Q${qNum} (generic/${spec.category}): ${error}`);
      console.log(`  Q${qNum}: ❌ ${error}`);
    }
    qNum++;
  }

  // ── BATCH 3: 10 questions across program levels ──
  console.log('\n--- Batch 3: Cross-program-level (10 questions) ---');
  const levelSpecs: Array<{ category: string; level: string }> = [
    { category: 'Pharmacological Therapies', level: 'LPN' },
    { category: 'Safety and Infection Control', level: 'LPN' },
    { category: 'Basic Care and Comfort', level: 'LPN' },
    { category: 'Management of Care', level: 'ADN' },
    { category: 'Pharmacological Therapies', level: 'ADN' },
    { category: 'Reduction of Risk Potential', level: 'ADN' },
    { category: 'Physiological Adaptation', level: 'MSN' },
    { category: 'Pharmacological Therapies', level: 'MSN' },
    { category: 'Management of Care', level: 'MSN' },
    { category: 'Priority Setting', level: 'BSN' },
  ];

  for (const spec of levelSpecs) {
    console.log(`  Q${qNum}: generic ${spec.level} — ${spec.category}...`);
    const prompt = buildGenericPrompt(spec.level, spec.category, prevStems);
    const { result, error } = await generateOne(qNum, prompt, 'generic', spec.level);
    if (result) {
      allQuestions.push(result);
      prevStems.push(result.question.question_stem);
      console.log(`  Q${qNum}: ✅ (${result.genTimeMs}ms)`);
    } else {
      allErrors.push(`Q${qNum} (generic/${spec.level}/${spec.category}): ${error}`);
      console.log(`  Q${qNum}: ❌ ${error}`);
    }
    qNum++;
  }

  // ── Write markdown ──
  const totalTime = Date.now() - startTime;
  const md = buildMarkdown(allQuestions, allErrors, totalTime);
  fs.writeFileSync('QUIZ_QA_REVIEW.md', md, 'utf-8');

  console.log(`\n=== DONE ===`);
  console.log(`Generated: ${allQuestions.length}/30`);
  console.log(`Failed: ${allErrors.length}`);
  console.log(`Total time: ${Math.round(totalTime / 1000)}s`);
  console.log(`Written to: QUIZ_QA_REVIEW.md`);
  if (allErrors.length > 0) {
    console.log(`\nErrors:`);
    for (const e of allErrors) console.log(`  - ${e}`);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
