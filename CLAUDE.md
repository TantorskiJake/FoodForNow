# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FoodForNow is a meal planning and pantry management app. It is an npm workspaces monorepo with:
- `foodfornow-backend/` — Node.js/Express API (port 3001), MongoDB via Mongoose, JWT auth
- `foodfornow-frontend/` — React 19 + Vite + Material-UI (port 5173)
- `e2e/` — Playwright end-to-end tests

## Commands

### Development
```bash
npm run dev          # Start backend (3001) + frontend (5173) concurrently
npm run dev:host     # Same but frontend accessible on LAN
```

### Testing
```bash
npm test                                    # All unit tests (backend + frontend)
npm run test -w foodfornow-backend          # Backend tests only
npm run test -w foodfornow-frontend         # Frontend tests only
npm run e2e:smoke                           # E2E smoke tests (requires dev servers running)
npm run e2e                                 # Full E2E suite
```

To run a single test file, use the Node built-in test runner directly:
```bash
node --test foodfornow-backend/src/routes/auth.test.js
node --test foodfornow-frontend/src/utils/dashboardWeekUtils.test.js
```

### Linting
```bash
npm run lint -w foodfornow-frontend         # ESLint (frontend only has lint script)
```

### Build
```bash
npm run build        # Build frontend for production
```

## Architecture

### Request Flow
Browser → Vite proxy (`/api` → `localhost:3001`) → Express routes → Mongoose → MongoDB

### Backend (`foodfornow-backend/`)
- `server.js` — Entry point; sets up Helmet, CORS, CSRF (double-submit cookie), cookie-parser, then mounts route modules
- `src/routes/` — One file per resource: `auth.js`, `recipes.js`, `mealplan.js`, `pantry.js`, `ingredients.js`, `shopping.js`, `achievements.js`, etc.
- `src/models/` — Mongoose schemas
- `src/middleware/` — JWT auth middleware (`auth.js`)
- `src/services/` — Business logic (recipe parsing, ingredient resolution)
- `src/utils/` — CSRF config, HTTP error helpers, URL safety

**CSRF**: All mutating requests require a CSRF token. The frontend fetches it via `GET /api/csrf-token` and attaches it as `x-csrf-token` header. The backend uses the `csrf-csrf` library with a double-submit cookie pattern.

### Frontend (`foodfornow-frontend/src/`)
- `pages/` — Route-level components (Dashboard, Recipes, MealPlan, Pantry, ShoppingList, Ingredients, Profile, Achievements)
- `components/` — Shared UI components
- `context/` — React context providers (auth state, etc.)
- `hooks/` — Custom hooks
- `services/api.js` — Axios instance; automatically fetches and attaches CSRF token, handles 403 CSRF retry
- `utils/` — Pure utility functions (password policy, date helpers, array safety, etc.)

### Authentication
- JWT stored in httpOnly cookies
- Frontend context tracks auth state
- All protected routes check JWT via `src/middleware/auth.js`

### Testing Setup
- **Unit tests**: Node.js built-in test runner (`node:test`) — no Jest. Test files are `*.test.js`.
- **Backend integration tests**: Use `mongodb-memory-server` and `supertest`; no real DB needed.
- **E2E**: Playwright with Chromium only, single worker, sequential. Config in `playwright.config.js`.

## Git Workflow

Work directly on the current branch (`main` or `develop`). Do **not** create git worktrees or agent branches (`cursor/*`, etc.) unless the user explicitly asks. Normal workflow: develop on `develop`, PR into `main` to release.

## Environment Variables

Backend requires a `.env` file in `foodfornow-backend/`:
```
MONGO_URI=mongodb://...
JWT_SECRET=...
CSRF_SECRET=...
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Frontend optionally uses `foodfornow-frontend/.env`:
```
VITE_API_URL=http://localhost:3001/api
```
