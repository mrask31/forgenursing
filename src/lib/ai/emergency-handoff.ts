/** Hide study nudges after an explicit real-patient emergency handoff.
 * This UI rule does not replace model safety evaluation or emergency detection.
 */
export function isEmergencyHandoff(content: string): boolean {
  return /(?:real|actual)[ -]patient emergency|(?:real|actual) patient[\s\S]{0,160}(?:call for help|activate.{0,40}(?:emergency|code|rapid response))/i.test(content)
}
