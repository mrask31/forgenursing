import { z } from 'zod'

const emailSchema = z.string().trim().email()

export function isValidSignupEmail(value: string): boolean {
  return emailSchema.safeParse(value).success
}
