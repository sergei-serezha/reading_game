# System: Progress and Unlocks

## Progress Manager
Source: `src/managers/ProgressManager.ts`

Tracks:
- level unlock/completion
- letter mastery
- cumulative stars
- correct-count counter

Storage:
- browser `localStorage`
- key: `reading_game_progress`
- includes versioned migration support (`version` field in saved payload)

## Level Unlock Policy
- Current defaults unlock Levels 1, 2, and 3.
- Completing a level still unlocks the next level as normal progression behavior.
- One-time migration upgrades existing saves to unlock Levels 2 and 3 (`ProgressManager` migration to version `2`).

## Reward Tracker
Source: `src/managers/RewardTracker.ts`

- Default tracker threshold (global constant driven): correct answers to trigger arcade reward.
- Used directly in Level 1 and Level 2 loops.

## Level 3 Exception
- Level 3 POC v2 uses scene-specific threshold (3 completed words) for arcade routing.
- This is intentionally local to `SoundConstructionScene`.
