import { readFileSync, writeFileSync } from 'node:fs'
import { parseDraftBank, canonicalHash } from '../../src/lib/learning/draft-bank'
import { sourceCheckedPackets, type TeachingPoint } from '../../src/lib/learning/source-checked-content'
const inputs = [
  {bank:'content/drafts/question-bank-v1.json',points:'content/drafts/teaching-points.tsv'},
  {bank:'content/drafts/question-bank-4.json',points:'content/drafts/teaching-points-bank-4.tsv'},
  {bank:'content/drafts/question-bank-5.json',points:'content/drafts/teaching-points-bank-5.tsv'},
]
const focusOverrides: Record<string,string> = {
  'qb4-h01':'Patient education','qb4-h02':'Safety','qb4-h03':'Priority-setting',
  'qb4-h04':'Patient education','qb4-h05':'Therapeutic communication',
  'qb4-h06':'Medication reasoning','qb4-h07':'Safety',
  'qb4-h08':'Medication reasoning','qb4-h09':'Safety','qb4-h10':'Safety',
  'qb5-h01':'Safety','qb5-h02':'Safety',
  'qb5-h03':'Therapeutic communication','qb5-h04':'Therapeutic communication',
  'qb5-h05':'Patient education','qb5-h06':'Patient education',
  'qb5-h07':'Priority-setting','qb5-h08':'Safety',
  'qb5-h09':'Medication reasoning','qb5-h10':'Assessment-first',
}
const labels: Record<string,string> = {}
const packets = inputs.flatMap(input => {
  const bank = parseDraftBank(JSON.parse(readFileSync(input.bank,'utf8')))
  const points: Record<string,TeachingPoint> = {}
  for (const line of readFileSync(input.points,'utf8').split('\n').filter(l=>l&&!l.startsWith('#'))) {
    const fields = line.split('|')
    if (fields.length !== 5 || points[fields[0]]) throw new Error('Invalid teaching row: '+fields[0])
    points[fields[0]] = {takeaway:fields[1],cues:[fields[2],fields[3],fields[4]],...(focusOverrides[fields[0]]?{focus:focusOverrides[fields[0]]}:{})}
  }
  for (const family of bank.families) {
    if (labels[family.distinction]) throw new Error('Duplicate distinction: '+family.distinction)
    if (!points[family.family_id]) throw new Error('Missing teaching point: '+family.family_id)
    labels[family.distinction] = points[family.family_id].takeaway
  }
  return sourceCheckedPackets(bank,points)
})
if (new Set(packets.map(p=>p.packet_id)).size !== packets.length) throw new Error('Duplicate packet ID')
writeFileSync('content/source-checked-bank.json',JSON.stringify(packets.map(packet=>({packet,packet_sha256:canonicalHash(packet)})),null,2)+'\n')
writeFileSync('src/lib/learning/source-checked-distinction-labels.json',JSON.stringify(labels,null,2)+'\n')
console.log(`Prepared ${packets.length} source-checked packets; ${packets.length*3} items; one delayed review each. Nothing published.`)
