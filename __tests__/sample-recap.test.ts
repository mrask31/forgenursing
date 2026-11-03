import { expect, it } from 'vitest'
import { readSampleRecap, saveSampleRecap, clearSampleRecap, SAMPLE_RECAP_KEY } from '../src/lib/sample-recap'
import { signupFormHint } from '../src/lib/signup-validation'
const now = Date.UTC(2026,10,3)
const result = {score:2,total:3,all_correct:false,detected_trap:'Safety',detected_trap_display:'Safety decisions',trap_explanation:null,trap_why_tempting:null,trap_what_to_practice:'Review the missed concept.',share_text:'2/3 originals',review_topics:['Safety']}
function storage() {
  const data = new Map<string,string>()
  return {getItem:(k:string)=>data.get(k) ?? null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}}
}
it('restores the completed recap, same session identifiers and separate retry outcomes',()=>{
  const s=storage(), recap={sessionId:'session-one',anonymousId:'anon-one',result,retryOutcomes:{q1:{topic:'Safety',correct:true}}}
  expect(saveSampleRecap(s,recap,now)).toBe(true)
  expect(readSampleRecap(s,now+1000)).toEqual({...recap,version:1,completedAt:now})
  expect(readSampleRecap(s,now+1000)?.result.score).toBe(2)
})
it('stores only the latest completed session and permits an explicit new sample',()=>{
  const s=storage();saveSampleRecap(s,{sessionId:'old',anonymousId:'a',result,retryOutcomes:{}},now)
  saveSampleRecap(s,{sessionId:'new',anonymousId:'b',result,retryOutcomes:{}},now)
  expect(readSampleRecap(s,now)?.sessionId).toBe('new')
  clearSampleRecap(s);expect(readSampleRecap(s,now)).toBeNull()
})
it('rejects incomplete, inconsistent and stale results instead of breaking practice',()=>{
  const s=storage();s.setItem(SAMPLE_RECAP_KEY,'{invalid');expect(readSampleRecap(s,now)).toBeNull()
  expect(saveSampleRecap(s,{sessionId:'s',anonymousId:'a',result:{...result,score:4},retryOutcomes:{}},now)).toBe(false)
  expect(saveSampleRecap(s,{sessionId:'s',anonymousId:'a',result:{...result,all_correct:true},retryOutcomes:{}},now)).toBe(false)
  saveSampleRecap(s,{sessionId:'s',anonymousId:'a',result,retryOutcomes:{}},now)
  expect(readSampleRecap(s,now+31*86400000)).toBeNull()
})
it('supports an all-correct recap with no false missed-topic diagnosis',()=>{
 const s=storage();saveSampleRecap(s,{sessionId:'s',anonymousId:'a',result:{...result,score:3,all_correct:true,detected_trap:null,detected_trap_display:null},retryOutcomes:{}},now)
 expect(readSampleRecap(s,now)?.result).toMatchObject({score:3,total:3,all_correct:true,detected_trap:null})
})
it('blocked storage never prevents result display or explicit reset',()=>{
 const s={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')},removeItem:()=>{throw Error('blocked')}}
 expect(saveSampleRecap(s,{sessionId:'s',anonymousId:'a',result,retryOutcomes:{}},now)).toBe(false)
 expect(readSampleRecap(s,now)).toBeNull();expect(()=>clearSampleRecap(s)).not.toThrow()
})
it('explains each disabled signup state and stops blocking a valid form',()=>{
 expect(signupFormHint('','',false)).toContain('email')
 expect(signupFormHint('invalid','',false)).toContain('valid email')
 expect(signupFormHint('qa@example.com','short',false)).toContain('8 characters')
 expect(signupFormHint('qa@example.com','long-enough',false)).toContain('Terms')
 expect(signupFormHint('qa@example.com','long-enough',true)).toBeNull()
 expect(signupFormHint('qa@example.com','long-enough',true,true)).toContain('Creating')
})
