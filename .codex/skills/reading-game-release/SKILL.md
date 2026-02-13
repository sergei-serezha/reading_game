# Skill: reading-game-release

## Use This Skill When
- User asks to prepare commit-ready changes.
- User requests a regression or consistency pass.
- User asks for “final checks” before sharing/building.

## Workflow
1. Inspect changed files with `git status --short`.
2. Sanity-check scene flow impacts for touched gameplay files.
3. Run `npm run build`.
4. Confirm newly used assets are preloaded and referenced by correct audio keys.
5. Summarize remaining risks (if any).

## Commit Prep Notes
- Stage only requested/related files.
- Avoid mixing unrelated local changes unless explicitly requested.
- Use clear commit messages focused on behavior outcome.
