# Agent instructions for FoodForNow

Instructions for AI agents and automations (e.g. Codex, Cursor) working in this repo.

## Git: work on the current branch (main or develop)

- **Branch**: Work on whichever branch the user has checked out—usually `main` or `develop`. Do not create or use `cursor/*` or other agent branches unless the user explicitly asks.
- **Worktrees**: Do not create git worktrees. Make all changes in the repository's main working tree so the user sees a single branch in source control.
- **Commits**: When making changes, commit (or stage for commit) on the current branch in the primary repo path, not in a separate worktree.

Normal workflow: the user works on `develop`, then opens a PR to merge into `main` when ready to release.
