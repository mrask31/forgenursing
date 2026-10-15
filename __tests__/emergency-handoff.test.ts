import { describe, expect, it } from 'vitest'
import { isEmergencyHandoff } from '@/lib/ai/emergency-handoff'

it.each([
  "Call for emergency help immediately — activate your facility's rapid response or code team, or call 911 if outside a clinical setting.",
  '**Activate your local emergency response immediately.** Follow the qualified team.',
  'Immediately call emergency services and follow their instructions.',
])('hides study nudges for direct urgent handoff: %s', content => {
  expect(isEmergencyHandoff(content)).toBe(true)
})
describe('emergency handoff study nudges', () => {
  it('suppresses nudges on the actual observed emergency handoff', () => {
    expect(isEmergencyHandoff('This is a real patient emergency. Call for help immediately — activate your emergency response system (code team, rapid response, or 911) right now.')).toBe(true)
  })
  it('does not suppress ordinary fictional emergency study explanations', () => {
    expect(isEmergencyHandoff('In this fictional NCLEX emergency scenario, activating the rapid response team is appropriate.')).toBe(false)
  })
})
