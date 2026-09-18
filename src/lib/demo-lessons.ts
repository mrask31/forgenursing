// Server-side demo content. Import only from API routes; never ship answer keys in client bundles.
import type { AnswerFeedback, PublicQuestion } from './answer-trap';

export interface DemoItem {
  question_stem: string;
  options: { label: string; text: string }[];
  correct_answer: string;
  key_cue: string;
  why_correct_short: string;
  rationales: Record<string, string>;
  one_line_fix: string;
}
export interface DemoLesson {
  sourceStem: string;
  topic: string;
  trap_type: string;
  sources: { title: string; url: string }[];
  initial: DemoItem;
  retry: DemoItem;
}
export const DEMO_LESSONS: DemoLesson[] = [
  {
    "sourceStem": "A patient is admitted with a serum potassium level of 6.2 mEq/L. Which ECG change should the nurse expect to see?",
    "topic": "Potassium and ECG changes",
    "trap_type": "Pathophysiology / knowledge gap",
    "sources": [
      {
        "title": "Merck Manual: Hyperkalemia",
        "url": "https://www.merckmanuals.com/professional/nephrology/electrolyte-disorders/hyperkalemia"
      },
      {
        "title": "Merck Manual: Hypokalemia",
        "url": "https://www.merckmanuals.com/professional/nephrology/electrolyte-disorders/hypokalemia"
      }
    ],
    "initial": {
      "question_stem": "A patient has a serum potassium level of 6.2 mEq/L. Which ECG finding is classically associated with this electrolyte abnormality?",
      "options": [
        {
          "label": "A",
          "text": "Flattened T waves"
        },
        {
          "label": "B",
          "text": "Peaked T waves"
        },
        {
          "label": "C",
          "text": "Prolonged QT interval"
        },
        {
          "label": "D",
          "text": "ST segment depression"
        }
      ],
      "correct_answer": "B",
      "key_cue": "Potassium is elevated at 6.2 mEq/L.",
      "why_correct_short": "Tall, peaked T waves are a classic hyperkalemia finding; ECG changes vary between patients.",
      "rationales": {
        "A": "Flattened T waves are associated with low potassium. This value is high.",
        "C": "QT prolongation is not the classic finding here; hyperkalemia may shorten the QT interval.",
        "D": "ST depression can occur with low potassium. Peaked T waves better fit this elevated value."
      },
      "one_line_fix": "Connect the direction of the potassium change to the ECG finding; ECG appearance alone cannot exclude a dangerous imbalance."
    },
    "retry": {
      "question_stem": "A patient has a potassium level of 2.8 mEq/L. Which ECG finding best fits this result?",
      "options": [
        {
          "label": "A",
          "text": "Tall, peaked T waves"
        },
        {
          "label": "B",
          "text": "A normal ECG excludes potassium-related risk"
        },
        {
          "label": "C",
          "text": "Flattened T waves with prominent U waves"
        },
        {
          "label": "D",
          "text": "A sine-wave pattern typical of severe hyperkalemia"
        }
      ],
      "correct_answer": "C",
      "key_cue": "This time potassium is low.",
      "why_correct_short": "Flattened T waves and prominent U waves are associated with hypokalemia.",
      "rationales": {
        "A": "Peaked T waves fit high potassium, the opposite of this result.",
        "B": "A normal ECG does not rule out risk from an abnormal potassium level.",
        "D": "The option describes severe high potassium; this patient has low potassium."
      },
      "one_line_fix": "Read the value again before applying the previous question’s rule."
    }
  },
  {
    "sourceStem": "An RN is delegating tasks to a licensed practical nurse (LPN) and an unlicensed assistive personnel (UAP). Which task is appropriate to delegate to the UAP?",
    "topic": "Delegating routine care",
    "trap_type": "Delegation",
    "sources": [
      {
        "title": "NCSBN: National Guidelines for Nursing Delegation",
        "url": "https://www.ncsbn.org/public-files/NGND-PosPaper_06.pdf"
      }
    ],
    "initial": {
      "question_stem": "A trained UAP may collect routine vital signs under facility policy but is not authorized to administer medications. Which task may the RN delegate?",
      "options": [
        {
          "label": "A",
          "text": "Obtain scheduled vital signs on a stable patient"
        },
        {
          "label": "B",
          "text": "Assess new shortness of breath"
        },
        {
          "label": "C",
          "text": "Administer a scheduled oral medication"
        },
        {
          "label": "D",
          "text": "Teach a patient how to inject insulin"
        }
      ],
      "correct_answer": "A",
      "key_cue": "The patient is stable and the task is authorized.",
      "why_correct_short": "Routine measurement fits this UAP’s stated training. The RN follows up on findings.",
      "rationales": {
        "B": "New symptoms require nursing assessment and judgment.",
        "C": "Medication administration is outside this UAP’s stated authorization.",
        "D": "Initial teaching requires nursing judgment."
      },
      "one_line_fix": "Check patient stability, task requirements, demonstrated competence, and local policy."
    },
    "retry": {
      "question_stem": "A trained UAP can record routine intake and output under facility policy. Which task may the RN delegate for a stable patient?",
      "options": [
        {
          "label": "A",
          "text": "Decide whether low urine output indicates dehydration"
        },
        {
          "label": "B",
          "text": "Teach fluid-restriction instructions"
        },
        {
          "label": "C",
          "text": "Evaluate whether the fluid plan is working"
        },
        {
          "label": "D",
          "text": "Measure and record urine output"
        }
      ],
      "correct_answer": "D",
      "key_cue": "The task is routine measurement for a stable patient.",
      "why_correct_short": "Recording the amount fits the stated role; interpreting it remains with the nurse.",
      "rationales": {
        "A": "Interpreting the cause requires nursing judgment.",
        "B": "Teaching the plan requires nursing judgment.",
        "C": "Evaluating treatment requires nursing judgment."
      },
      "one_line_fix": "Distinguish collecting a measurement from interpreting its meaning."
    }
  },
  {
    "sourceStem": "A nurse receives report on four patients. Which patient should the nurse assess FIRST? (A) Blood glucose 210 mg/dL scheduled for sliding-scale insulin. (B) Chest pain 8/10 with diaphoresis starting 20 minutes ago. (C) Surgical wound with moderate serous drainage. (D) Mild nausea after morning chemotherapy.",
    "topic": "Recognizing urgent symptoms",
    "trap_type": "Priority-setting",
    "sources": [
      {
        "title": "NHS: Heart attack symptoms",
        "url": "https://www.nhs.uk/conditions/heart-attack/"
      }
    ],
    "initial": {
      "question_stem": "Which patient should the nurse assess first?",
      "options": [
        {
          "label": "A",
          "text": "A stable patient with glucose 210 mg/dL and scheduled correction insulin"
        },
        {
          "label": "B",
          "text": "A patient with new chest pain and sweating"
        },
        {
          "label": "C",
          "text": "A stable patient with an unchanged amount of clear wound drainage"
        },
        {
          "label": "D",
          "text": "A patient with mild, expected nausea after chemotherapy and no other symptoms"
        }
      ],
      "correct_answer": "B",
      "key_cue": "The chest pain and sweating are new.",
      "why_correct_short": "This combination can signal a heart attack and warrants urgent assessment.",
      "rationales": {
        "A": "The stated glucose finding needs follow-up, but the scenario describes no acute deterioration.",
        "C": "The drainage is unchanged and the patient is stable; new chest symptoms take priority.",
        "D": "Mild, expected nausea without other symptoms is less urgent than new chest pain and sweating."
      },
      "one_line_fix": "Look for a new, potentially time-sensitive threat among otherwise stable findings."
    },
    "retry": {
      "question_stem": "Which patient needs the nurse’s immediate attention?",
      "options": [
        {
          "label": "A",
          "text": "A patient with new chest pressure, nausea, and sweating"
        },
        {
          "label": "B",
          "text": "A stable patient requesting discharge paperwork"
        },
        {
          "label": "C",
          "text": "A patient with unchanged chronic knee pain awaiting routine medication"
        },
        {
          "label": "D",
          "text": "A stable patient asking about tomorrow’s appointment"
        }
      ],
      "correct_answer": "A",
      "key_cue": "New chest pressure occurs with nausea and sweating.",
      "why_correct_short": "These symptoms can accompany a heart attack and need urgent assessment.",
      "rationales": {
        "B": "Paperwork can wait while the nurse assesses new chest symptoms.",
        "C": "Unchanged chronic pain needs care, but the new chest symptoms are more urgent.",
        "D": "An appointment question can wait while the nurse assesses a possible emergency."
      },
      "one_line_fix": "Apply urgency to the whole symptom pattern."
    }
  }
];

export function demoLesson(stem: string) {
  return DEMO_LESSONS.find(lesson => lesson.sourceStem === stem);
}
export function publicDemoQuestion(item: DemoItem, id: string, index = 0): PublicQuestion {
  return { id, question_stem: item.question_stem, options: item.options, question_index: index };
}
export function demoFeedback(lesson: DemoLesson, selected: string, retry = false): AnswerFeedback {
  const item = retry ? lesson.retry : lesson.initial;
  return {
    is_correct: selected === item.correct_answer,
    correct_answer: item.correct_answer,
    trap_type: lesson.trap_type,
    trap_display_name: lesson.topic,
    key_cue: item.key_cue,
    why_correct_short: item.why_correct_short,
    why_wrong_short: item.rationales[selected] || '',
    one_line_fix: item.one_line_fix,
    sources: lesson.sources,
    retry_available: !retry && selected !== item.correct_answer,
  };
}
