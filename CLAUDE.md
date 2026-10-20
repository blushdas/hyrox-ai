# FINISHER (hyrox-ai)

Hyrox training-plan app. Next.js App Router web app deployed as a Cloudflare Worker (OpenNext) with a Capacitor iOS shell. Brand name in UI is FINISHER.

## Stack
- Next.js 16, React 19, TypeScript, Tailwind v4, base-ui + local `src/components/ui`, Zustand (`persist`), framer-motion, Vitest, Playwright.
- Auth: Auth.js v5 (Google, Apple), D1 adapter, JWT sessions. Data: Cloudflare D1 (`DB` binding, database `finisher-db`) accessed with raw SQL.
- Coach AI: MiniMax chat completions streamed as newline-delimited JSON; optional Cohere planner + Tavily web search.

## Layout
- `src/app/(app)/`: signed-in screens (dashboard, plan, session/[id], profile, coach-ai) inside `AppShell` + `PlanGuard`.
- `src/app/api/`: `auth`, `native-auth`, `coach-ai`, and `me/*` (profile, plan, sessions, threads, account). `src/app/auth/native-complete` finishes native sign-in.
- `src/proxy.ts`: Next proxy (middleware). Redirects unauthenticated users on protected paths to `/sign-in`. Matcher must stay literal; `src/lib/auth/protected-routes.ts` mirrors it and is tested.
- `src/lib/`: `db/` (D1 queries), `api/` (guards, validation, quota, `db-client`), `auth/`, `coach-ai/`, `security/headers.ts`, `train/`, plan data in `hyrox-plan-data.ts`.
- `src/stores/`: Zustand stores (`athlete-store`, `plan-store`, `coach-ai-store`). `migrations/`: D1 SQL, applied in order. `scripts/build-ios.ts`: iOS static export. `expo-shell/`: separate Expo app with its own `package.json`. `e2e/`: Playwright.

## Data flow
- Profile and plan currently live client-side: onboarding generates a plan from templates (`use-plan-generator.ts`, `lib/mock-data.ts`) into Zustand stores persisted to localStorage (`skipHydration`, rehydrated by `StoreHydrator`; `PlanGuard` redirects when no plan). The `/api/me/profile`, `/plan`, `/plan/sessions/[id]` routes and `lib/db` exist and are tested, but the UI on main only calls `/api/me/threads` and `/api/me/account` (a profile/plan sync is in progress on a separate branch). Verify before assuming sync.
- Every `/api/me/*` mutation goes through `guardedMutation` (`src/app/api/me/guards.ts`): origin and JSON content-type check, auth, per-user rate limit, quota. Every query is scoped by `user_id`.
- Coach AI: `POST /api/coach-ai` checks session, rate limit (`rate_limits` table), builds prompt (`lib/coach-ai/prompt.ts`), streams `{text}` frames then `done`.
- Cloudflare bindings and secrets are read via `getCloudflareContext()` with `process.env` fallback for local dev.

## Conventions and gotchas
- Tests are colocated `*.test.ts` (Vitest, node env, `src/**/*.test.ts`). DB tests use an in-memory `node:sqlite` adapter (`src/lib/api/test-d1.ts`) that applies every file in `migrations/`; a new migration must be added to its list.
- `CAPACITOR_BUILD=1` switches `next.config.ts` to static export; `build:ios` copies `src` minus `api`, `auth`, and proxy into a temp project.
- Nothing deploys automatically; see README for the manual deploy and migration steps.
- `npm run lint` currently has pre-existing errors (see verify skill); do not treat them as regressions.
- Run the `verify` skill (`.claude/skills/verify/SKILL.md`) before declaring a change done.
