# System: Assets and Content

## Key Asset Locations
- `assets/` root audio files and text content
- `assets/words/` runtime word lists for Level 3

## Content Files
- `assets/about.txt` -> main menu About modal text
- `assets/words/3-letter-words.txt` -> Level 3 pool
- `assets/words/5-letter-words.txt` -> Level 3 pool

## Boot Preload Keys
Configured in `src/scenes/BootScene.ts`:
- `content/about`
- `content/words3`
- `content/words5`
- audio keys for prompts, feedback, phonics, and level completion

## Adding New Assets
1. Place file under `assets/`.
2. Add preload key in `BootScene`.
3. Consume through manager/scene using that key.
4. Run `npm run build` to verify bundling and type safety.
