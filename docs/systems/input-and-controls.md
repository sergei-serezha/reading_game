# System: Input and Controls

## Input Manager
Source: `src/managers/InputManager.ts`

### Supported Inputs
- Arrow keys
- WASD keys
- Swipe gestures (mobile)

### Behavior
- Directional input is buffered and cooldown-limited (`INPUT_COOLDOWN_MS`).
- `consumeDirection()` returns one direction at a time (`UP/DOWN/LEFT/RIGHT/NONE`).

## Scene-Specific Controls
- Main menu:
  - `Enter` and `Space` start level select.
- Level 1:
  - directional movement + tap movement
  - `Space` confirms slash on correct landed letter.
- Level 2:
  - directional movement + tap movement.
- Level 3 (POC v2):
  - `UP/DOWN` switches lines
  - `Space` dispatches monkey on active line.
- Pac-Man (`PacManGameScene`):
  - `UP/DOWN/LEFT/RIGHT` or `W/A/S/D` moves monkey one tile.
  - On-screen slider controls ghost movement speed.
  - Slider semantics: left = faster ghosts, right = slower ghosts.
- Frogger (`FroggerGameScene`):
  - `UP/DOWN/LEFT/RIGHT` or `W/A/S/D` moves frog one tile.
  - On-screen slider controls car speed.
  - Slider semantics: left = slower cars, right = faster cars.
- Livi Kong (`LiviKongGameScene`):
  - `LEFT/RIGHT` or `A/D` moves Mario.
  - `UP` or `W` jumps over barrels and jumps out of potholes.
  - Mario auto-hides when positioned on a pothole.
  - On-screen slider controls barrel speed.
  - Slider semantics: left = slower barrels, right = faster barrels.
