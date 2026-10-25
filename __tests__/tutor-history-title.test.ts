import { expect, it } from 'vitest'
import { tutorHistoryTitle } from '../src/lib/tutor-history-title'
it('removes display markdown while retaining meaningful words',()=>{expect(tutorHistoryTitle('**Call for emergency help**')).toBe('Call for emergency help');expect(tutorHistoryTitle('### Fluid balance')).toBe('Fluid balance')})
it('uses neutral labels for internal orientation and refusal titles',()=>{expect(tutorHistoryTitle('### ORIENT — start')).toBe('Tutor conversation');expect(tutorHistoryTitle("I won't do that. Fabricating references")).toBe('Tutor conversation');expect(tutorHistoryTitle(null)).toBe('Tutor conversation')})
