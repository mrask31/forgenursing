# Requirements Document

## Introduction

Add ElevenLabs text-to-speech capability to ForgeNursing so that Forge can speak responses aloud. This is a self-contained, opt-in feature controlled by a toggle. It does not modify any existing functionality. A new API route proxies text to the ElevenLabs streaming TTS API, a new audio player component renders inline on each Forge message, and a global voice toggle in the tutor header controls auto-play behavior.

## Glossary

- **TTS_API_Route**: The Next.js API route at `app/api/tts/route.ts` that accepts text and a voice identifier, calls the ElevenLabs API, and streams back audio.
- **ForgeAudioPlayer**: A React component (`components/forge-audio-player.tsx`) that renders a small speaker icon button, fetches TTS audio on click, and plays it using the Web Audio API.
- **VoiceToggle**: A small speaker icon button in the TutorHeader that enables or disables automatic voice playback of new Forge responses.
- **ElevenLabs_API**: The external ElevenLabs text-to-speech REST API used to synthesize speech from text.
- **Markdown_Stripper**: A utility function that removes markdown formatting (bold, headings, italic, bullet points) from text before sending it to the ElevenLabs_API.
- **Voice_Preference**: A boolean value stored in localStorage under the key `forge-voice-enabled` indicating whether auto-play is on or off.

## Requirements

### Requirement 1: TTS API Route Creation

**User Story:** As a developer, I want a dedicated API route that proxies text-to-speech requests to ElevenLabs, so that the client never exposes the API key and audio is streamed efficiently.

#### Acceptance Criteria

1. THE TTS_API_Route SHALL accept POST requests with a JSON body containing `text` (string) and `voice` (`'forge'` or `'patient'`).
2. WHEN the `voice` field is `'forge'`, THE TTS_API_Route SHALL use the ElevenLabs voice ID `pNInz6obpgDQGcFmaJgB` (Adam).
3. WHEN the `voice` field is `'patient'`, THE TTS_API_Route SHALL use the ElevenLabs voice ID `EXAVITQu4vr4xnSDxMaL` (Bella).
4. THE TTS_API_Route SHALL use the ElevenLabs model `eleven_monolingual_v1` for all requests.
5. THE TTS_API_Route SHALL return a response with content type `audio/mpeg`.
6. THE TTS_API_Route SHALL export `maxDuration = 30` to allow sufficient processing time on Vercel.
7. IF the `text` field is missing or empty, THEN THE TTS_API_Route SHALL return a 400 status with a descriptive error message.
8. IF the `voice` field is missing or not one of the allowed values, THEN THE TTS_API_Route SHALL return a 400 status with a descriptive error message.
9. IF the `ELEVENLABS_API_KEY` environment variable is not configured, THEN THE TTS_API_Route SHALL return a 500 status with a descriptive error message.
10. IF the ElevenLabs_API returns an error, THEN THE TTS_API_Route SHALL return a 502 status with a descriptive error message.

### Requirement 2: Markdown Stripping Before TTS

**User Story:** As a nursing student, I want Forge's spoken responses to sound natural without markdown artifacts, so that the audio is clear and easy to understand.

#### Acceptance Criteria

1. WHEN text is sent to the TTS_API_Route, THE Markdown_Stripper SHALL remove bold markers (`**`), heading markers (`##`, `###`), italic markers (`*`), and bullet point markers (`-`, `*` at line start) from the text.
2. THE Markdown_Stripper SHALL preserve the underlying plain text content after removing markdown formatting.
3. FOR ALL valid markdown-formatted strings, stripping then re-stripping SHALL produce an identical result (idempotence).
4. THE Markdown_Stripper SHALL be applied BEFORE the 2000 character truncation check in Requirement 3, so that the character budget is spent on actual spoken content rather than markdown syntax.

### Requirement 3: Text Length Enforcement

**User Story:** As a developer, I want to enforce a maximum text length for TTS requests, so that API costs and latency remain predictable.

#### Acceptance Criteria

1. THE TTS_API_Route SHALL enforce a maximum text length of 2000 characters on the already-stripped plain text (after Markdown_Stripper has been applied per Requirement 2.4).
2. WHEN the stripped text exceeds 2000 characters, THE TTS_API_Route SHALL truncate the text to 1997 characters and append `...` before sending to the ElevenLabs_API.
3. WHEN the stripped text is 2000 characters or fewer, THE TTS_API_Route SHALL send the text unmodified to the ElevenLabs_API.

### Requirement 4: ForgeAudioPlayer Component

**User Story:** As a nursing student, I want a small speaker button on each Forge response, so that I can listen to explanations while studying hands-free.

#### Acceptance Criteria

1. THE ForgeAudioPlayer SHALL accept `text` (string) and `autoPlay` (boolean) as props.
2. THE ForgeAudioPlayer SHALL render a small speaker icon button in its idle state.
3. WHEN the speaker button is clicked, THE ForgeAudioPlayer SHALL fetch audio from the TTS_API_Route and play it using the Web Audio API.
4. WHILE audio is loading, THE ForgeAudioPlayer SHALL display an animated pulse indicator.
5. WHILE audio is playing, THE ForgeAudioPlayer SHALL display a waveform animation and allow the user to click to stop playback.
6. IF an error occurs during fetch or playback, THEN THE ForgeAudioPlayer SHALL display a muted speaker icon.
7. THE ForgeAudioPlayer SHALL use teal (`#0D8F9C`) for the icon color and teal-light (`#E0F4F6`) as the background when playing.
8. WHEN `autoPlay` is true and the component mounts with new text, THE ForgeAudioPlayer SHALL automatically fetch and play the audio without user interaction.

### Requirement 5: Audio Player Integration in Chat Messages

**User Story:** As a nursing student, I want the audio player to appear on each Forge response in the chat, so that I can listen to any explanation.

#### Acceptance Criteria

1. THE ChatMessageList SHALL render a ForgeAudioPlayer for each assistant message.
2. THE ForgeAudioPlayer SHALL be positioned at the bottom right of each Forge message bubble, appearing small and unobtrusive.
3. THE ForgeAudioPlayer SHALL receive the message content as its `text` prop.
4. THE ForgeAudioPlayer SHALL receive the current Voice_Preference as its `autoPlay` prop.

### Requirement 6: Global Voice Toggle

**User Story:** As a nursing student, I want a global toggle to enable auto-read for all new Forge responses, so that I can switch between reading and listening modes easily.

#### Acceptance Criteria

1. THE VoiceToggle SHALL render as a small speaker icon button in the TutorHeader, positioned next to the Forge identity section.
2. WHEN the VoiceToggle is clicked, THE VoiceToggle SHALL toggle the Voice_Preference between enabled and disabled.
3. WHILE Voice_Preference is enabled, THE ForgeAudioPlayer on all new Forge messages SHALL set `autoPlay` to true.
4. WHILE Voice_Preference is disabled, THE ForgeAudioPlayer on all Forge messages SHALL set `autoPlay` to false (manual play only).
5. THE VoiceToggle SHALL persist the Voice_Preference in localStorage under the key `forge-voice-enabled`.
6. THE VoiceToggle SHALL default to disabled (off) when no stored preference exists.
7. WHEN the page loads, THE VoiceToggle SHALL read the stored Voice_Preference from localStorage and restore the previous state.

### Requirement 7: Isolation from Existing Functionality

**User Story:** As a developer, I want this feature to be fully self-contained, so that it does not introduce regressions in existing chat, API, or UI behavior.

#### Acceptance Criteria

1. THE TTS_API_Route SHALL be the only new API route created; no existing API routes SHALL be modified.
2. THE ForgeAudioPlayer SHALL not alter the rendering, layout, or behavior of existing chat message content.
3. THE VoiceToggle SHALL not affect the behavior of any existing TutorHeader controls (class selector, new session button).
