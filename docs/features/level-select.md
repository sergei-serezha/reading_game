# Feature: Level Select

Source: `src/scenes/LevelSelectScene.ts`

## Purpose
Allows players to choose unlocked levels.

## Behavior
- Shows level cards for:
  - Level 1: Alphabet Journey
  - Level 2: Hidden Sequence
  - Level 3: Sound Construction
- Locked levels show lock icon and are not interactive.
- Unlocked levels respond to hover/tap and start scene via `sceneKey` from `LevelConfig`.
- Includes a "POC Direct Arcade Links" section for direct testing without progression.
  - `tron` -> `TronGameScene`
  - `pac-man` -> `PacManGameScene`
  - `frogger` -> `FroggerGameScene`
  - unknown keys -> `ArcadeGameScene`
- Back button returns to `MainMenuScene`.

## Unlock Logic
Reads unlock status from `ProgressManager.isLevelUnlocked(levelId)`.
