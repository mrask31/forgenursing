import {describe,it,expect} from 'vitest'
import {cprFocusCategories,cprPracticeCategory,readRetakePlan} from '@/lib/retake-plan'
import {retakeLifecycleEmail} from '@/lib/emails/retake-lifecycle'
import {readFileSync} from 'node:fs'
describe('retake interior acceptance',()=>{
 it('uses the lowest saved ratings with bank-compatible labels',()=>{
  const plan=readRetakePlan({cpr:{'Pharmacological and Parenteral Therapies':'Below','Management of Care':'Near'}})
  expect(cprFocusCategories(plan)).toEqual(['Pharmacological Therapies'])
  expect(cprPracticeCategory(plan)).toBe('Pharmacological Therapies')
  plan.cpr['Management of Care']='Below'
  expect(cprFocusCategories(plan)).toHaveLength(2)
 })
 it('falls back to Near without inventing a focus from Above',()=>{
  expect(cprFocusCategories(readRetakePlan({cpr:{'Management of Care':'Near'}}))).toEqual(['Management of Care'])
  expect(cprFocusCategories(readRetakePlan({cpr:{'Management of Care':'Above'}}))).toEqual([])
 })
 it.each(['welcome','day3','day5','day6','expired','practice','beta'] as const)('keeps %s aligned with the retake product',step=>{
  const message=retakeLifecycleEmail(step,'November 2, 2026')
  expect(message.text+message.html).not.toMatch(/upload|class materials|My Courses|still in school|\$9\.99|\$79/i)
  expect(message.text).toContain('Founder, ForgeNursing')
  if(['day5','day6','expired'].includes(step)){expect(message.text).toContain('$29.99 one-time');expect(message.text).toContain('Nothing auto-renews');expect(message.text).toContain('one free three-month extension')}
 })
 it('welcomes with intake before bank practice and retains no-card trial',()=>{
  const text=retakeLifecycleEmail('welcome').text
  expect(text.indexOf('1. Add your exam date')).toBeLessThan(text.indexOf('2. Start your first bank'))
  expect(text).toContain('7 days free. No credit card.')
 })
 it('removes the reported tutor fallback and preserves evidence safety',()=>{
  const route=readFileSync('src/app/api/chat/route.ts','utf8')
  expect(route).not.toMatch(/Upload your textbook|NO BINDER CONTEXT|NOTES MODE BEHAVIOR/)
  expect(route).toContain('FINAL_EVIDENCE_CHECK + RETAKE_TUTOR_PRODUCT_CONTEXT')
 })
})
