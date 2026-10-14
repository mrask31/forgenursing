import type { DistinctionId } from './distinctions'
const mapping: Record<string, DistinctionId> = {
 'Potassium and ECG changes':'potassium-direction-ecg', 'Delegating routine care':'uap-routine-stable-care',
 'Recognizing urgent symptoms':'new-urgent-symptoms', 'Digoxin toxicity':'digoxin-toxicity-cues',
 'Safe PPE removal':'ppe-contamination-removal', 'Assigning RN, LPN, and UAP care':'staff-scope-stability',
 'Recognizing a threatened airway':'threatened-airway-cues', 'Timing mealtime insulin':'mealtime-insulin-food-availability',
}
export function demoDistinction(topic: string) { return mapping[topic] || null }
