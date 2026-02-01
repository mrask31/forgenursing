# Reflections Mode Removal Checklist

## Status: IN PROGRESS

### Completed ✅
1. ✅ `src/components/tutor/TutorHeader.tsx` - Removed reflections toggle, simplified to "Clinical Tutor" badge
2. ✅ `src/components/tutor/TutorHeader.tsx` - Removed conditional class select (now always visible)
3. ✅ `src/components/tutor/TutorHeader.tsx` - Changed type from `'tutor' | 'reflections'` to `'tutor'`
4. ✅ `src/app/(app)/tutor/TutorPageClient.tsx` - Removed `currentMode` state
5. ✅ `src/app/(app)/tutor/TutorPageClient.tsx` - Changed `currentModeFromUrl` to constant `currentMode = 'tutor'`
6. ✅ `src/app/(app)/tutor/TutorPageClient.tsx` - Updated `handleNewSession` to always use 'new_question'
7. ✅ `src/app/(app)/tutor/TutorPageClient.tsx` - Updated `handleInstantStart` to always use 'new_question' and removed mode check

### Remaining Tasks 🔄

#### src/app/(app)/tutor/TutorPageClient.tsx
- [ ] Update all `currentModeFromUrl` references to `currentMode` or just `'tutor'`
- [ ] Remove `modeParam` from URL parsing
- [ ] Update router.push/replace calls to remove `mode=` parameter
- [ ] Update `getSubtitle()` to remove reflections check
- [ ] Update chat filtering logic to remove reflections session_type checks
- [ ] Update dependency arrays in useCallback/useEffect

#### src/components/tutor/TutorLanding.tsx
- [ ] Remove `mode` prop type `'reflections'`
- [ ] Remove reflections-specific heading logic in `getMainHeading()`
- [ ] Remove reflections-specific subtext in `getSubtext()`
- [ ] Remove reflections check in `getHelperText()`
- [ ] Remove reflections check in useEffect

#### src/components/tutor/TutorSession.tsx
- [ ] Remove `mode` prop type `'reflections'`
- [ ] Update intent logic to always use 'new_question'
- [ ] Remove mode parameter from ClinicalTutorWorkspace

#### src/components/tutor/ChatInterface.tsx
- [ ] Remove `mode` prop type `'reflections'`
- [ ] Remove reflections placeholder in `getPlaceholder()`
- [ ] Simplify placeholder logic

#### src/components/tutor/SuggestedPrompts.tsx
- [ ] Remove `mode` prop type `'reflections'`
- [ ] Remove REFLECTION_PROMPTS import
- [ ] Remove reflections check in prompt selection logic

#### src/components/tutor/HistorySheet.tsx
- [ ] Remove `mode` prop type `'reflections'`
- [ ] Remove reflections filtering logic
- [ ] Simplify chat filtering to only show tutor chats

#### src/components/tutor/TutorContext.tsx
- [ ] Remove `mode` from context type
- [ ] Remove mode parsing from URL (always 'tutor')

#### src/components/layout/HistoryButton.tsx
- [ ] Remove reflections routing logic
- [ ] Simplify handleChatClick to always use tutor mode

#### src/app/(app)/readiness/page.tsx
- [ ] Remove reflections filtering from chat list
- [ ] Simplify to only show tutor chats

#### src/lib/constants.ts
- [ ] Remove REFLECTION_PROMPTS constant

### Testing Checklist
- [ ] Tutor page loads without errors
- [ ] Can create new chat sessions
- [ ] Can resume existing chat sessions
- [ ] Class selection works
- [ ] File attachment works
- [ ] Chat history shows correctly
- [ ] Dashboard shows correct stats
- [ ] No console errors related to mode/reflections

### Database Considerations
- Keep `session_type` field in database (backward compatibility)
- Existing reflection sessions will remain in database but won't be accessible
- No migration needed - just stop creating new reflection sessions

### URL Cleanup
Before: `/tutor?mode=tutor&sessionId=123`
After: `/tutor?sessionId=123`

Before: `/tutor?mode=reflections&sessionId=456`
After: Redirect to `/tutor?sessionId=456` (or show as regular tutor chat)
