import type { StreamTextTransform, TextStreamPart, ToolSet } from 'ai'

import { EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE } from './tutor-messages'
export { EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE } from './tutor-messages'

/** Narrow release safeguard for observed authority overclaims, not clinical validation. */
export function hasUnsupportedAuthorityClaim(text: string): boolean {
  const plain = text.normalize('NFKC').replace(/[*_`]/g, '').replace(/\s+/g, ' ')
  return [
    /\b(?:every|all|any|no)\s+(?:[a-z.]+\s+){0,3}(?:states?|jurisdictions?)\b/i,
    /\b(?:regardless of|across)\s+(?:(?:the|all)\s+)?jurisdictions?\b/i,
    /\b(?:all|every|no)\s+nurse practice acts?\b/i,
    /\b(?:ncsbn|nclex(?: next generation)?)\b[^.!?]{0,160}\b(?:requires?|mandates?|prohibits?|designed|standards?|principles|testing logic)\b/i,
    /\b(?:according to|consistent with|mandated by|required by)\s+(?:the\s+)?(?:ncsbn|nclex)\b/i,
    /\bregardless of\b[^.!?]{0,100}\b(?:competence|stability|plan of care)\b/i,
  ].some(pattern => pattern.test(plain))
}

/** Detect the captured key-endorsement contradiction; not a clinical answer checker. */
export function hasContradictoryKeyEndorsement(text: string, userMessage: string): boolean {
  const key = userMessage.match(/\b(?:answer\s+)?key\s+(?:says|states|is)\s+([A-D])\b/i)?.[1]
  if (!key) return false
  const plain = text.normalize('NFKC').replace(/[*_`]/g, '').replace(/\s+/g, ' ')
  const endorsesKey = /\b(?:answer\s+)?key\s+(?:is|was)\s+correct\b/i.test(plain)
  return endorsesKey && new RegExp(`\\bnot\\s+${key}\\b`, 'i').test(plain)
}

/** Buffer the answer so a late unsupported claim cannot leak through early deltas. */
export function evidenceOutputGuard<TOOLS extends ToolSet>(userMessage = ''): StreamTextTransform<TOOLS> {
  return () => {
    let parts: TextStreamPart<TOOLS>[] = []
    let failed = false
    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (failed) return
        if (part.type === 'error') {
          parts = []
          failed = true
          controller.enqueue(part)
          return
        }
        parts.push(part)
        if (part.type !== 'finish') return

        const text = parts.filter(p => p.type === 'text-delta').map(p => p.textDelta).join('')
        const replacement = part.finishReason !== 'stop'
          ? INCOMPLETE_TUTOR_MESSAGE
          : hasUnsupportedAuthorityClaim(text) || hasContradictoryKeyEndorsement(text, userMessage)
            ? EVIDENCE_RECHECK_MESSAGE : null
        let emitted = false
        for (const pending of parts) {
          if (replacement && pending.type === 'text-delta') {
            if (!emitted) controller.enqueue({ type: 'text-delta', textDelta: replacement })
            emitted = true
          } else {
            controller.enqueue(pending)
          }
        }
        parts = []
      },
      flush(controller) {
        // An interrupted stream is never a verified complete explanation.
        if (!failed && parts.length) {
          controller.enqueue({ type: 'text-delta', textDelta: INCOMPLETE_TUTOR_MESSAGE })
        }
      },
    })
  }
}
