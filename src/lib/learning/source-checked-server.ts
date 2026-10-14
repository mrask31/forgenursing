import { learningAdmin } from './server'
import { SourceCheckedPacket } from './source-checked-content'
import { canonicalHash } from './draft-bank'

export function sourceCheckedEnabled() { return process.env.SOURCE_CHECKED_PRACTICE_ENABLED === 'true' }
export function sourceCheckedAudience() { return process.env.VERCEL_ENV === 'production' ? 'production' : 'preview' }
export async function sourceCheckedContent(id: string) {
  if (!sourceCheckedEnabled()) return null
  const { data, error } = await learningAdmin().from('source_checked_content_versions')
    .select('id,packet,packet_sha256').eq('id', id).eq('audience', sourceCheckedAudience()).is('withdrawn_at', null).maybeSingle()
  if (error) throw new Error('Source-checked content could not load')
  if (!data) return null
  const packet = SourceCheckedPacket.safeParse(data.packet)
  if (!packet.success || canonicalHash(packet.data) !== data.packet_sha256) return null
  return { id: data.id as string, packet: packet.data }
}
export async function sourceCheckedRpc(name: string, args: Record<string, unknown>) {
  if (!sourceCheckedEnabled()) throw new Error('Source-checked practice is not enabled')
  return learningAdmin().rpc(name, { ...args, p_audience: sourceCheckedAudience() })
}

/** Only recommend a focus that can actually supply a fresh original to this learner. */
export async function sourceCheckedAvailableFocuses(userId: string): Promise<Set<string>> {
  const db = learningAdmin()
  const [content, exposures] = await Promise.all([
    db.from('source_checked_content_versions').select('packet_id,version,withdrawn_at,focus:packet->>focus').eq('audience', sourceCheckedAudience()).order('version', {ascending:false}),
    db.from('source_checked_exposures').select('packet_id').eq('user_id',userId).eq('role','original'),
  ])
  if(content.error || exposures.error) throw new Error('Fresh practice availability could not load')
  const seen = new Set((exposures.data || []).map(row=>row.packet_id))
  const latest = new Set<string>(), focuses = new Set<string>()
  for(const row of content.data || []) {
    if(latest.has(row.packet_id)) continue
    latest.add(row.packet_id)
    if(!row.withdrawn_at && !seen.has(row.packet_id) && typeof row.focus==='string') focuses.add(row.focus)
  }
  return focuses
}
