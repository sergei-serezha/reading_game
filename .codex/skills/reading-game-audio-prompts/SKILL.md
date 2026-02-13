# Skill: reading-game-audio-prompts

## Use This Skill When
- A request changes spoken prompts, SFX, VO sequencing, or preload behavior.
- A request replaces audio assets or key mappings.
- Prompt flow timing sounds wrong or overlaps.

## Primary Files
- `src/scenes/BootScene.ts`
- `src/managers/AudioManager.ts`
- `src/scenes/AlphabetJourneyScene.ts`
- `src/scenes/HiddenSequenceScene.ts`
- `src/scenes/SoundConstructionScene.ts`
- `assets/*`

## Workflow
1. Confirm which scene(s) trigger the audio sequence.
2. Verify asset preload key exists in `BootScene`.
3. Route playback through `AudioManager` methods and reuse existing keys when possible.
4. For chained prompts, prefer completion callbacks over fixed delays when behavior is critical.
5. Run `npm run build`.

## Guardrails
- Do not leave unused audio keys referenced.
- Keep child-facing voice prompts short and clear.
- Ensure fallback behavior still progresses when audio is missing or muted.
