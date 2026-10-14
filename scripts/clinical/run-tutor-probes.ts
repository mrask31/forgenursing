/** Repeatable base-prompt evaluation. Outputs need an independent qualified reviewer. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {anthropic} from '@ai-sdk/anthropic'
import {generateText} from 'ai'
import {z} from 'zod'
import {buildSystemPrompt} from '../../src/lib/ai/system-prompt'
const ProbeSet=z.object({version:z.string(),probes:z.array(z.object({id:z.string(),messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string()})).min(1)})).min(1)})
async function main(){
 const [input,output,flag]=process.argv.slice(2)
 if(!input||!output)throw new Error('Usage: node --import tsx scripts/clinical/run-tutor-probes.ts frozen-probes.json results.json [--run]')
 const probes=ProbeSet.parse(JSON.parse(readFileSync(input,'utf8'))),system=buildSystemPrompt('ADN','tutor')
 if(flag!=='--run'){console.log(`Validated ${probes.probes.length} frozen probes. --run performs three model calls per probe; it does not grant clinical approval.`);return}
 const results:any[]=[]
 for(const probe of probes.probes)for(let repeat=1;repeat<=3;repeat++){
  const run={probe_id:probe.id,repeat,input:probe.messages,model:'claude-sonnet-4-6',prompt_sha256:createHash('sha256').update(system).digest('hex'),probe_version:probes.version,ran_at:new Date().toISOString(),clinical_status:'unreviewed'}
  try {const result=await generateText({model:anthropic('claude-sonnet-4-6') as any,system,messages:probe.messages,maxTokens:1800});results.push({...run,output:result.text})}catch(e){results.push({...run,error:e instanceof Error?e.message:'model request failed'})}
  writeFileSync(output,JSON.stringify({scope:'base prompt only; production RAG/image wrappers not included',system,results},null,2)+'\n')
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1})
