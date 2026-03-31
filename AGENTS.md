# Agent instructions for FoodForNow

Instructions for AI agents and automations (e.g. Codex, Cursor) working in this repo.

## Git: work on the current branch (main or develop)

- **Branch**: Work on whichever branch the user has checked out—usually `main` or `develop`. Do not create or use `cursor/*` or other agent branches unless the user explicitly asks.
- **Worktrees**: Do not create git worktrees. Make all changes in the repository's main working tree so the user sees a single branch in source control.
- **Commits**: When making changes, commit (or stage for commit) on the current branch in the primary repo path, not in a separate worktree.

Normal workflow: the user works on `develop`, then opens a PR to merge into `main` when ready to release.

## Browser / UI checks (MCP)

Project MCP config lives in [`.cursor/mcp.json`](.cursor/mcp.json): **Playwright MCP** (`@playwright/mcp`) so agents can open the app, snapshot the accessibility tree, and exercise flows for UI bugs. After changing MCP config, restart Cursor (or reload MCP). Start the dev servers locally first; Playwright will download browsers on first use (`npx` may fetch the package and Playwright’s browser binaries).

### Exploratory UI pass (Playwright MCP)

When the user asks to explore the UI for bugs, with **backend + frontend dev servers running** (`npm run dev` from repo root):

1. Open `http://localhost:5173` (or `PLAYWRIGHT_BASE_URL` if set). Playwright’s browser does **not** share the user’s normal browser cookies—register a throwaway account or use documented test credentials if provided.
2. Walk primary routes: Dashboard (open **How it works** then dismiss), Recipes (open a recipe detail link if any), Shopping List, Pantry, Ingredients, Profile, Achievements, How to use.
3. Try one **safe** interaction per area where it makes sense (e.g. open a dialog, then cancel or **Got it**—avoid deleting real user data unless the user asks).
4. Check **console** at error severity (`browser_console_messages` / equivalent) and note any **401/500** or broken network calls from snapshots.
5. Summarize findings: regressions, confusing UX, a11y gaps, and console or network errors.

**Automated breadth check (no MCP):** from repo root with dev servers up, run `npm run e2e:smoke` (or `npm run e2e` to include [`e2e/full-flow.spec.js`](e2e/full-flow.spec.js)). **CI:** pushes and PRs to `main` / `develop` run `npm test` (backend + frontend unit tests) and `npm run e2e:smoke` with a MongoDB service (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## On-demand automations

Prompt-based automations (migrated from Codex) live in [`.cursor/automations/`](.cursor/automations/). Each file has a **Prompt** section; run one by asking the user to invoke it (e.g. “Run the API contract drift check”) or by following the prompt when the user requests that task. See [.cursor/automations/README.md](.cursor/automations/README.md) for the list.
