// Server-only teaching content; answer keys are exposed only through graded API feedback.
import type { DemoLesson } from "./demo-lessons";

export const ADDITIONAL_DEMO_LESSONS: DemoLesson[] = [
  {
    "sourceStem": "An adult taking digoxin has a potassium level of 3.0 mEq/L. Which new finding most strongly suggests digoxin toxicity?",
    "topic": "Digoxin toxicity",
    "trap_type": "Medication reasoning",
    "sources": [
      {
        "title": "DailyMed: Digoxin prescribing information",
        "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ce62a741-a981-4880-8ce3-93269606a730"
      }
    ],
    "initial": {
      "question_stem": "An adult taking digoxin has a potassium level of 3.0 mEq/L. Which new finding most strongly suggests digoxin toxicity?",
      "options": [
        {
          "label": "A",
          "text": "Increased appetite and weight gain"
        },
        {
          "label": "B",
          "text": "Seeing yellow-green halos around lights"
        },
        {
          "label": "C",
          "text": "Increased urine output"
        },
        {
          "label": "D",
          "text": "An unchanged pulse of 76/min"
        }
      ],
      "correct_answer": "B",
      "key_cue": "Potassium is low, and the visual disturbance is new.",
      "why_correct_short": "Yellow-green color changes and halos are recognized digoxin adverse effects that raise concern for toxicity. Low potassium increases susceptibility; toxicity can occur at lower serum digoxin concentrations.",
      "rationales": {
        "A": "Loss of appetite, nausea, and vomiting are associated with toxicity; increased appetite is not the characteristic finding.",
        "C": "Increased urine output alone is not a characteristic toxicity sign and may reflect another treatment or improved circulation.",
        "D": "An unchanged pulse of 76/min does not suggest a new rhythm disturbance. New bradycardia or heart block would also warrant concern; it should not be dismissed as harmless."
      },
      "one_line_fix": "Connect new visual, gastrointestinal, or rhythm changes with medication and electrolyte risk; no single sign proves toxicity."
    },
    "retry": {
      "question_stem": "An adult taking digoxin reports new nausea and yellow-green vision. Which additional finding increases susceptibility to digoxin toxicity?",
      "options": [
        {
          "label": "A",
          "text": "A potassium level of 4.2 mEq/L"
        },
        {
          "label": "B",
          "text": "An unchanged weight"
        },
        {
          "label": "C",
          "text": "A potassium level of 2.9 mEq/L"
        },
        {
          "label": "D",
          "text": "An unchanged pulse of 78/min"
        }
      ],
      "correct_answer": "C",
      "key_cue": "The patient has new symptoms and low potassium.",
      "why_correct_short": "Hypokalemia increases susceptibility to digoxin toxicity and strengthens concern about the new symptoms.",
      "rationales": {
        "A": "A potassium level of 4.2 mEq/L is not hypokalemia. It does not exclude toxicity, but it is not the added risk in these options.",
        "B": "An unchanged weight does not establish a new risk factor for toxicity.",
        "D": "An unchanged pulse of 78/min is not evidence of a new conduction problem or electrolyte risk."
      },
      "one_line_fix": "Recognize a risk factor without treating a normal finding as proof that toxicity is absent."
    }
  },
  {
    "sourceStem": "A nurse wore gloves, a gown, a face shield, and a mask while providing care. Using CDC’s sequence for removing these PPE items separately, which item is removed first?",
    "topic": "Safe PPE removal",
    "trap_type": "Safety",
    "sources": [
      {
        "title": "CDC: Safe donning and removal of PPE",
        "url": "https://www.cdc.gov/infection-control/hcp/isolation-precautions/appendix-a-figure.html"
      },
      {
        "title": "CDC: PPE removal sequence examples",
        "url": "https://www.cdc.gov/infection-control/media/pdfs/guidelines-ppe-sequence-p.pdf"
      }
    ],
    "initial": {
      "question_stem": "A nurse wore gloves, a gown, a face shield, and a mask while providing care. Using CDC’s sequence for removing these PPE items separately, which item is removed first?",
      "options": [
        {
          "label": "A",
          "text": "Gloves"
        },
        {
          "label": "B",
          "text": "Gown"
        },
        {
          "label": "C",
          "text": "Face shield"
        },
        {
          "label": "D",
          "text": "Mask"
        }
      ],
      "correct_answer": "A",
      "key_cue": "The question specifies removal of PPE items separately.",
      "why_correct_short": "In CDC’s separate-item sequence, gloves are removed first, followed by eye protection, gown, and mask or respirator. Use the prescribed technique to avoid touching contaminated surfaces.",
      "rationales": {
        "B": "Gown removal comes after gloves and eye protection in this specified sequence. A different CDC method removes gown and gloves together.",
        "C": "The face shield is removed after gloves in the separate-item sequence, using its clean headband rather than the contaminated front.",
        "D": "The mask is removed later by its ties or elastics. Removing it first does not follow this specified sequence."
      },
      "one_line_fix": "Follow the specified PPE technique and local policy; perform hand hygiene after removal and between steps if hands become contaminated."
    },
    "retry": {
      "question_stem": "A nurse is removing a used face shield after taking off gloves. Which technique best avoids contact with its contaminated surface?",
      "options": [
        {
          "label": "A",
          "text": "Grasp the front of the shield with bare hands"
        },
        {
          "label": "B",
          "text": "Lift it away using the headband without touching the front"
        },
        {
          "label": "C",
          "text": "Wipe the front with bare fingers before removing it"
        },
        {
          "label": "D",
          "text": "Rest the used shield against the uniform"
        }
      ],
      "correct_answer": "B",
      "key_cue": "The outside of the face shield is contaminated.",
      "why_correct_short": "Handling the headband avoids touching the contaminated front. Place reusable equipment in the designated receptacle for reprocessing.",
      "rationales": {
        "A": "Touching the front can contaminate bare hands.",
        "C": "Wiping with bare fingers brings the hands into contact with the contaminated surface.",
        "D": "Contact with the uniform can transfer contamination to clothing."
      },
      "one_line_fix": "Keep contaminated PPE surfaces away from bare skin and clothing, and perform hand hygiene as indicated."
    }
  },
  {
    "sourceStem": "An RN assigns care for stable medical-surgical patients. The LPN is authorized and competent to give oral medications under local scope and facility policy; the UAP has no medication-administration authorization. Which assignment is appropriate?",
    "topic": "Assigning RN, LPN, and UAP care",
    "trap_type": "Delegation",
    "sources": [
      {
        "title": "NCSBN: National Guidelines for Nursing Delegation",
        "url": "https://www.ncsbn.org/public-files/NCSBN_Delegation_Guidelines.pdf"
      },
      {
        "title": "Texas Board of Nursing: Scope and assessment FAQ",
        "url": "https://www.bon.texas.gov/faq_nursing_practice.asp.html"
      }
    ],
    "initial": {
      "question_stem": "An RN assigns care for stable medical-surgical patients. The LPN is authorized and competent to give oral medications under local scope and facility policy; the UAP has no medication-administration authorization. Which assignment is appropriate?",
      "options": [
        {
          "label": "A",
          "text": "Have the UAP provide initial teaching about a low-sodium diet"
        },
        {
          "label": "B",
          "text": "Have the UAP independently assess pain and decide whether treatment is effective"
        },
        {
          "label": "C",
          "text": "Have the LPN administer scheduled oral medications to a stable patient"
        },
        {
          "label": "D",
          "text": "Have the LPN independently complete the comprehensive admission assessment and establish the nursing care plan"
        }
      ],
      "correct_answer": "C",
      "key_cue": "The patient is stable, and the LPN’s medication task is authorized.",
      "why_correct_short": "Scheduled oral medication administration fits the LPN’s stated scope and competency. The RN remains responsible for appropriate assignment, supervision, and follow-up.",
      "rationales": {
        "A": "Initial teaching requires nursing judgment; it is not assigned to this UAP. Reinforcing established instructions is different from developing teaching.",
        "B": "The UAP may collect and report authorized observations, but independent nursing assessment and evaluation require a licensed nurse.",
        "D": "The comprehensive assessment and independent nursing care plan require RN judgment in this scenario. An LPN may contribute focused assessments and data within local scope."
      },
      "one_line_fix": "Match the patient and task to local scope, demonstrated competence, and supervision; collecting data is different from independent nursing judgment."
    },
    "retry": {
      "question_stem": "Facility policy authorizes a trained UAP to record routine observations. A stable patient reports pain. Which task can the RN delegate to this UAP?",
      "options": [
        {
          "label": "A",
          "text": "Determine why the patient has pain"
        },
        {
          "label": "B",
          "text": "Decide whether to increase the analgesic dose"
        },
        {
          "label": "C",
          "text": "Evaluate the effectiveness of the nursing pain plan"
        },
        {
          "label": "D",
          "text": "Record the patient’s reported pain rating and promptly report it to the RN"
        }
      ],
      "correct_answer": "D",
      "key_cue": "The task is reporting a patient’s statement, not interpreting it.",
      "why_correct_short": "Recording and reporting an authorized observation can be delegated. The RN uses that information to assess the patient and determine follow-up.",
      "rationales": {
        "A": "Determining the cause requires nursing assessment and judgment.",
        "B": "Changing medication dosing is not within this UAP’s role and must follow the prescription and licensed-clinician process.",
        "C": "Evaluating the nursing plan requires nursing judgment, beyond recording an observation."
      },
      "one_line_fix": "Do not confuse collecting a reported pain score with assessing its meaning."
    }
  },
  {
    "sourceStem": "The nurse has four assigned patients. Which patient should the nurse assess first?",
    "topic": "Recognizing a threatened airway",
    "trap_type": "Priority-setting",
    "sources": [
      {
        "title": "Merck Manual Professional: Stridor",
        "url": "https://www.merckmanuals.com/professional/pulmonary-disorders/symptoms-of-pulmonary-disorders/stridor"
      }
    ],
    "initial": {
      "question_stem": "The nurse has four assigned patients. Which patient should the nurse assess first?",
      "options": [
        {
          "label": "A",
          "text": "A patient with blood pressure 150/92 mm Hg and no symptoms"
        },
        {
          "label": "B",
          "text": "A postoperative patient with new inspiratory stridor"
        },
        {
          "label": "C",
          "text": "A stable patient with a stage 2 pressure injury requesting a scheduled dressing change"
        },
        {
          "label": "D",
          "text": "A patient with mild nausea after an antiemetic and no other symptoms"
        }
      ],
      "correct_answer": "B",
      "key_cue": "The postoperative patient has new inspiratory stridor.",
      "why_correct_short": "New inspiratory stridor suggests upper-airway narrowing and may indicate an impending airway emergency. It takes priority over the stable findings listed.",
      "rationales": {
        "A": "The elevated blood pressure needs follow-up, but the scenario describes no acute symptoms or threatened airway.",
        "C": "The dressing change is needed, but routine wound care can wait while the nurse assesses a possible airway emergency.",
        "D": "Mild nausea without other symptoms is less urgent than new stridor."
      },
      "one_line_fix": "Prioritize a new, potentially time-sensitive threat over stable findings; seek immediate help when airway compromise is suspected."
    },
    "retry": {
      "question_stem": "Which patient needs immediate nursing assessment?",
      "options": [
        {
          "label": "A",
          "text": "A recently extubated patient with new high-pitched inspiratory noise and difficulty breathing"
        },
        {
          "label": "B",
          "text": "A stable patient waiting for a routine dressing change"
        },
        {
          "label": "C",
          "text": "A patient with unchanged chronic back pain awaiting scheduled medication"
        },
        {
          "label": "D",
          "text": "A patient asking about tomorrow’s discharge time"
        }
      ],
      "correct_answer": "A",
      "key_cue": "The breathing change is new after extubation.",
      "why_correct_short": "New stridor with difficulty breathing after extubation can signal upper-airway compromise and requires immediate assessment and escalation.",
      "rationales": {
        "B": "Routine wound care does not outrank new breathing difficulty.",
        "C": "Unchanged chronic pain needs care, but the new breathing problem is more urgent.",
        "D": "Discharge planning can wait during assessment of a possible airway emergency."
      },
      "one_line_fix": "Assess the whole breathing pattern and its timing; do not wait for a definitive diagnosis before escalating a threatened airway."
    }
  },
  {
    "sourceStem": "A patient with type 1 diabetes has a prescribed subcutaneous mealtime dose of insulin lispro (Humalog). The nurse has checked glucose, confirmed the dose is appropriate under the order, and verified that the patient can eat. When should the premeal dose be administered?",
    "topic": "Timing mealtime insulin",
    "trap_type": "Medication reasoning",
    "sources": [
      {
        "title": "DailyMed: Humalog (insulin lispro) prescribing information",
        "url": "https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c8ecbd7a-0e22-4fc7-a503-faa58c1b6f3f"
      },
      {
        "title": "DailyMed: Humulin R prescribing information",
        "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b519bd83-038c-4ec5-a231-a51ec5cc291f"
      }
    ],
    "initial": {
      "question_stem": "A patient with type 1 diabetes has a prescribed subcutaneous mealtime dose of insulin lispro (Humalog). The nurse has checked glucose, confirmed the dose is appropriate under the order, and verified that the patient can eat. When should the premeal dose be administered?",
      "options": [
        {
          "label": "A",
          "text": "30 to 60 minutes before the meal"
        },
        {
          "label": "B",
          "text": "Only if premeal glucose exceeds 200 mg/dL, regardless of the order"
        },
        {
          "label": "C",
          "text": "At bedtime regardless of meals"
        },
        {
          "label": "D",
          "text": "When the meal is available and the patient is ready to eat, within 15 minutes before the meal"
        }
      ],
      "correct_answer": "D",
      "key_cue": "The prescribed product is insulin lispro, and the patient is ready to eat.",
      "why_correct_short": "Humalog’s labeled subcutaneous timing is within 15 minutes before a meal or immediately after a meal. For this premeal dose, ensure food is available and the patient is ready to eat.",
      "rationales": {
        "A": "This is too early for the specified lispro premeal dose. Regular human insulin has different labeled timing, approximately 30 minutes before meals.",
        "B": "A scheduled mealtime dose is not governed by an invented 200 mg/dL cutoff. Follow the individual prescription, glucose result, and meal-intake plan.",
        "C": "Mealtime lispro must be coordinated with food and the prescription. A basal or separately prescribed correction dose is a different purpose."
      },
      "one_line_fix": "Check the exact insulin product, order, glucose, and readiness to eat; rapid-acting products do not all have identical timing."
    },
    "retry": {
      "question_stem": "A patient is prescribed subcutaneous Humulin R U-100 (regular human insulin) before meals. Glucose and the dose have been checked, the patient can eat, and meal delivery is reliable. What is its labeled premeal timing?",
      "options": [
        {
          "label": "A",
          "text": "At bedtime regardless of the meal"
        },
        {
          "label": "B",
          "text": "Approximately 30 minutes before the meal"
        },
        {
          "label": "C",
          "text": "Two hours after finishing the meal"
        },
        {
          "label": "D",
          "text": "Use the same timing for every insulin product"
        }
      ],
      "correct_answer": "B",
      "key_cue": "This product is regular human insulin, not insulin lispro.",
      "why_correct_short": "Humulin R U-100 is labeled for subcutaneous administration approximately 30 minutes before a meal. Coordinate with the order and reliable meal availability.",
      "rationales": {
        "A": "A prescribed premeal dose is tied to that meal, not an unrelated bedtime schedule.",
        "C": "Two hours after the meal does not match this product’s labeled premeal timing.",
        "D": "Insulin formulations have different timing; the exact product matters."
      },
      "one_line_fix": "Identify the formulation before applying a timing rule."
    }
  }
];
