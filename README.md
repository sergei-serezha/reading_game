# Reading Game

A Phaser + TypeScript early-reading game focused on letter recognition, sequence navigation, and phoneme prompts.

## Current Gameplay Highlights
- Level 1 (`AlphabetJourneyScene`):
  - Navigate a grid to the next target letter.
  - Prompt flow: `Say <letter>` -> press `Space` -> knight slashes and letter breaks -> `Let's find <next letter>`.
- Level 2 (`HiddenSequenceScene`): hidden-letter sequence variant.
- Level 3 (`SoundConstructionScene`): tap letters in order to build words.
- Reward loop:
  - Every 5 correct turns unlocks game selection.
  - Unlock voice clip is played before redirect (`assets/hooray_5_challenges_v2.wav`).

## Tech Stack
- TypeScript
- Phaser 3
- Vite

## Project Structure
- `src/scenes/` scene flow and game states
- `src/objects/` gameplay objects (player, tiles, grid, UI objects)
- `src/managers/` audio, feedback, input, progress, rewards
- `src/config/` constants and level configs
- `assets/` audio and static media

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. Build production bundle:
   ```bash
   npm run build
   ```
4. Preview build:
   ```bash
   npm run preview
   ```

## Controls
- Arrow keys: move between adjacent highlighted tiles
- Mouse/touch: tap highlighted tiles
- Space (Level 1 correct letter state): perform sword slash

## Audio Notes
- Audio assets are loaded in `src/scenes/BootScene.ts`.
- New runtime audio must be preloaded there before use.
- Prompt chaining should prefer completion-based sequencing for reliability.

## Development Notes
- Keep changes child-flow safe: prompt -> action -> feedback -> next prompt.
- Run `npm run build` before committing.
- If adding VO/FX assets, verify key names in `AudioManager` and preload keys in `BootScene`.
