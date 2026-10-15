import { describe, expect, it } from 'vitest'
import type { TextStreamPart, ToolSet } from 'ai'
import { evidenceOutputGuard, EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE, hasUnsupportedAuthorityClaim } from '../src/lib/ai/evidence-output-guard'

type Part = TextStreamPart<ToolSet>
const finish = (finishReason = 'stop') => ({ type: 'finish', finishReason, usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 }, response: { id: 'test', timestamp: new Date(), modelId: 'test' }, providerMetadata: undefined }) as Part
async function run(parts: Part[]) {
  const input = new ReadableStream<Part>({ start(controller) { parts.forEach(p => controller.enqueue(p)); controller.close() } })
  const output = input.pipeThrough(evidenceOutputGuard<ToolSet>()({ tools: {}, stopStream() {} }))
  const result: Part[] = []
  const reader = output.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result.push(value)
  }
  return result
}
const textOf = (parts: Part[]) => parts.filter(p => p.type === 'text-delta').map(p => p.textDelta).join('')
describe('evidence output guard', () => {
  it.each([
    "No jurisdiction's nurse practice act delegates interpretation of clinical trends to UAPs.",
    'It is a professional nursing function in **every jurisdiction**.',
    'Trusting a supplied answer over sound clinical reasoning is exactly the habit NCLEX Next Generation items are designed to break.',
    'This is consistent with NCSBN delegation principles.',
    "Interpretation is not within UAP scope under any U.S. jurisdiction's nurse practice act framework.",
  ])('withholds observed unsupported claim: %s', async text => {
    const output = await run([{ type: 'text-delta', textDelta: text }, finish()])
    expect(textOf(output)).toBe(EVIDENCE_RECHECK_MESSAGE)
    expect(output.at(-1)?.type).toBe('finish')
  })
  it('checks across delta boundaries and withholds the entire draft', async () => {
    const output = await run([{ type: 'text-delta', textDelta: 'A useful explanation. In every juris' }, { type: 'text-delta', textDelta: 'diction, this is required.' }, finish()])
    expect(textOf(output)).toBe(EVIDENCE_RECHECK_MESSAGE)
  })
  it('preserves ordinary exam context, local-policy caveats, and emergency escalation', async () => {
    const text = 'For this NCLEX practice question, B fits the stated circumstances. Check local policy and authorized tasks. For a real emergency, activate local emergency help immediately.'
    expect(hasUnsupportedAuthorityClaim(text)).toBe(false)
    expect(textOf(await run([{ type: 'text-delta', textDelta: text }, finish()]))).toBe(text)
  })
  it('does not expose a partial explanation after a provider error', async () => {
    const output = await run([{ type: 'text-delta', textDelta: 'Partial clinical instructions' }, { type: 'error', error: 'unavailable' }])
    expect(textOf(output)).toBe('')
    expect(output).toEqual([{ type: 'error', error: 'unavailable' }])
  })
  it('withholds truncated responses and streams without completion', async () => {
    for (const ending of [[finish('length')], []]) {
      expect(textOf(await run([{ type: 'text-delta', textDelta: 'Partial clinical instructions' }, ...ending]))).toBe(INCOMPLETE_TUTOR_MESSAGE)
    }
  })
})
