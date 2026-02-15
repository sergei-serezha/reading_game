# Reading Game

A Phaser + TypeScript early-reading game focused on letter recognition, sequence navigation, phoneme prompts, and guided word reading.

## Features
- Main menu with About modal content from `assets/about.txt`.
- Level 1 (`AlphabetJourneyScene`):
  - Navigate to target letters in sequence.
  - Prompt flow: `Say <letter>` -> `Space` slash -> `Let's find <next letter>`.
- Level 2 (`HiddenSequenceScene`):
  - Hidden-letter navigation in sequence order.
- Level 3 (`SoundConstructionScene`, POC v2):
  - 3 random words loaded from `assets/words/3-letter-words.txt` and `assets/words/5-letter-words.txt`.
  - Words appear on rows 2/4/6.
  - Knight moves up/down; `Space` dispatches monkey helper.
  - Monkey reads letters with phoneme + pacing, then TTS says `Repeat after me: <word>`.
  - Knight auto-slashes letters after monkey finishes a line.
- Arcade reward flow and game-selection scene.

## Documentation
Full docs are in `docs/`:
- `docs/README.md` (index)
- `docs/features/*.md` (feature-by-feature)
- `docs/systems/*.md` (system-level behavior)
- `docs/architecture.md`

## Tech Stack
- TypeScript
- Phaser 3
- Vite

## Project Structure
- `src/scenes/` scene flow and game states
- `src/objects/` gameplay objects
- `src/managers/` audio, feedback, input, progress, rewards
- `src/config/` constants and level configs
- `src/types/` interfaces and type contracts
- `assets/` audio and content files

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
- Main menu:
  - `Enter`/`Space`: open level select
- Level 1 and 2:
  - Arrow/WASD/swipe/tap for movement
  - Level 1: `Space` to slash after correct landing
- Level 3:
  - `UP/DOWN` to select word line
  - `Space` to dispatch monkey helper

## Development Notes
- Keep child flow stable: prompt -> action -> feedback -> next prompt.
- Preload all new runtime assets in `BootScene`.
- Use completion-based audio chaining for critical prompt sequences.
- Run `npm run build` before committing.
