'use client'
import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { changeAccountPassword } from '@/lib/account-password'
export default function PasswordSettings() {
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState('')
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false)
 return <form className="space-y-3" onSubmit={async event=>{event.preventDefault();setError('');setSaved(false);if(next!==confirm){setError('The new passwords do not match.');return}setBusy(true);try{await changeAccountPassword(getBrowserClient().auth,current,next);setCurrent('');setNext('');setConfirm('');setSaved(true)}catch(err){setError(err instanceof Error?err.message:'Password could not be changed.')}finally{setBusy(false)}}}>
 <h3 className="font-semibold text-[#0B2545]">Change password</h3>
 <label className="block text-sm">Current password<input required type="password" autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" /></label>
 <label className="block text-sm">New password (at least 12 characters)<input required minLength={12} type="password" autoComplete="new-password" value={next} onChange={e=>setNext(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" /></label>
 <label className="block text-sm">Confirm new password<input required minLength={12} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 block w-full rounded-lg border p-3" /></label>
 <button disabled={busy} className="rounded-xl bg-[#0D8F9C] px-4 py-3 font-bold text-white disabled:opacity-50">{busy?'Saving…':'Change password'}</button>
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{saved&&<p role="status" className="text-sm text-teal-700">Password changed. Use your new password the next time you sign in.</p>}
 </form>
}
