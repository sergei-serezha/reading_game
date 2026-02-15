# Feature: Main Menu

Source: `src/scenes/MainMenuScene.ts`

## Purpose
Landing page that introduces the game and provides entry into level selection.

## UI Elements
- Title: `Reading Adventure`
- Decorative floating letters
- `PLAY` button
- Footer text: `Created for Cyrus`
- Link: `About the Game and a Creator`

## Behavior
- `PLAY` button routes to `LevelSelectScene`.
- Keyboard shortcuts on menu:
  - `Enter` -> `LevelSelectScene`
  - `Space` -> `LevelSelectScene`
- About link opens modal overlay with content loaded from `assets/about.txt`.

## About Modal
- Title, bordered panel, close button.
- Crisp body text rendered via Phaser DOM element (not pixel canvas text).
- Close methods:
  - click `CLOSE`
  - click outside panel (overlay)

## Dependencies
- `BootScene` must preload `content/about` text key.
- DOM container support is enabled in `src/main.ts` (`dom.createContainer: true`).
