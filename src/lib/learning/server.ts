import { createClient } from '@supabase/supabase-js'
import { ClinicalPacket, type ClinicalPacketData } from './clinical-content'
export function learningAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
}
export async function approvedContent(id?: string) {
  let q = learningAdmin().from('clinical_content_versions').select('id, packet').is('withdrawn_at', null)
  if (id) q = q.eq('id', id)
  const { data, error } = await q.order('approved_at', { ascending: false }).limit(id ? 1 : 100)
  if (error) throw new Error('Could not load reviewed content')
  return (data || []).flatMap(row => { const parsed = ClinicalPacket.safeParse(row.packet); return parsed.success ? [{ id: row.id as string, packet: parsed.data }] : [] })
}
export function clinicalQuestionRow(item: ClinicalPacketData['original']) {
  return { ...item, why_correct_short: item.rationale_correct, generation_model: 'reviewed-content', generation_prompt_version: 'clinical-packet-v1' }
}
