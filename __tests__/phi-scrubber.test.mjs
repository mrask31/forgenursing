/**
 * PHI Scrubber Unit Tests (JavaScript version)
 * 
 * Run with: node __tests__/phi-scrubber.test.mjs
 */

import { scorePhiText } from '../src/app/api/_middleware/phi-scrubber.js'

// Simple test runner
let testsPassed = 0
let testsFailed = 0

function describe(name, fn) {
  console.log(`\n${name}`)
  fn()
  console.log(`\n✓ ${testsPassed} passed, ✗ ${testsFailed} failed`)
  if (testsFailed > 0) {
    process.exit(1)
  }
}

function it(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    testsPassed++
  } catch (error) {
    console.log(`  ✗ ${name}`)
    console.error(`    ${error.message}`)
    testsFailed++
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`)
      }
    }
  }
}

describe('PHI Scrubber - scorePhiText', () => {
  it('TEST 1: should score 1 for single fake name only (action: warn)', () => {
    const text = 'Patient: John Smith was admitted today with chest pain.'
    const score = scorePhiText(text)
    
    expect(score).toBe(1)
    // Action should be WARN (score 1)
    // Should forward request with x-phi-warning: true header
  })

  it('TEST 2: should score 2 for name + MRN (action: confirm)', () => {
    const text = `
      Patient: Jane Doe
      MRN: 12345678
      Chief Complaint: Shortness of breath
    `
    const score = scorePhiText(text)
    
    expect(score).toBe(2)
    // Action should be CONFIRM (score 2)
    // Should return 202 with confirmation message:
    // "This content contains multiple patient identifiers. Are you using practice materials or a real patient record?"
  })

  it('TEST 3: should score 4 for name + MRN + DOB + document header (action: block)', () => {
    const text = `
      Discharge Summary
      
      Patient: Robert Johnson
      MRN: 98765432
      DOB: 03/15/1965
      
      Hospital Course: Patient admitted with acute MI...
    `
    const score = scorePhiText(text)
    
    expect(score).toBe(4)
    // Action should be BLOCK (score >= 3)
    // Should return 403 with block message:
    // "This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. 
    // Please use de-identified practice materials only. Your session has not been interrupted."
  })

  // Additional edge case tests
  it('should score 0 for educational content without PHI', () => {
    const text = `
      What are the signs and symptoms of heart failure?
      How do I prioritize care for a patient with chest pain?
    `
    const score = scorePhiText(text)
    
    expect(score).toBe(0)
    // Action should be PASS (score 0)
    // Should forward request normally
  })

  it('should score 2 for SSN only (weighted +2)', () => {
    const text = 'SSN: 123-45-6789'
    const score = scorePhiText(text)
    
    expect(score).toBe(2)
    // SSN has weight of 2, so single match = score 2
  })

  it('should handle empty or invalid input', () => {
    expect(scorePhiText('')).toBe(0)
    expect(scorePhiText(null)).toBe(0)
    expect(scorePhiText(undefined)).toBe(0)
  })

  it('should detect multiple PHI patterns and sum scores', () => {
    const text = `
      Admission Record
      Pt: Sarah Williams
      Medical Record: 11223344
      Date of Birth: 12/25/1980
      Room 405B
      DOS: 01/15/2024
    `
    const score = scorePhiText(text)
    
    // officialHeader (1) + patientName (1) + mrn (1) + dob (1) + roomBed (1) + dateOfService (1) = 6
    expect(score).toBe(6)
    // Action should be BLOCK (score >= 3)
  })

  it('should detect case-insensitive patterns', () => {
    const text = `
      patient: john doe
      mrn: 12345678
      dob: 01/01/1990
    `
    const score = scorePhiText(text)
    
    // Should still detect patterns despite lowercase
    expect(score).toBeGreaterThan(0)
  })
})
