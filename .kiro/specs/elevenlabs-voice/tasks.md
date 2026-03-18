# Implementation Plan: ElevenLabs Voice (TTS)

## Overview

Incrementally build the ElevenLabs TTS integration for ForgeNursing in TypeScript. Each task builds on the previous, starting with utilities and API route, then components, then wiring everything together. All code is additive — no existing files are modified in breaking ways.

## Tasks

- [ ] 1. Set up test infrastructure and TTS utilities
  - [ ] 1.1 Install dev dependencies and configure Vitest
    - Run `npm install -D vitest fast-check @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom`
    - Create `vitest.config.ts` at project root with jsdom environment and React plugin
    - Add `"test": "vitest --run"` script to `package.json`
    - _Requirements: Design Testing Strategy_

  - [ ] 1.2 Implement `stripMarkdown` and `truncateForTTS` in `src/lib/tts-utils.ts`
    - Implement `stripMarkdown(text: string): string` with ordered regex replacements: code blocks, inline code, headings, bold, italic, links, images, blockquotes, bullet/list markers, horizontal rules, collapse whitespace
    - Implement `truncateForTTS(text: string, maxLength = 2000): string` that truncates to `maxLength - 3` and appends `...` when over limit
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [ ]* 1.3 Write property tests for `stripMarkdown` idempotence
    - **Property 3: Markdown stripping is idempotent**
    - **Validates: Requirement 2.3**
    - Create `__tests__/tts-utils.test.ts`
    - Use `fc.assert(fc.property(fc.string(), ...))` to verify `stripMarkdown(stripMarkdown(s)) === stripMarkdown(s)`

  - [ ]* 1.4 Write property tests for `stripMarkdown` content preservation
    - **Property 2: Markdown stripping removes markers and preserves content**
    - **Validates: Requirements 2.1, 2.2**
    - Generate plain text, wrap in random markdown formatting, verify stripped output contains all original words and no markdown syntax

  - [ ]* 1.5 Write property tests for `truncateForTTS` length enforcement
    - **Property 4: Processed text never exceeds 2000 characters**
    - **Validates: Requirements 2.4, 3.1, 3.2, 3.3**
    - For any input string, verify `stripMarkdown` then `truncateForTTS` produces output ≤ 2000 chars
    - Verify unmodified pass-through when already ≤ 2000 chars
    - Verify truncated output ends with `...` when original exceeded limit

- [ ] 2. Checkpoint — Verify utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement TTS API route
  - [ ] 3.1 Create `src/app/api/tts/route.ts` with POST handler
    - Export `maxDuration = 30`
    - Define `VOICE_MAP` with `forge` → `pNInz6obpgDQGcFmaJgB` (Adam) and `patient` → `EXAVITQu4vr4xnSDxMaL` (Bella), with comments noting voice IDs must be verified as active in the ElevenLabs account; if unavailable, substitute with any professional male / warm female voice
    - Validate `text` (non-empty string) and `voice` (one of `'forge' | 'patient'`), return 400 on invalid input
    - Check `ELEVENLABS_API_KEY` env var, return 500 if missing
    - Call `stripMarkdown(text)` then `truncateForTTS(stripped, 2000)`
    - POST to `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` with model `eleven_turbo_v2`, stability `0.5`, similarity_boost `0.75`
    - Stream the ElevenLabs response body back with `Content-Type: audio/mpeg`
    - Return 502 on upstream ElevenLabs errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 3.2 Write property tests for TTS route input validation
    - **Property 1: Invalid requests are rejected with 400**
    - **Validates: Requirements 1.7, 1.8**
    - Create `__tests__/tts-route.test.ts`
    - Generate arbitrary invalid request bodies (missing text, empty text, whitespace-only text, invalid voice values) and verify 400 response

  - [ ]* 3.3 Write unit tests for TTS route
    - Test voice ID mapping returns correct IDs for `'forge'` and `'patient'`
    - Test `maxDuration` export equals `30`
    - Test model ID is `eleven_turbo_v2`
    - Test missing API key returns 500
    - Test upstream ElevenLabs error returns 502
    - Test success response has `Content-Type: audio/mpeg`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.10_

- [ ] 4. Checkpoint — Verify API route tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement ForgeAudioPlayer component
  - [ ] 5.1 Create `src/components/forge-audio-player.tsx`
    - Accept `text` (string) and `autoPlay` (boolean) props
    - Implement state machine: `idle` → `loading` → `playing` → `idle`, with `error` state on failure
    - Use `useRef` for `AudioContext` and `AudioBufferSourceNode`
    - On click (or autoPlay on mount), POST to `/api/tts` with `{ text, voice: 'forge' }`, decode response as audio buffer, play via Web Audio API
    - Render `Volume2` icon (teal `#0D8F9C`) in idle, pulsing in loading, animated with `#E0F4F6` background in playing, `VolumeX` (gray) in error
    - Cleanup on unmount: stop playback, close AudioContext
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 5.2 Write property test for ForgeAudioPlayer rendering per assistant message
    - **Property 5: Each assistant message gets a ForgeAudioPlayer with matching text**
    - **Validates: Requirements 5.1, 5.3**
    - Create `__tests__/forge-audio-player.test.tsx`
    - Generate lists of chat messages with random roles, verify rendered ForgeAudioPlayer count equals assistant message count and text props match

  - [ ]* 5.3 Write unit tests for ForgeAudioPlayer states
    - Test renders a button in idle state
    - Test transitions to error state on fetch failure
    - Test auto-plays when `autoPlay` is true
    - _Requirements: 4.2, 4.3, 4.6, 4.8_

- [ ] 6. Implement VoiceToggle component
  - [ ] 6.1 Create `src/components/tutor/VoiceToggle.tsx`
    - Accept `enabled` (boolean) and `onToggle` (enabled: boolean) => void props
    - Render `Volume2` icon when enabled, `VolumeX` when disabled, using `lucide-react`
    - On click, call `onToggle(!enabled)`
    - _Requirements: 6.1, 6.2_

  - [ ]* 6.2 Write property tests for VoiceToggle consistency
    - **Property 6: Voice preference toggle consistency**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Create `__tests__/voice-toggle.test.tsx`
    - For any boolean state, verify clicking produces negated state

  - [ ]* 6.3 Write property test for localStorage round-trip
    - **Property 7: Voice preference localStorage round-trip**
    - **Validates: Requirements 6.5, 6.7**
    - For any boolean value, write to localStorage as `"true"`/`"false"`, read back, verify equality

  - [ ]* 6.4 Write unit tests for VoiceToggle defaults
    - Test defaults to disabled when no localStorage value exists
    - _Requirements: 6.6_

- [ ] 7. Checkpoint — Verify component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Wire components into existing UI
  - [ ] 8.1 Add voice state management and VoiceToggle to TutorHeader/TutorSession
    - In the component that owns both TutorHeader and ChatMessageList (likely `TutorSession` or `ChatInterface`), add `voiceEnabled` state initialized from `localStorage.getItem('forge-voice-enabled') === 'true'`
    - On toggle, update state and write to localStorage
    - Pass `voiceEnabled` and toggle handler down to TutorHeader for VoiceToggle rendering
    - Render `<VoiceToggle>` in TutorHeader next to the Forge identity section
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 8.2 Integrate ForgeAudioPlayer into ChatMessageList
    - For each assistant message in ChatMessageList, render `<ForgeAudioPlayer text={message.content} autoPlay={voiceEnabled} />` at the bottom-right of the message bubble
    - Pass `voiceEnabled` as a prop from the parent component
    - Ensure the player is small and unobtrusive, not altering existing message layout
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.2_

  - [ ] 8.3 Add `ELEVENLABS_API_KEY` to environment configuration
    - Add `ELEVENLABS_API_KEY` to `.env.local` (or document it as required)
    - Verify the API key is accessible in the TTS route via `process.env.ELEVENLABS_API_KEY`
    - _Requirements: 1.9_

- [ ] 9. Final checkpoint — Ensure all tests pass and feature is integrated
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no existing API routes were modified (_Requirement 7.1_)
  - Verify no existing chat message rendering is altered (_Requirement 7.2_)
  - Verify no existing TutorHeader controls are affected (_Requirement 7.3_)

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Voice IDs (Adam: `pNInz6obpgDQGcFmaJgB`, Bella: `EXAVITQu4vr4xnSDxMaL`) must be verified as active in the ElevenLabs account before deployment. If unavailable, substitute with any professional male and warm female voices available in the account
- Model is `eleven_turbo_v2` (faster, cheaper than v1, same quality)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
