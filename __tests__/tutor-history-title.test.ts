import { expect, it } from 'vitest'
import { tutorHistoryTitle, tutorHistoryHref } from '../src/lib/tutor-history-title'
it('removes display markdown while retaining meaningful words',()=>{expect(tutorHistoryTitle('**Call for emergency help**')).toBe('Call for emergency help');expect(tutorHistoryTitle('### Fluid balance')).toBe('Fluid balance')})
it('uses neutral labels for internal orientation and refusal titles',()=>{expect(tutorHistoryTitle('### ORIENT — start')).toBe('Tutor conversation');expect(tutorHistoryTitle("I won't do that. Fabricating references")).toBe('Tutor conversation');expect(tutorHistoryTitle(null)).toBe('Tutor conversation')})

it('hides the refusal-derived audit titles',()=>{expect(tutorHistoryTitle('I could not give a sufficiently supported explanation')).toBe('Tutor conversation');expect(tutorHistoryTitle("No. I won't do that. Fabricating citations")).toBe('Tutor conversation')})
it('carries course context only for course-owned history links',()=>{expect(tutorHistoryHref('session','course')).toBe('/tutor?sessionId=session&classId=course');expect(tutorHistoryHref('session','general')).toBe('/tutor?sessionId=session');expect(tutorHistoryHref('session')).toBe('/tutor?sessionId=session')})
