import { expect,it } from 'vitest'
import { NCLEX_CATEGORIES,normalizeNclexCategory,nclexCategoryProgress } from '../src/lib/nclex-categories'
import { cprPracticeCategory,EMPTY_RETAKE_PLAN } from '../src/lib/retake-plan'
it('uses the same labels for stored CPR keys, packet aliases and practice filters',()=>{
  expect(NCLEX_CATEGORIES).toHaveLength(8)
  for(const [stored,display] of [['Safety and Infection Prevention and Control','Safety and Infection Control'],['Pharmacological and Parenteral Therapies','Pharmacological Therapies']] as const){
    expect(normalizeNclexCategory(stored)).toBe(display)
    expect(NCLEX_CATEGORIES).toContain(display)
    expect(cprPracticeCategory({...EMPTY_RETAKE_PLAN,cpr:{[stored]:'Below'}})).toBe(display)
  }
})
it('merges known historical aliases and reconciles progress without inferring unknown categories',()=>{
  const rows=nclexCategoryProgress([{nclex_category:'Safety and Infection Prevention and Control',is_correct:false},{nclex_category:'Safety and Infection Control',is_correct:true},{nclex_category:'Delegation',is_correct:true}])
  expect(rows).toEqual([{category:'Safety and Infection Control',attempted:2,correct:1,accuracy:50},{category:'Other recorded categories',attempted:1,correct:1,accuracy:100}])
  expect(rows.reduce((n,r)=>n+r.attempted,0)).toBe(3)
  expect(rows.reduce((n,r)=>n+r.correct,0)).toBe(2)
})
