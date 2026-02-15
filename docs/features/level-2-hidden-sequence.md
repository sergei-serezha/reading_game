# Feature: Level 2 - Hidden Sequence

Source: `src/scenes/HiddenSequenceScene.ts`

## Core Loop
- Same movement model as Level 1 with hidden target tiles.
- Player must infer hidden-letter positions while following sequence order.
- Correct hidden tiles reveal and continue progression.

## Prompting
- Uses `Say <letter>` and `Let's find <letter>` sequencing logic.
- Includes speaker replay affordance.

## Inputs
- Arrow/WASD/swipe and tap navigation on valid adjacent tiles.

## Rewards and Completion
- Tracks progress and can route to arcade reward selection.
- On full completion, transitions through reward flow.
