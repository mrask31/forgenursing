import { describe, it, expect } from 'vitest'

/**
 * Tests for UUID validation used in /api/chat/save and other routes.
 * Regression test for the bug where the regex was 8-4-4-12 instead of 8-4-4-4-12,
 * causing all valid UUIDs to be rejected and "Failed to save message" errors.
 *
 * Bug discovered: May 11, 2026 — user alyssabond37@yahoo.com
 * Root cause: Missing 4-char group in UUID regex pattern
 */

// Exact regex from src/app/api/chat/save/route.ts (after fix)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str)
}

describe('isValidUUID', () => {
  it('accepts standard UUID v4', () => {
    expect(isValidUUID('f27ec4de-9e59-4c7d-89b9-6c65d8789f3b')).toBe(true)
  })

  it('accepts UUID with uppercase hex', () => {
    expect(isValidUUID('F27EC4DE-9E59-4C7D-89B9-6C65D8789F3B')).toBe(true)
  })

  it('accepts UUID v1 format', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('accepts gen_random_uuid() output (Supabase default)', () => {
    // These are real UUIDs from Supabase gen_random_uuid()
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true)
    expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false)
  })

  it('rejects non-UUID strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('12345')).toBe(false)
    expect(isValidUUID('hello-world-test-data')).toBe(false)
  })

  it('rejects UUID missing a group (the original bug: 8-4-4-12)', () => {
    // This is what the broken regex would have accepted
    expect(isValidUUID('f27ec4de-9e59-4c7d-6c65d8789f3b')).toBe(false)
  })

  it('rejects UUID with extra characters', () => {
    expect(isValidUUID('f27ec4de-9e59-4c7d-89b9-6c65d8789f3b-extra')).toBe(false)
    expect(isValidUUID(' f27ec4de-9e59-4c7d-89b9-6c65d8789f3b')).toBe(false)
  })

  it('rejects UUID with invalid hex characters', () => {
    expect(isValidUUID('g27ec4de-9e59-4c7d-89b9-6c65d8789f3b')).toBe(false)
    expect(isValidUUID('f27ec4de-9e59-4c7d-89b9-6c65d8789fzz')).toBe(false)
  })

  it('rejects UUID without dashes', () => {
    expect(isValidUUID('f27ec4de9e594c7d89b96c65d8789f3b')).toBe(false)
  })
})
