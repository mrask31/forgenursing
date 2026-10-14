/** Operator CLI. Requires independently completed reviewer approval; never fills or invents it. */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { validatePublication } from '../../src/lib/learning/clinical-content'
async function main() {
 const [packetPath, approvalPath, flag] = process.argv.slice(2)
 if (!packetPath || !approvalPath) throw new Error('Usage: npx tsx scripts/clinical/publish.ts packet.json approval.json [--publish]')
 const { packet, approval } = validatePublication(JSON.parse(readFileSync(packetPath,'utf8')), JSON.parse(readFileSync(approvalPath,'utf8')))
 if (flag !== '--publish') { console.log('Packet/attestation structure and hash match. This is not clinical verification. Use --publish only after independently verifying the review record.'); return }
 const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})
 const {error}=await db.from('clinical_content_versions').insert({packet_id:packet.packet_id,version:packet.version,distinction_id:packet.distinction_id,packet,packet_sha256:approval.packet_sha256,approval,approved_at:approval.approved_at})
 if(error) throw error
 console.log(`Published reviewed packet ${packet.packet_id} version ${packet.version}.`)
}
main().catch(e=>{console.error(e.message);process.exitCode=1})
