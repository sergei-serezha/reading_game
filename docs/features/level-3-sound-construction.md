# Feature: Level 3 - Sound Construction (POC v2)

Source: `src/scenes/SoundConstructionScene.ts`

## Purpose
Word-line reading interaction with a knight + monkey helper.

## Word Source
Preloaded text lists:
- `assets/words/3-letter-words.txt`
- `assets/words/5-letter-words.txt`

At runtime, scene selects 3 random unique words from combined pools.

## Board Layout
- Grid: `7 columns x 6 rows`
- Word rows: 2, 4, 6 (1-indexed)
- Word start column: 2 (1-indexed)
- Left lane used by knight movement
- Right trailing square used for monkey landing after final letter

## Core Loop Per Word Line
1. Knight moves to a line (`UP/DOWN`).
2. Player presses `Space` to dispatch monkey.
3. For each letter in line:
   - monkey jumps to letter
   - phoneme audio plays
   - waits `0.5s`
   - letter tile turns green
4. After last letter:
   - waits `0.5s`
   - monkey jumps to trailing square
   - game speaks: `Repeat after me: <word>` via browser TTS
5. Knight auto-moves along the line and slashes each letter tile.
6. Line is marked complete.

## Progression and Reward
- Level 3-specific unlock threshold: **3 completed words**.
- After 3 words, arcade unlock audio plays then routes to `GameSelectScene`.
- Returning from arcade finalizes level completion path.

## Inputs
- `UP/DOWN`: choose line
- `Space`: trigger monkey sequence on selected unfinished line
