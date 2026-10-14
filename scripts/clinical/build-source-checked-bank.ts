import { readFileSync, writeFileSync } from 'node:fs'
import { parseDraftBank, canonicalHash } from '../../src/lib/learning/draft-bank'
import { sourceCheckedPackets, type TeachingPoint } from '../../src/lib/learning/source-checked-content'
const bank = parseDraftBank(JSON.parse(readFileSync('content/drafts/question-bank-v1.json', 'utf8')))
const points: Record<string, TeachingPoint> = {}
for (const line of readFileSync('content/drafts/teaching-points.tsv', 'utf8').split('\n').filter(l => l && !l.startsWith('#'))) {
  const fields = line.split('|')
  if (fields.length !== 5 || points[fields[0]]) throw new Error('Invalid teaching row: ' + fields[0])
  points[fields[0]] = { takeaway: fields[1], cues: [fields[2], fields[3], fields[4]] }
}
const packets = sourceCheckedPackets(bank, points)
writeFileSync('content/source-checked-bank.json', JSON.stringify(packets.map(packet => ({ packet, packet_sha256: canonicalHash(packet) })), null, 2) + '\n')
writeFileSync('src/lib/learning/source-checked-distinction-labels.json', JSON.stringify(Object.fromEntries(bank.families.map(f => [f.distinction, points[f.family_id].takeaway])), null, 2) + '\n')
console.log(`Prepared ${packets.length} source-checked packets; 180 items; one delayed review each. Nothing published.`)
