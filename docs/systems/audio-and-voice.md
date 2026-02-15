# System: Audio and Voice

## Audio Manager
Source: `src/managers/AudioManager.ts`

## Supported Audio APIs
- SFX playback by key (`playSfx` internals)
- Completion-aware playback (`playSfxAndWait`, `playPhonemeAndWait`)
- Browser TTS helper (`speakTextAndWait`)

## Prompt Keys
- `feedback/say`
- `feedback/lets-find`
- `feedback/arcade-unlock`
- phonemes: `phonics/<letter>`

## Preload Requirements
All audio/text keys must be preloaded in `BootScene` before use.

## Level 3 Voice
- Per-letter phoneme playback.
- Spoken phrase using browser speech synthesis:
  - `Repeat after me: <word>`

## Fallback Behavior
If browser TTS is unavailable or errors, flow continues without blocking gameplay.
