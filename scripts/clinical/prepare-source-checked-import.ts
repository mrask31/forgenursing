// Produce a validated insert-only publication script; this command never connects to a database.
import {readFileSync,writeFileSync} from 'node:fs'
import {SourceCheckedPacket} from '../../src/lib/learning/source-checked-content'
import {canonicalHash} from '../../src/lib/learning/draft-bank'
const audience=process.argv[2], output=process.argv[3]
if(!['preview','production'].includes(audience)||!output)throw new Error('Usage: tsx scripts/clinical/prepare-source-checked-import.ts preview|production OUTPUT.sql')
const rows=JSON.parse(readFileSync('content/source-checked-bank.json','utf8'))
const quote=(s:string)=>`'${s.replaceAll("'","''")}'`
const statements=rows.map((row:{packet:unknown;packet_sha256:string})=>{
 const p=SourceCheckedPacket.parse(row.packet)
 if(canonicalHash(p)!==row.packet_sha256)throw new Error(`Stale hash for ${p.packet_id}`)
 return `insert into public.source_checked_content_versions(packet_id,version,audience,distinction_id,packet,packet_sha256) values(${quote(p.packet_id)},${p.version},${quote(audience)},${quote(p.distinction_id)},${quote(JSON.stringify(p))}::jsonb,${quote(row.packet_sha256)}) on conflict(packet_id,version,audience) do nothing;`
})
writeFileSync(output,`begin;\n${statements.join('\n')}\ncommit;\n`)
console.log(`Prepared ${rows.length} ${audience} publications. No database changes made.`)
