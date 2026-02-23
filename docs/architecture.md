# Architecture

## Stack
- Phaser 3 for rendering, scenes, input, tweens, and audio.
- TypeScript for all game logic.
- Vite for development server and production build.

## Runtime Flow
1. `BootScene` preloads assets and creates shared managers.
2. `MainMenuScene` is the initial interactive screen.
3. `LevelSelectScene` routes into level scenes.
4. Level scenes can route to:
   - `GameSelectScene` (arcade reward)
   - `RewardScene` (celebration / transitions)
5. Arcade scenes return through `RewardScene` back to the level flow.

## Core Modules
- `src/scenes/`: top-level game states and feature flows.
- `src/objects/`: reusable visual/gameplay entities (`PlayerCharacter`, `LetterTile`, `LetterGrid`, `MonkeyHelper`, `ProgressBar`).
- `src/managers/`: cross-scene services (`AudioManager`, `InputManager`, `FeedbackManager`, `ProgressManager`, `RewardTracker`).
- `src/config/`: level data and constants.
- `src/types/`: shared interfaces for levels and progress state.

## Scene Registry
Registered in `src/main.ts`:
- `BootScene`
- `MainMenuScene`
- `LevelSelectScene`
- `AlphabetJourneyScene` (Level 1)
- `HiddenSequenceScene` (Level 2)
- `SoundConstructionScene` (Level 3)
- `GameSelectScene`
- `ArcadeGameScene`
- `TronGameScene`
- `PacManGameScene`
- `FroggerGameScene`
- `LiviKongGameScene`
- `RewardScene`

## Shared Manager Lifecycle
Managers are instantiated once in `BootScene` and stored in `registry`:
- `audioManager`
- `progressManager`
- `rewardTracker`
- `feedbackManager`

Scenes pull managers from registry and call `setScene(...)` when needed for scene-bound APIs.
