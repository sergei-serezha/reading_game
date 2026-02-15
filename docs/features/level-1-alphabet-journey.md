# Feature: Level 1 - Alphabet Journey

Source: `src/scenes/AlphabetJourneyScene.ts`

## Core Loop
1. Player (knight) moves on a grid between adjacent tiles.
2. Correct target letter triggers:
   - `Say <letter>` prompt
   - Wait for `Space` slash input
   - Knight slashes tile; tile breaks animation
   - Continue with `Let's find <next letter>`
3. Wrong letter triggers reject feedback and return movement.

## Inputs
- Arrow/WASD/swipe: movement
- Tap highlighted tiles: move
- `Space`: required slash confirmation after correct letter landing

## Feedback
- Correct: visual celebration + feedback FX
- Incorrect: shake/reject
- Prompt replay speaker button for `Let's find <letter>`

## Rewards
- Uses reward tracker for arcade unlock thresholds in letter-mode scenes.
