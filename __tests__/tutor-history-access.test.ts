import { beforeEach, expect, it, vi } from 'vitest'
const m=vi.hoisted(()=>({user:{id:'owner'} as {id:string}|null,chat:{status:'active',summary:null} as any,chatError:null as any,messages:[{id:'message',role:'user',content:'Saved question'}] as any[],messageError:null as any,eq:vi.fn()}))
vi.mock('@/lib/supabase/server',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:m.user}})},from:(table:string)=>{const chain:any={select:()=>chain,eq:(...a:any[])=>{m.eq(...a);return chain},single:async()=>({data:m.chat,error:m.chatError}),order:async()=>({data:m.messages,error:m.messageError})};return chain}})}))
import { GET } from '../src/app/api/history/route'
const get=()=>GET(new Request('https://preview.test/api/history?id=12345678-1234-4234-8234-123456789012'))
beforeEach(()=>{vi.clearAllMocks();m.user={id:'owner'};m.chat={status:'active',summary:null};m.chatError=null;m.messageError=null})
it('requires an authenticated owner before reading messages',async()=>{m.user=null;expect((await get()).status).toBe(401);expect(m.eq).not.toHaveBeenCalled();m.user={id:'owner'};m.chat=null;expect((await get()).status).toBe(404);expect(m.eq).toHaveBeenCalledWith('user_id','owner')})
it('returns persisted transcripts and reports failures instead of an empty conversation',async()=>{expect(await (await get()).json()).toMatchObject({messages:[{content:'Saved question'}]});m.messageError={code:'unavailable'};expect((await get()).status).toBe(503);m.messageError=null;m.chatError={code:'unavailable'};expect((await get()).status).toBe(503)})
