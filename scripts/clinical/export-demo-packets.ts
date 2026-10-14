/** Export current public sample for HUMAN review. Never marks anything approved. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { DEMO_LESSONS } from '../../src/lib/demo-lessons'
import { demoDistinction } from '../../src/lib/learning/demo-distinction'
const target = process.argv[2]
if (!target) throw new Error('Usage: npx tsx scripts/clinical/export-demo-packets.ts output-directory')
mkdirSync(target,{recursive:true})
for(const [index,lesson] of DEMO_LESSONS.entries()) {
 writeFileSync(`${target}/sample-${index+1}.json`, JSON.stringify({status:'unreviewed',rubric_version:'0.2',distinction_id:demoDistinction(lesson.topic),generation_provenance:'unknown historical provenance',lesson,missing:['independent RN review','verified reference sections/dates','at least three reviewed delayed variants','reviewer approval bound to frozen packet hash']},null,2)+'\n')
}
console.log(`Exported ${DEMO_LESSONS.length} unreviewed original/retry pairs; none approved.`)
