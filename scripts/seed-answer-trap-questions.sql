-- ============================================================================
-- Answer Trap Check — Seed Questions (IDEMPOTENT)
-- Run via Supabase SQL Editor AFTER applying supabase_answer_trap_migration.sql
-- Date: 2026-06-18
-- Provides 2 questions per trap type (12 total) for the 3-question check
-- Safe to run multiple times — uses ON CONFLICT DO NOTHING via unique constraint.
-- ============================================================================

-- Add unique constraint on question_stem to prevent duplicates on re-run (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_answer_trap_questions_stem'
      AND conrelid = 'public.answer_trap_questions'::regclass
  ) THEN
    ALTER TABLE public.answer_trap_questions
      ADD CONSTRAINT uq_answer_trap_questions_stem UNIQUE (question_stem);
  END IF;
END $$;

-- ============================================================================
-- Assessment Trap (Assessment-first)
-- ============================================================================

INSERT INTO public.answer_trap_questions (question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix, difficulty, nclex_category) VALUES
(
  'A 68-year-old patient is 4 hours post-hip replacement. The patient becomes pale, restless, and reports increasing abdominal pain. Which action should the nurse take FIRST?',
  '[{"label": "A", "text": "Administer the prescribed PRN pain medication"}, {"label": "B", "text": "Obtain vital signs and assess the surgical site"}, {"label": "C", "text": "Elevate the head of the bed and apply ice"}, {"label": "D", "text": "Notify the surgeon of the patient''s complaints"}]',
  'B',
  'Assessment-first',
  'Assessment Trap',
  'Pallor, restlessness, and new pain after surgery suggest internal bleeding or hemodynamic instability — not simple post-op discomfort.',
  'Obtaining vitals and inspecting the surgical site determines whether this patient is hemorrhaging, which is a life-threatening complication requiring immediate intervention.',
  'Giving pain medication feels responsive to the patient''s complaint, but it treats the symptom without determining whether the patient is bleeding internally.',
  'When a post-op patient develops new or worsening symptoms, assess the cause before treating the symptom.',
  3,
  'Physiological Adaptation'
),
(
  'A patient with type 2 diabetes reports feeling shaky, sweaty, and anxious. The nurse finds the patient pale and trembling. Which action should the nurse take FIRST?',
  '[{"label": "A", "text": "Give the patient orange juice with sugar"}, {"label": "B", "text": "Check the patient''s blood glucose level"}, {"label": "C", "text": "Administer prescribed insulin"}, {"label": "D", "text": "Call the healthcare provider to report symptoms"}]',
  'B',
  'Assessment-first',
  'Assessment Trap',
  'Shakiness, diaphoresis, and anxiety in a diabetic patient suggest hypoglycemia — but similar symptoms can occur with hyperglycemia, anxiety, or other causes.',
  'Checking blood glucose confirms the actual problem before treatment. Treating without data could worsen the situation if the cause is not hypoglycemia.',
  'Giving orange juice feels urgent and caring when you suspect low sugar, but acting without confirming the glucose level risks treating the wrong problem.',
  'Confirm with data before intervening — verify the cause, then treat.',
  3,
  'Pharmacological Therapies'
)
ON CONFLICT (question_stem) DO NOTHING;

-- ============================================================================
-- Priority Trap (Priority-setting)
-- ============================================================================

INSERT INTO public.answer_trap_questions (question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix, difficulty, nclex_category) VALUES
(
  'A nurse receives report on four patients. Which patient should the nurse assess FIRST? (A) Blood glucose 210 mg/dL scheduled for sliding-scale insulin. (B) Chest pain 8/10 with diaphoresis starting 20 minutes ago. (C) Surgical wound with moderate serous drainage. (D) Mild nausea after morning chemotherapy.',
  '[{"label": "A", "text": "The patient with blood glucose of 210 mg/dL"}, {"label": "B", "text": "The patient with chest pain and diaphoresis"}, {"label": "C", "text": "The patient with surgical wound drainage"}, {"label": "D", "text": "The patient with post-chemotherapy nausea"}]',
  'B',
  'Priority-setting',
  'Priority Trap',
  'New-onset chest pain with diaphoresis suggests a possible myocardial infarction — a time-sensitive, life-threatening emergency.',
  'Acute chest pain with diaphoresis could indicate an MI. Every minute without intervention increases myocardial damage. The other patients are stable or expected.',
  'The elevated glucose feels urgent because it has a number attached, but 210 mg/dL is not immediately life-threatening and can wait for scheduled insulin.',
  'When prioritizing patients, life-threatening and time-sensitive conditions always come before stable or expected findings.',
  3,
  'Management of Care'
),
(
  'A nurse is caring for multiple patients. Which finding requires the nurse to intervene FIRST? (A) A post-op patient requesting pain medication rated 5/10. (B) A patient with COPD whose SpO2 is 89% on room air. (C) A patient with a new order for a stool softener. (D) A patient asking to speak with the dietitian.',
  '[{"label": "A", "text": "Post-op patient with pain rated 5/10"}, {"label": "B", "text": "COPD patient with SpO2 89% on room air"}, {"label": "C", "text": "Patient with new stool softener order"}, {"label": "D", "text": "Patient requesting dietitian consult"}]',
  'B',
  'Priority-setting',
  'Priority Trap',
  'SpO2 of 89% in a COPD patient on room air indicates hypoxemia. While COPD patients tolerate lower saturations, 89% without supplemental oxygen warrants immediate action.',
  'Oxygen saturation below 90% represents a physiological threat. The nurse must intervene with supplemental O2 and further assessment before addressing comfort or administrative requests.',
  'Pain rated 5/10 feels pressing because the patient is asking for help, but moderate pain in a stable post-op patient is not an immediate physiological threat.',
  'Physiological threats (airway, breathing, circulation) take priority over comfort needs, even when comfort requests come first.',
  3,
  'Management of Care'
)
ON CONFLICT (question_stem) DO NOTHING;

-- ============================================================================
-- Safety Trap (Safety)
-- ============================================================================

INSERT INTO public.answer_trap_questions (question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix, difficulty, nclex_category) VALUES
(
  'A nurse is preparing to administer digoxin 0.25 mg to an elderly patient. Before giving the medication, the nurse checks the apical pulse and finds it is 54 beats per minute. Which action should the nurse take?',
  '[{"label": "A", "text": "Administer the digoxin as prescribed"}, {"label": "B", "text": "Hold the digoxin and notify the healthcare provider"}, {"label": "C", "text": "Recheck the pulse in 15 minutes and give if above 50"}, {"label": "D", "text": "Administer half the dose and document the heart rate"}]',
  'B',
  'Safety',
  'Safety Trap',
  'An apical pulse of 54 bpm is below the standard hold parameter of 60 bpm for digoxin — administering could cause dangerous bradycardia or toxicity.',
  'Holding digoxin when HR is below 60 bpm prevents further cardiac suppression. Notifying the provider allows reassessment of the dose or drug continuation.',
  'Rechecking in 15 minutes feels cautious and reasonable, but the rate is already below the safety threshold — the medication should be held now, not delayed.',
  'When a safety parameter is breached (pulse below 60 for digoxin), hold the medication and notify — do not find workarounds.',
  3,
  'Pharmacological Therapies'
),
(
  'A nurse is preparing to discharge a patient who received IV conscious sedation 45 minutes ago. The patient states they feel fine and want to drive home. Which action should the nurse take?',
  '[{"label": "A", "text": "Allow the patient to drive since they report feeling fine"}, {"label": "B", "text": "Require a responsible adult to drive the patient home"}, {"label": "C", "text": "Have the patient walk in the hallway to demonstrate coordination"}, {"label": "D", "text": "Discharge the patient with instructions not to drive for 30 more minutes"}]',
  'B',
  'Safety',
  'Safety Trap',
  'Conscious sedation impairs judgment and motor function for hours after administration — a patient''s self-assessment of readiness is unreliable due to the drug itself.',
  'Standard of care requires a responsible adult driver after conscious sedation, regardless of how the patient feels. Sedation effects can return unpredictably.',
  'Letting the patient walk the hallway feels like a fair compromise, but sedation impairs cognitive function that a walking test cannot measure — reaction time and judgment remain affected.',
  'After sedation, follow the safety protocol (responsible driver required) regardless of patient self-report. The drug impairs the very judgment needed to assess readiness.',
  3,
  'Safety and Infection Control'
)
ON CONFLICT (question_stem) DO NOTHING;

-- ============================================================================
-- Delegation Trap (Delegation)
-- ============================================================================

INSERT INTO public.answer_trap_questions (question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix, difficulty, nclex_category) VALUES
(
  'An RN is delegating tasks to a licensed practical nurse (LPN) and an unlicensed assistive personnel (UAP). Which task is appropriate to delegate to the UAP?',
  '[{"label": "A", "text": "Obtain vital signs on a stable post-operative patient"}, {"label": "B", "text": "Perform a focused respiratory assessment on a patient with pneumonia"}, {"label": "C", "text": "Administer a scheduled oral medication to a stable patient"}, {"label": "D", "text": "Teach a newly diagnosed diabetic patient about insulin injection"}]',
  'A',
  'Delegation',
  'Delegation Trap',
  'Vital signs on a stable patient is a routine, predictable task that does not require clinical judgment — making it appropriate for UAP scope.',
  'UAPs can perform routine data collection (vital signs, I&O, daily weights) on stable patients. Assessment, medication administration, and teaching require licensed judgment.',
  'Administering a scheduled oral medication sounds simple and routine, but medication administration requires licensed personnel who can assess for contraindications and adverse effects.',
  'Delegate routine data collection on stable patients to UAPs. Keep assessment, medications, and teaching with licensed staff.',
  3,
  'Delegation'
),
(
  'A charge nurse must assign staff to care for a patient receiving a blood transfusion. The available staff are an RN with 2 years of experience, a new graduate RN in orientation, an LPN, and a UAP. Who should be assigned to this patient?',
  '[{"label": "A", "text": "The UAP, who can monitor the infusion rate"}, {"label": "B", "text": "The LPN, who can administer IV medications"}, {"label": "C", "text": "The new graduate RN in orientation"}, {"label": "D", "text": "The experienced RN with 2 years of experience"}]',
  'D',
  'Delegation',
  'Delegation Trap',
  'Blood transfusions carry risk of life-threatening reactions requiring rapid assessment and intervention — this requires an experienced RN who can recognize and respond to complications.',
  'Blood transfusions require an RN who can independently assess for transfusion reactions, manage complications, and make rapid clinical decisions without needing guidance.',
  'Assigning the new graduate RN feels reasonable since they are an RN, but a nurse still in orientation may not independently recognize or manage transfusion reactions safely.',
  'High-risk procedures with potential for rapid deterioration should be assigned to experienced staff who can act independently.',
  3,
  'Delegation'
)
ON CONFLICT (question_stem) DO NOTHING;

-- ============================================================================
-- Medication Trap (Medication reasoning)
-- ============================================================================

INSERT INTO public.answer_trap_questions (question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix, difficulty, nclex_category) VALUES
(
  'A patient taking warfarin has an INR of 4.8 (therapeutic range 2.0-3.0). The patient has no signs of active bleeding. Which action should the nurse anticipate?',
  '[{"label": "A", "text": "Administer the next scheduled warfarin dose"}, {"label": "B", "text": "Hold warfarin and monitor; may give vitamin K per provider order"}, {"label": "C", "text": "Administer protamine sulfate immediately"}, {"label": "D", "text": "Increase warfarin dose to bring INR back to therapeutic range"}]',
  'B',
  'Medication reasoning',
  'Medication Trap',
  'An INR of 4.8 is significantly supratherapeutic, indicating excessive anticoagulation and elevated bleeding risk — even without active bleeding, the drug must be held.',
  'Holding warfarin prevents further anticoagulation while the elevated INR resolves. Vitamin K may be given if the provider determines the risk warrants reversal.',
  'Administering protamine sulfate sounds like appropriate reversal, but protamine reverses heparin, not warfarin. This is a common medication class confusion on NCLEX.',
  'Know your reversal agents: vitamin K reverses warfarin, protamine reverses heparin. When a lab value exceeds the therapeutic range, hold the causative drug.',
  3,
  'Pharmacological Therapies'
),
(
  'A nurse is about to administer metoprolol (a beta-blocker) to a patient. Which assessment finding should cause the nurse to hold the medication and notify the provider?',
  '[{"label": "A", "text": "Blood pressure 148/92 mmHg"}, {"label": "B", "text": "Heart rate 52 beats per minute"}, {"label": "C", "text": "Respiratory rate 18 breaths per minute"}, {"label": "D", "text": "Temperature 99.2°F (37.3°C)"}]',
  'B',
  'Medication reasoning',
  'Medication Trap',
  'A heart rate of 52 bpm is bradycardic. Beta-blockers further suppress heart rate — administering at this rate could cause dangerous bradycardia or hemodynamic compromise.',
  'Beta-blockers slow heart rate. With an already bradycardic patient (HR <60), giving metoprolol could lower the rate further to a dangerous level.',
  'The elevated blood pressure (148/92) might seem like a reason to give the medication since beta-blockers treat hypertension, but the bradycardia is the contraindication here.',
  'Before giving rate-lowering medications (beta-blockers, digoxin, calcium channel blockers), always check heart rate. Hold if below 60 bpm.',
  3,
  'Pharmacological Therapies'
)
ON CONFLICT (question_stem) DO NOTHING;

-- ============================================================================
-- Content Trap (Pathophysiology / knowledge gap)
-- ============================================================================

INSERT INTO public.answer_trap_questions (question_stem, options, correct_answer, trap_type, trap_display_name, key_cue, why_correct_short, why_wrong_short, one_line_fix, difficulty, nclex_category) VALUES
(
  'A patient with heart failure is prescribed furosemide (Lasix). Which laboratory value should the nurse monitor most closely?',
  '[{"label": "A", "text": "Serum sodium level"}, {"label": "B", "text": "Serum potassium level"}, {"label": "C", "text": "Serum calcium level"}, {"label": "D", "text": "Blood urea nitrogen (BUN)"}]',
  'B',
  'Pathophysiology / knowledge gap',
  'Content Trap',
  'Furosemide is a loop diuretic that causes significant potassium loss. Hypokalemia can lead to fatal cardiac dysrhythmias — especially dangerous in heart failure patients already on digoxin.',
  'Loop diuretics waste potassium. In heart failure patients, hypokalemia increases digoxin toxicity risk and cardiac irritability. Potassium must be monitored closely.',
  'Monitoring sodium seems logical because diuretics affect fluid balance, but furosemide''s most dangerous electrolyte effect is potassium wasting, not sodium loss.',
  'Loop diuretics (furosemide, bumetanide) waste potassium. Always monitor K+ and watch for signs of hypokalemia (muscle weakness, irregular pulse).',
  3,
  'Pharmacological Therapies'
),
(
  'A patient is admitted with a serum potassium level of 6.2 mEq/L. Which ECG change should the nurse expect to see?',
  '[{"label": "A", "text": "Flattened T waves"}, {"label": "B", "text": "Peaked T waves"}, {"label": "C", "text": "Prolonged QT interval"}, {"label": "D", "text": "ST segment depression"}]',
  'B',
  'Pathophysiology / knowledge gap',
  'Content Trap',
  'Hyperkalemia (K+ >5.0) causes tall, peaked T waves on ECG. At 6.2 mEq/L, the patient is at risk for life-threatening cardiac dysrhythmias.',
  'Hyperkalemia causes characteristic peaked T waves because excess potassium alters cardiac cell repolarization. This is a critical early warning sign before fatal rhythms develop.',
  'Flattened T waves feel like a reasonable answer because they are an ECG change associated with electrolyte imbalance — but flat T waves indicate hypokalemia, the opposite problem.',
  'Hyperkalemia = peaked T waves. Hypokalemia = flattened T waves and U waves. Know the ECG signature for each electrolyte imbalance.',
  3,
  'Reduction of Risk Potential'
)
ON CONFLICT (question_stem) DO NOTHING;

-- ============================================================================
-- End of seed data.
-- Total: 12 questions (2 per trap type across 6 trap types)
-- ============================================================================
