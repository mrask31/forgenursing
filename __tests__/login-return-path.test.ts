import { expect, it } from 'vitest'
import { loginReturnPath } from '../src/lib/login-return-path'
it('preserves internal checkout and feedback return destinations', () => {
  expect(loginReturnPath('/checkout')).toBe('/checkout')
  expect(loginReturnPath('/quiz?sessionId=abc&feedbackQuestionId=q1')).toBe('/quiz?sessionId=abc&feedbackQuestionId=q1')
})
it('rejects external, protocol-relative, backslash, control and auth-loop targets', () => {
  for (const target of [null, 'https://evil.test', '//evil.test', '/\\evil.test', '/' + String.fromCharCode(10) + '/evil.test', '/login?next=/checkout', '/signup']) expect(loginReturnPath(target)).toBeNull()
})
