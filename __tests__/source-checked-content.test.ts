import {describe,it,expect} from 'vitest'
import raw from '../content/source-checked-bank.json'
import originalDraft from '../content/drafts/question-bank-v1.json'
import batch4 from '../content/drafts/question-bank-4.json'
const draft = {questions:[...originalDraft.questions,...batch4.questions]}
import {SourceCheckedPacket,normalizeBankCategory} from '../src/lib/learning/source-checked-content'
import {canonicalHash} from '../src/lib/learning/draft-bank'
import {loopProperties,distinctionId} from '../src/lib/learning/distinctions'

describe('frozen source-checked publication',()=>{
 it('preserves every option, answer key and option-specific explanation across all 210 questions',()=>{
  expect(raw).toHaveLength(70)
  for(const row of raw){
   const p=SourceCheckedPacket.parse(row.packet)
   expect(canonicalHash(p)).toBe(row.packet_sha256)
   expect(distinctionId(p.distinction_id)).toBe(p.distinction_id)
   for(const [role,q] of [['original',p.original],['retry',p.retry],['delayed_review',p.reviews[0]]] as const){
    const d=draft.questions.find(x=>x.family_id===p.packet_id&&x.role===role)!
    expect(q.question_stem).toBe(d.question)
    expect(q.correct_answer).toBe(d.answer)
    expect(Object.fromEntries(q.options.map(o=>[o.label,o.text]))).toEqual(d.options)
    expect({...q.rationale_incorrect,[q.correct_answer]:q.rationale_correct}).toEqual(d.rationales)
   }
  }
 })
 it('does not permit source checks to masquerade as independent clinical validation',()=>{
  const p=structuredClone(raw[0].packet)
  expect(()=>SourceCheckedPacket.parse({...p,independent_clinical_validation:true})).toThrow()
  expect(()=>SourceCheckedPacket.parse({...p,publication_kind:'clinically_approved'})).toThrow()
  expect(p.difficulty_status).toBe('provisional')
  expect(loopProperties({id:'q',source_checked_content_id:'v',distinction_id:p.distinction_id},'s')).toMatchObject({distinction_status:'ai_source_checked',content_version:'v'})
 })
 it('requires exactly one fresh delayed variant and respects the content hold',()=>{
  const p=structuredClone(raw[0].packet)
  expect(()=>SourceCheckedPacket.parse({...p,reviews:[]})).toThrow()
  expect(()=>SourceCheckedPacket.parse({...p,reviews:[...p.reviews,...p.reviews]})).toThrow()
  expect(()=>SourceCheckedPacket.parse({...p,retry:p.original})).toThrow()
  p.retry.question_stem='A COPD question that must remain on hold'
  expect(()=>SourceCheckedPacket.parse(p)).toThrow()
 })
 it('normalizes only known category aliases',()=>{
  expect(normalizeBankCategory('All Categories')).toBeNull()
  expect(normalizeBankCategory('Safety and Infection Prevention and Control')).toBe('Safety and Infection Control')
  expect(normalizeBankCategory('Pharmacological and Parenteral Therapies')).toBe('Pharmacological Therapies')
 })
})
