const labels = ['Assessment-first', 'Priority-setting', 'Medication reasoning', 'Patient education', 'Lab / diagnostic interpretation', 'Pathophysiology / knowledge gap', 'Therapeutic communication', 'Delegation', 'Safety', 'Clinical judgment']
const key = (value: string) => value.trim().toLowerCase().replace(/[–—]/g, '-').replace(/\s*([/-])\s*/g, '$1').replace(/\s+/g, ' ')
export function normalizePracticeFocus(value: string): string {
  const cleaned = key(value)
  return labels.find(label => key(label) === cleaned) || cleaned || 'Clinical judgment'
}
