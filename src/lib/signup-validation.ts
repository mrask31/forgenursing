import { z } from 'zod'

const emailSchema = z.string().trim().email()

export function isValidSignupEmail(value: string): boolean {
  return emailSchema.safeParse(value).success
}


export const SIGNUP_PASSWORD_MIN_LENGTH = 8
export function signupFormHint(email: string, password: string, acceptedTerms: boolean, loading = false): string | null {
  if (loading) return 'Creating your account…'
  if (!email.trim()) return 'Enter your email address to continue.'
  if (!isValidSignupEmail(email)) return 'Enter a valid email address to continue.'
  if (password.length < SIGNUP_PASSWORD_MIN_LENGTH) return 'Use at least 8 characters for your password.'
  if (!acceptedTerms) return 'Tick the Terms and Privacy Policy box to continue.'
  return null
}
