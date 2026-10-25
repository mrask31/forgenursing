'use client'
import {useEffect,useState} from 'react'
import { reviewSummary, REVIEW_ELIGIBILITY_COPY } from '@/lib/review-display'
import Link from 'next/link'
import {captureLoop} from '@/lib/analytics/learning-loop'
import {opportunityId} from '@/lib/learning/distinctions'
type ReviewContext={content_kind?:'source_checked'|'clinical';content_status?:string;source_question_id?:string;distinction_id?:string;content_version?:string}
type Question={id:string;question_stem:string;options:{label:string;text:string}[]}
export default function ReviewClient(){
 const [queue,setQueue]=useState<{available:boolean;due:{id:string;content_kind?:'source_checked'|'clinical'}[];next_due_at:string|null;exhausted_count?:number}|null>(null)
 const [question,setQuestion]=useState<Question|null>(null),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState<any>(null)
 const [context,setContext]=useState<ReviewContext>({})
 useEffect(()=>{if(question&&context.source_question_id)captureLoop('review_question_loaded',{experience:'signed_in',question_id:question.id,source_question_id:context.source_question_id,retry_opportunity_id:opportunityId('signed_in',context.source_question_id),distinction_id:context.distinction_id,distinction_status:context.content_status==='ai_source_checked'?'ai_source_checked':'reviewed',content_version:context.content_version},question.id)},[question,context])
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 async function load(){setBusy(true);setError('');try{const r=await fetch('/api/review',{cache:'no-store'}),b=await r.json();if(!r.ok)throw new Error(b.error);setQueue(b)}catch(e){setError(e instanceof Error?e.message:'Could not load review')}finally{setBusy(false)}}
 useEffect(()=>{void load()},[])
 async function start(){if(!queue?.due[0]||busy)return;setBusy(true);setError('');try{const r=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',queue_id:queue.due[0].id,content_kind:queue.due[0].content_kind})}),b=await r.json();if(!r.ok)throw new Error(b.error);setContext(b);setQuestion(b.question);setAnswer('');setFeedback(null)}catch(e){setError(e instanceof Error?e.message:'Could not start review')}finally{setBusy(false)}}
 async function submit(){if(!question||!answer||busy)return;setBusy(true);setError('');try{const r=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'answer',attempt_id:question.id,answer,content_kind:context.content_kind})}),b=await r.json();if(!r.ok)throw new Error(b.error);setFeedback(b);captureLoop('review_question_answered',{experience:'signed_in',question_id:b.question_id,source_question_id:b.source_question_id,retry_opportunity_id:opportunityId('signed_in',b.source_question_id),distinction_id:b.distinction_id,distinction_status:b.content_status==='ai_source_checked'?'ai_source_checked':'reviewed',correct:b.correct,days_since_miss:b.days_since_miss,review_round:b.review_round,content_version:b.content_version},b.question_id)}catch(e){setError(e instanceof Error?e.message:'Could not save review')}finally{setBusy(false)}}
 return <main className="mx-auto max-w-2xl px-5 py-8 text-[#0B2545]">
  <p className="text-xs font-bold uppercase tracking-widest text-[#087986]">Revisit a distinction</p><h1 className="mt-3 text-3xl font-bold">See what you remember.</h1>
  <p className="mt-3 text-slate-600">A new question about an earlier miss. Review results are separate from your original score.</p>
  <p className="mt-3 text-sm text-slate-600">{REVIEW_ELIGIBILITY_COPY}</p>
  {error&&<div role="alert" className="mt-5 rounded-xl bg-red-50 p-4">{error} <button className="underline" onClick={()=>{setQuestion(null);setFeedback(null);void load()}}>Reload queue</button></div>}
  {busy&&<p role="status" className="mt-5">Loading…</p>}
  {!question&&queue&&<section className="mt-6 rounded-2xl border bg-white p-6">
   <h2 className="text-xl font-bold">{queue.due.length?`${queue.due.length} review${queue.due.length===1?'':'s'} due`:queue.available?'Nothing due yet':'Question sets are being prepared'}</h2>
   <p className="mt-3 text-slate-600">{reviewSummary(queue)}</p>
   {queue.due.length>0&&<button disabled={busy} onClick={start} className="mt-5 rounded-xl bg-[#0D8F9C] px-5 py-3 font-bold text-white disabled:opacity-50">Start one review →</button>}
  </section>}
  {question&&context.content_status==='ai_source_checked'&&<p className="mt-4 text-sm text-slate-600">AI-assisted, source-checked practice. Not independently clinically validated.</p>}
  {question&&!feedback&&<section className="mt-6 space-y-4"><h2 className="text-xl">{question.question_stem}</h2><fieldset className="space-y-3"><legend className="sr-only">Choose an answer</legend>{question.options.map(o=><label key={o.label} className={`flex gap-3 rounded-xl border p-4 ${answer===o.label?'border-teal-600 bg-teal-50':'bg-white'}`}><input type="radio" name="review-answer" value={o.label} checked={answer===o.label} onChange={()=>setAnswer(o.label)} disabled={busy}/><span>{o.label}. {o.text}</span></label>)}</fieldset><button disabled={!answer||busy} onClick={submit} className="w-full rounded-xl bg-[#0D8F9C] p-4 font-bold text-white disabled:opacity-50">Submit answer</button></section>}
  {feedback&&<section className="mt-6 space-y-4 rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">{feedback.correct?'Correct.':'Let’s review this distinction.'}</h2><p><strong>Key clue: </strong>{feedback.feedback.key_cue}</p><p><strong>Why the answer fits: </strong>{feedback.feedback.rationale_correct}</p>{!feedback.correct&&<p><strong>About your choice: </strong>{feedback.feedback.rationale_incorrect[feedback.user_answer]}</p>}<p className="rounded-xl bg-teal-50 p-4">{feedback.feedback.one_line_fix}</p><details><summary className="cursor-pointer font-semibold">Supporting references</summary><ul className="mt-2 space-y-2">{feedback.sources.map((s:{url:string;title:string})=><li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></details><p className="text-sm text-slate-600">{feedback.exhausted?'Saved separately. This family has no fresh delayed questions left. You can still revisit its explanations.':'Saved separately. Future reviews use remaining variants.'} Finishing a set does not establish mastery.</p><button disabled={busy} onClick={()=>{setQuestion(null);setFeedback(null);void load()}} className="rounded-xl bg-[#0D8F9C] px-5 py-3 font-bold text-white">Back to review queue →</button></section>}
  <Link href="/entry" className="mt-6 inline-block font-semibold underline">Back to Home</Link>
 </main>
}
