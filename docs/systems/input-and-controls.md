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
