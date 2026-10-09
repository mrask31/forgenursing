import { describe, expect, it } from 'vitest'
import { isValidSignupEmail } from '../src/lib/signup-validation'

describe('signup email validation', () => {
  it.each(['', 'notanemail', 'name@', '@example.com', 'name@example', 'name @example.com'])('rejects malformed address %s', value => {
    expect(isValidSignupEmail(value)).toBe(false)
  })
  it.each(['student@example.com', 'student+practice@example.co.uk', ' Student@example.com '])('accepts a normal address %s', value => {
    expect(isValidSignupEmail(value)).toBe(true)
  })
})
