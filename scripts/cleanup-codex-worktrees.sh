#!/usr/bin/env bash
# Remove all Codex worktrees for this repo so only main shows in Source Control.
# Run from repo root: ./scripts/cleanup-codex-worktrees.sh

set -e
cd "$(git rev-parse --show-toplevel)"

echo "Current worktrees:"
git worktree list

CODEX_WT_ROOT="${HOME}/.codex/worktrees"
if [[ ! -d "$CODEX_WT_ROOT" ]]; then
  echo "No Codex worktrees directory found. Nothing to clean."
  exit 0
fi

count=0
for wt in "$CODEX_WT_ROOT"/*/FoodForNow; do
  if [[ -d "$wt" ]]; then
    echo "Removing: $wt"
    git worktree remove "$wt" --force 2>/dev/null || true
    ((count++)) || true
  fi
done

echo "Removed $count Codex worktree(s)."
echo "Remaining worktrees:"
git worktree list
