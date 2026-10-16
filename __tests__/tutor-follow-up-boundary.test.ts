import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import FollowUpPrompts from '../src/components/tutor/FollowUpPrompts'
import { EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE } from '../src/lib/ai/tutor-messages'

const render = (messageContent: string) => renderToStaticMarkup(createElement(FollowUpPrompts, {
  messageContent, isLastMessage: true, onPromptClick() {},
}))

describe('tutor follow-up boundary', () => {
  it.each([EVIDENCE_RECHECK_MESSAGE, INCOMPLETE_TUTOR_MESSAGE, 'Call emergency help immediately for this real-patient emergency.'])('does not offer study actions after a handoff or withheld response', content => {
    expect(render(content)).toBe('')
  })
  it('keeps study actions available after a completed explanation', () => {
    expect(render('For this fictional practice question, compare the stated clues.')).toContain('Continue learning:')
  })
})
