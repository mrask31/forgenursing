import type { SupabaseClient } from '@supabase/supabase-js'
/** Recheck the signed-in user's password before changing it; never log credentials. */
export async function changeAccountPassword(auth:Pick<SupabaseClient['auth'],'getUser'|'signInWithPassword'|'updateUser'>,current:string,next:string) {
 if(!current || next.length<12) throw new Error('Use your current password and a new password of at least 12 characters.')
 const {data:{user},error}=await auth.getUser()
 if(error || !user?.email) throw new Error('Please sign in again before changing your password.')
 const checked=await auth.signInWithPassword({email:user.email,password:current})
 if(checked.error || checked.data.user?.id!==user.id) throw new Error('Your current password could not be verified.')
 const updated=await auth.updateUser({password:next})
 if(updated.error) throw new Error('Your password could not be changed. Please check password requirements or sign in again and retry.')
}
