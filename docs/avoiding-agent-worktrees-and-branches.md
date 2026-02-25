# Avoiding extra worktrees and branches from Cursor & Codex

This project is set up so you don’t get extra “straight line” refs (worktrees) or `cursor/*` branches cluttering your repo. Here’s what creates them and how to avoid it.

## What was creating them

1. **Codex (desktop app)** – When you open FoodForNow from Codex’s project picker (linked repo), it creates a **new git worktree** each time (e.g. under `~/.codex/worktrees/...`). Those show up in Cursor’s source control as a separate “branch” (straight line) at a commit like `26b35080`.
2. **Codex automations** – Scheduled automations (CI sweep, PR review, etc.) that run against this repo also use worktrees, so they add more of the same.
3. **Cursor Agent** – Using Cursor’s Agent in “worktree” or “new branch” mode can create `cursor/...` branches and/or worktrees.

## How to avoid it

### In Cursor (this IDE)

- A **project rule** is in place: the AI is instructed to work in your current branch and **not** create worktrees or agent branches for this repo.
- When starting a task, if Cursor offers “Create worktree” or “New branch”, choose **“Work in current branch”** or **“Main”** if you want everything in one place.
- Prefer **Chat / Ask** for small questions so the agent doesn’t spin up a separate branch/worktree.

### In Codex

- **Option A – Open folder directly (recommended)**  
  Use **“Choose a different folder”** and open `FoodForNow` from the file system. Codex will work in that folder and won’t create a new worktree. You may lose some “linked repo” features (e.g. GitHub integration in the project picker).
- **Option B – Keep using the project picker**  
  Codex has no supported setting to disable worktrees for the IDE; each session can create a new worktree. You can **prune them periodically** from this repo (see below).

### Codex automations

- If you have automations (e.g. in `~/.codex/automations/`) that run against FoodForNow, they will create worktrees when they run.
- To stop that for this repo: disable or remove those automations for FoodForNow, or run them only when you’re okay with extra worktrees and cleaning them up.

## Cleaning up worktrees (run from FoodForNow repo)

If extra worktrees appear again (e.g. from Codex):

```bash
cd /Users/jaketantorski/Documents/GitHub/FoodForNow
git worktree list   # see all worktrees
# Remove each Codex worktree (do NOT remove the first line – that’s your main repo)
git worktree remove /Users/jaketantorski/.codex/worktrees/XXXX/FoodForNow --force
# Or remove all Codex worktrees for this repo in one go:
for wt in /Users/jaketantorski/.codex/worktrees/*/FoodForNow; do [ -d "$wt" ] && git worktree remove "$wt" --force; done
```

Then refresh Source Control in Cursor; the extra “straight line” refs should disappear.

## Deleting a remote `cursor/*` branch

If a branch like `cursor/development-environment-setup-a4c1` was pushed to GitHub:

```bash
git push origin --delete cursor/development-environment-setup-a4c1
```

Replace the branch name with the one you want to remove.
