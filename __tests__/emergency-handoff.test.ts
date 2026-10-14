import { describe, expect, it } from 'vitest'
import { isEmergencyHandoff } from '@/lib/ai/emergency-handoff'
describe('emergency handoff study nudges', () => {
  it('suppresses nudges on the actual observed emergency handoff', () => {
    expect(isEmergencyHandoff('This is a real patient emergency. Call for help immediately — activate your emergency response system (code team, rapid response, or 911) right now.')).toBe(true)
  })
  it('does not suppress ordinary fictional emergency study explanations', () => {
    expect(isEmergencyHandoff('In this fictional NCLEX emergency scenario, activating the rapid response team is appropriate.')).toBe(false)
  })
})
