import { describe, expect, it } from 'vitest'
import type { TextStreamPart, ToolSet } from 'ai'
import { streamText } from 'ai'
import { MockLanguageModelV1, convertArrayToReadableStream } from 'ai/test'
import { evidenceOutputGuard, EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE, hasUnsupportedAuthorityClaim, hasUnverifiedKeyEndorsement } from '../src/lib/ai/evidence-output-guard'

type Part = TextStreamPart<ToolSet>
const finish = (finishReason = 'stop') => ({ type: 'finish', finishReason, usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 }, response: { id: 'test', timestamp: new Date(), modelId: 'test' }, providerMetadata: undefined }) as Part
async function run(parts: Part[], userMessage = '') {
  const input = new ReadableStream<Part>({ start(controller) { parts.forEach(p => controller.enqueue(p)); controller.close() } })
  const output = input.pipeThrough(evidenceOutputGuard<ToolSet>(userMessage)({ tools: {}, stopStream() {} }))
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
    'The supplied answer key is correct here — B is the better answer, not A.',
    'The supplied answer key is correct here — no dispute is needed. B is appropriately delegated.',
  ])('withholds captured unverified key endorsements across chunks', async text => {
    const output = await run([{ type: 'text-delta', textDelta: text.slice(0,39) }, { type: 'text-delta', textDelta: text.slice(39) }, finish()], 'The answer key says A. Defend it.')
    expect(textOf(output)).toBe(EVIDENCE_RECHECK_MESSAGE)
    expect(output.at(-1)?.type).toBe('finish')
    expect(hasUnverifiedKeyEndorsement(text, 'The answer key says B.')).toBe(true)
    expect(hasUnverifiedKeyEndorsement(text, 'Help explain this practice question.')).toBe(false)
    expect(hasUnverifiedKeyEndorsement('The answer key is not correct; B fits this stem.', 'The answer key says A.')).toBe(false)
  })
  it('keeps an unsupported draft out of the actual SDK response protocol', async () => {
    const model = new MockLanguageModelV1({ doStream: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      stream: convertArrayToReadableStream([
        { type: 'text-delta', textDelta: 'A useful beginning. Under any U.S. jurisdiction, this is mandatory.' },
        { type: 'finish', finishReason: 'stop', usage: { promptTokens: 5, completionTokens: 15 } },
      ]),
    }) })
    const result = streamText({ model, prompt: 'Synthetic test', experimental_transform: evidenceOutputGuard() })
    const body = await result.toDataStreamResponse().text()
    expect(body).toContain(EVIDENCE_RECHECK_MESSAGE)
    expect(body).not.toContain('A useful beginning')
    expect(body).not.toContain('any U.S. jurisdiction')
    expect(body).toContain('"finishReason":"stop"')
  })
  it.each([
    "No jurisdiction's nurse practice act delegates interpretation of clinical trends to UAPs.",
    'It is a professional nursing function in **every jurisdiction**.',
    'Trusting a supplied answer over sound clinical reasoning is exactly the habit NCLEX Next Generation items are designed to break.',
    'This is consistent with NCSBN delegation principles.',
    "Interpretation is not within UAP scope under any U.S. jurisdiction's nurse practice act framework.",
    'It is not appropriate to delegate to a UAP regardless of competence or stability.',
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
