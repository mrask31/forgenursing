/** Hide study nudges after an explicit real-patient emergency handoff.
 * This UI rule does not replace model safety evaluation or emergency detection.
 */
export function isEmergencyHandoff(content: string): boolean {
  const plain = content.replace(/[*_#]/g, '').trim()
  return /(?:real|actual)[ -]patient emergency|(?:real|actual) patient[\s\S]{0,160}(?:call for help|activate.{0,40}(?:emergency|code|rapid response))/i.test(plain)
    || /^(?:call|contact|activate|seek|get)\b[^.!?]{0,100}(?:emergency help|emergency services|emergency response|rapid response|code team|911)[^.!?]{0,50}(?:immediately|right now)/i.test(plain)
    || /^(?:immediately|right now)[,:]?\s+(?:call|contact|activate|seek|get)\b[^.!?]{0,100}(?:emergency|rapid response|code team|911)/i.test(plain)
}
