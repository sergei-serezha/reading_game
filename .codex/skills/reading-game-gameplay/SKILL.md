# Skill: reading-game-gameplay

## Use This Skill When
- A request changes game mechanics or scene state transitions.
- A request modifies movement, tile interaction, or progression logic.
- A request adds a player action (keyboard/tap) tied to scene flow.

## Primary Files
- `src/scenes/AlphabetJourneyScene.ts`
- `src/scenes/HiddenSequenceScene.ts`
- `src/scenes/SoundConstructionScene.ts`
- `src/objects/PlayerCharacter.ts`
- `src/objects/LetterTile.ts`
- `src/objects/LetterGrid.ts`

## Workflow
1. Identify the exact state gate where behavior should change.
2. Add or update explicit state flags (avoid implicit timing state).
3. Keep input handling deterministic (ignore inputs when `isProcessing` or equivalent guard is active).
4. Update UI prompts to match the interaction state.
5. Run `npm run build` and verify no scene regressions.

## Guardrails
- Do not bypass reward/progression logic.
- Avoid changing unrelated scenes unless flow consistency requires it.
- Prefer additive methods over broad rewrites.
