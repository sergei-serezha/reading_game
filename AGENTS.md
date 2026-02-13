# AGENTS.md

## Purpose
This repository contains the **Reading Game** (Phaser + TypeScript). Agents should prioritize small, testable changes and keep gameplay behavior stable for pre-reader users.

## Project Baseline
- Runtime: Node.js + Vite + TypeScript
- Game engine: Phaser
- Main source: `src/`
- Audio assets: `assets/`
- Build output: `dist/`

## Development Rules
- Prefer minimal, targeted diffs.
- Preserve child-friendly flow: clear prompt -> action -> feedback -> next prompt.
- Avoid introducing new dependencies unless explicitly requested.
- Keep controls consistent across scenes (`keyboard` and `tap`).
- For audio sequencing, avoid fixed assumptions about clip length when chaining critical prompts.

## Validation Checklist
After changes:
1. Run `npm run build`.
2. Verify any updated scene flow in code paths for `AlphabetJourneyScene`, `HiddenSequenceScene`, and `SoundConstructionScene` when relevant.
3. Confirm new assets are preloaded in `BootScene` if used at runtime.

## Skills
Skills live under `.codex/skills/**/SKILL.md`.

### Available skills
- `reading-game-gameplay`: Implement gameplay/scene state changes safely, including player movement, tile interactions, and progression gates. (file: `.codex/skills/reading-game-gameplay/SKILL.md`)
- `reading-game-audio-prompts`: Implement and troubleshoot prompt sequencing, VO assets, and completion-based audio chaining. (file: `.codex/skills/reading-game-audio-prompts/SKILL.md`)
- `reading-game-release`: Final verification workflow for build integrity, asset wiring, and commit readiness. (file: `.codex/skills/reading-game-release/SKILL.md`)

## Skill Trigger Guidance
Use a skill when the request clearly matches it:
- Scene logic, controls, interactions -> `reading-game-gameplay`
- Prompt timing, VO replacement, preload/audio manager changes -> `reading-game-audio-prompts`
- “Ready to ship”, “commit”, “final check”, “regression pass” -> `reading-game-release`

If multiple match, use the smallest set that covers the request.
