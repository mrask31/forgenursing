import {describe,it,expect} from 'vitest'
import {ClinicalPacket,packetHash,validatePublication} from '../src/lib/learning/clinical-content'
import {distinctionId,loopProperties,opportunityId} from '../src/lib/learning/distinctions'
function fixture(){
 const q=(stem:string)=>({question_stem:stem,options:['A','B','C','D'].map(label=>({label,text:`Test option ${label}`})),correct_answer:'B',rationale_correct:'Test-only rationale',rationale_incorrect:{A:'Test A',C:'Test C',D:'Test D'},nclex_category:'Test',difficulty:2,key_cue:'Test cue',one_line_fix:'Test explanation'})
 return ClinicalPacket.parse({packet_id:'test-only',version:1,distinction_id:'potassium-direction-ecg',learner_level:'NCLEX-RN',taxonomy_version:'2026-10-14-v1',provenance:{model:'test',prompt_version:'test',generated_at:'2026-10-01T00:00:00Z'},references:[{title:'Test-only source',url:'https://example.com',section:'Test',checked_at:'2026-10-01'}],original:q('Test original'),retry:q('Test retry'),reviews:[q('Test review one'),q('Test review two'),q('Test review three')]})
}
function approval(packet:ReturnType<typeof fixture>){return {packet_sha256:packetHash(packet),rubric_version:'0.2',reviewer_name:'TEST ONLY',license_jurisdiction:'TEST',license_verification_record:'TEST ONLY',license_verified_at:'2026-10-01',reviewer_independent:true,approved_at:'2026-10-01T00:00:00Z',decision:'approved',all_criteria_resolved:true,review_record:'TEST ONLY'}}
describe('clinical publication boundary',()=>{
 it('requires a human attestation, independent reviewer and resolved criteria',()=>{const p=fixture();expect(()=>validatePublication(p,{})).toThrow();expect(()=>validatePublication(p,{...approval(p),reviewer_independent:false})).toThrow();expect(()=>validatePublication(p,{...approval(p),all_criteria_resolved:false})).toThrow()})
 it('invalidates approval when a clinical statement changes',()=>{const p=fixture(),a=approval(p);p.retry.rationale_correct='Changed meaning';expect(()=>validatePublication(p,a)).toThrow('exact packet')})
 it('hash is insensitive to JSON key order, but not clinical content',()=>{const p=fixture();expect(packetHash(p)).toBe(packetHash(Object.fromEntries(Object.entries(p).reverse()) as typeof p))})
 it('rejects unknown concepts, duplicated options, missing rationales, and repeated variants',()=>{const p=fixture();expect(()=>ClinicalPacket.parse({...p,distinction_id:'Assessment-first'})).toThrow();p.original.options[1].label='A';expect(()=>ClinicalPacket.parse(p)).toThrow();const b=fixture();delete b.retry.rationale_incorrect.A;expect(()=>ClinicalPacket.parse(b)).toThrow();const c=fixture();c.reviews[0]=c.retry;expect(()=>ClinicalPacket.parse(c)).toThrow()})
 it('requires at least three frozen delayed-review variants',()=>{const p=fixture();p.reviews=[];expect(()=>ClinicalPacket.parse(p)).toThrow()})
})
describe('learning identity',()=>{
 it('distinguishes sample attempts at the same bank question',()=>{expect(opportunityId('free_sample','q1','s1')).not.toBe(opportunityId('free_sample','q1','s2'))})
 it('links a retry to the original opportunity across sessions',()=>{const a=loopProperties({id:'original',distinction_id:'potassium-direction-ecg'},'s1');const b=loopProperties({id:'retry',source_question_id:'original',learning_attempt:2,distinction_id:'potassium-direction-ecg'},'s2');expect(a.retry_opportunity_id).toBe(b.retry_opportunity_id);expect(b.question_id).not.toBe(a.question_id);expect(b.attempt).toBe(2);expect(b.distinction_status).toBe('provisional')})
 it('never promotes a broad category or unknown mapping to a reviewed distinction',()=>{expect(distinctionId('Assessment-first')).toBeNull();expect(loopProperties({id:'q',distinction_id:'unknown'},'s').distinction_status).toBe('unmapped')})
})
