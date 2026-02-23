# Feature: Rewards and Arcade

## Components
- Reward tracking: `src/managers/RewardTracker.ts`
- Arcade selection scene: `src/scenes/GameSelectScene.ts`
- Arcade fallback/placeholder: `src/scenes/ArcadeGameScene.ts`
- Tron implementation: `src/scenes/TronGameScene.ts`
- Pac-Man implementation: `src/scenes/PacManGameScene.ts`
- Frogger implementation: `src/scenes/FroggerGameScene.ts`
- Livi Kong implementation: `src/scenes/LiviKongGameScene.ts`
- Reward transition scene: `src/scenes/RewardScene.ts`

## Current Behavior
- Level 1/2 use correct-answer reward tracking.
- Level 3 (POC v2) uses scene-specific word completion threshold (3 words).

## Unlock Audio
- Key: `feedback/arcade-unlock`
- Current asset: `assets/hooray_5_challenges_v2.wav`

## Flow
1. Unlock threshold reached.
2. Unlock audio plays.
3. Route to `GameSelectScene`.
4. Selected arcade tile routes by game key:
   - `tron` -> `TronGameScene`
   - `pac-man` -> `PacManGameScene`
   - `frogger` -> `FroggerGameScene`
   - `livi-kong` -> `LiviKongGameScene`
   - other keys -> `ArcadeGameScene`
5. `ArcadeGameScene` also contains a defensive redirect for known keys (`tron`, `pac-man`, `frogger`, `livi-kong`) to avoid stale "Coming Soon" paths.
6. Selected arcade scene eventually routes through `RewardScene`.
7. Return to originating scene with optional resume data.
