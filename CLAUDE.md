# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Type-check (tsc) + production build (vite)
npx tsc --noEmit     # Type-check only (fast validation)
npx vite build       # Build only (skip type-check)
```

No test framework is configured. Run `npm run build` before committing to verify the build passes.

## Architecture

This is a Phaser 3 + TypeScript educational reading game for ages 3-6. Resolution is 960×540 with `pixelArt: true` and `roundPixels: true`.

### Manager Pattern (Singletons via Registry)

All managers are created once in `BootScene.create()` and stored in the Phaser registry:

```typescript
// BootScene creates them:
this.registry.set('audioManager', new AudioManager(this));

// Other scenes retrieve and rebind:
this.audioManager = this.registry.get('audioManager') as AudioManager;
this.audioManager.setScene(this);
```

Managers: `AudioManager`, `ProgressManager`, `FeedbackManager`, `RewardTracker`, `InputManager`.

### Scene Flow

```
BootScene → MainMenuScene → LevelSelectScene → Level Scene
                                                    ↓ (5 correct answers)
                                              GameSelectScene → Arcade Game → RewardScene → back to level
```

Three level scenes: `AlphabetJourneyScene` (Level 1), `HiddenSequenceScene` (Level 2), `SoundConstructionScene` (Level 3).

### Scene Communication

- **Init data:** `this.scene.start('SceneName', { levelConfig, returnScene })`
- **Global events:** `this.game.events.emit('event-name')` / `.on('event-name', handler)`

### Reward Flow

`RewardTracker.recordCorrect()` returns `true` after 5 correct answers, triggering transition to `GameSelectScene` for arcade game selection.

### Audio Sequencing

Use completion-based chaining for stable child UX — prompt → action → feedback → next prompt:

```typescript
audioManager.playSfxAndWait('feedback/say', () => {
  audioManager.playPhonemeAndWait(letter, () => {
    audioManager.playLetsFind();
  });
});
```

### Asset Handling

All assets preloaded in `BootScene`. Missing audio files are handled gracefully (warn + skip). Always check `this.scene.cache.audio.exists(key)` before playing.

## Phaser 3 + TypeScript Gotchas

**These will cause silent bugs or crashes:**

- **Never** use `setState`, `getState`, `moveTo` as method names on Container subclasses — they shadow Phaser built-ins. Use `setTileState`, `getTileState`, `moveToPosition`.
- **Never** use a private field named `state` on Container subclasses — conflicts with Phaser's `state` property. Use `tileState`.
- When adding custom Container subclasses to another Container, may need `as unknown as Phaser.GameObjects.GameObject` cast.
- Don't call `scene.add.existing(this)` in constructors of objects that will be added to a parent Container — the parent adds them.
- `strictPropertyInitialization: false` in tsconfig is intentional — Phaser scenes initialize properties in `create()`, not constructors.

## Key Conventions

- Path alias `@/*` maps to `src/*`
- Progress persisted in localStorage under key `reading_game_progress`
- Constants (colors, timing, tile sizes) live in `src/config/Constants.ts`
- Level grid layouts defined in `src/config/LevelConfigs.ts`
- All TypeScript interfaces in `src/types/`
- Detailed feature and system docs in `docs/`
