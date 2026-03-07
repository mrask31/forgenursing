/**
 * PHI Scrubber Unit Tests
 * 
 * Run with: node --loader ts-node/esm __tests__/phi-scrubber.test.ts
 * Or: npx ts-node __tests__/phi-scrubber.test.ts
 * Or add to package.json: "test:phi": "ts-node __tests__/phi-scrubber.test.ts"
 */

import { scorePhiText, scorePhiImage } from '../src/app/api/_middleware/phi-scrubber'

// Simple test runner
let testsPassed = 0
let testsFailed = 0

function describe(name: string, fn: () => void | Promise<void>) {
  console.log(`\n${name}`)
  Promise.resolve(fn()).then(() => {
    console.log(`\n✓ ${testsPassed} passed, ✗ ${testsFailed} failed`)
  })
}

async function it(name: string, fn: () => void | Promise<void>) {
  try {
    await Promise.resolve(fn())
    console.log(`  ✓ ${name}`)
    testsPassed++
  } catch (error) {
    console.log(`  ✗ ${name}`)
    console.error(`    ${error}`)
    testsFailed++
    process.exitCode = 1
  }
}

function afterEach(fn: () => void) {
  // Simple afterEach implementation for cleanup
  fn()
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
    toBeGreaterThan(expected: any) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`)
      }
    }
  }
}

describe('PHI Scrubber - scorePhiText', () => {
  it('should score 1 for single fake name only (action: warn)', () => {
    const text = 'Patient: John Smith was admitted today with chest pain.'
    const score = scorePhiText(text)
    
    expect(score).toBe(1)
    // Action should be WARN (score 1)
    // Should forward request with x-phi-warning: true header
  })

  it('should score 2 for name + MRN (action: confirm)', () => {
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

  it('should score 4 for name + MRN + DOB + document header (action: block)', () => {
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
    expect(scorePhiText(null as any)).toBe(0)
    expect(scorePhiText(undefined as any)).toBe(0)
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

describe('PHI Scrubber - scorePhiImage', () => {
  // Mock global fetch for testing
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should score 0 when Gemini returns no PHI elements', async () => {
    // Mock Gemini API response
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  phi_elements: [],
                  confidence: 'low'
                })
              }]
            }
          }]
        })
      } as Response
    }

    const score = await scorePhiImage('fake-base64-image-data')
    expect(score).toBe(0)
    // Action should be PASS (score 0)
  })

  it('should score 3 when Gemini returns 3 PHI elements with high confidence', async () => {
    // Mock Gemini API response
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  phi_elements: ['patient name', 'MRN', 'DOB'],
                  confidence: 'high'
                })
              }]
            }
          }]
        })
      } as Response
    }

    const score = await scorePhiImage('fake-base64-image-data')
    expect(score).toBe(3)
    // Action should be BLOCK (score >= 3)
  })

  it('should score 4 when Gemini returns critical confidence', async () => {
    // Mock Gemini API response
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  phi_elements: ['patient name', 'SSN'],
                  confidence: 'critical'
                })
              }]
            }
          }]
        })
      } as Response
    }

    const score = await scorePhiImage('fake-base64-image-data')
    expect(score).toBe(4)
    // Action should be BLOCK (score >= 3)
  })

  it('should score 0 and fail open when Gemini returns invalid JSON', async () => {
    // Mock Gemini API response with invalid JSON
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'This is not valid JSON'
              }]
            }
          }]
        })
      } as Response
    }

    const score = await scorePhiImage('fake-base64-image-data')
    expect(score).toBe(0)
    // Should fail open (return 0) on invalid JSON
  })

  it('should score 0 and fail open when Gemini API call fails', async () => {
    // Mock Gemini API failure
    global.fetch = async () => {
      return {
        ok: false,
        status: 500
      } as Response
    }

    const score = await scorePhiImage('fake-base64-image-data')
    expect(score).toBe(0)
    // Should fail open (return 0) on API error
  })

  it('should handle empty or invalid input', async () => {
    expect(await scorePhiImage('')).toBe(0)
    expect(await scorePhiImage(null as any)).toBe(0)
    expect(await scorePhiImage(undefined as any)).toBe(0)
  })
})
