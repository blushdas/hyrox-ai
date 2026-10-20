---
name: verify
description: How to typecheck, lint, test, build, and run hyrox-ai (FINISHER) to confirm a change works.
---

# Verify a change in hyrox-ai

Use npm (not yarn/bun). If `npm` is aliased in your shell, call `/opt/homebrew/bin/npm`. Results below were run on `main` (Node 25, Next.js 16, Vitest 3).

## Commands (repo root)
1. Install: `npm ci`
2. Typecheck: `npx tsc --noEmit` (passes)
3. Lint: `npm run lint` (FAILS on main, pre-existing: 4 errors, 3 warnings in `expo-shell/App.tsx`, `scripts/ios-app-entry.tsx`, `src/app/page.tsx`, `src/components/coach-ai/thinking.test.ts`, plus unused `_raceDate` in `src/lib/mock-data.ts`). Lint only files you changed: `npx eslint <paths>`; make sure you add no new problems.
4. Unit tests: `npm test` (passes: 53 files, 447 tests, about 10 s; one test intentionally waits 8 s for a timeout)
5. Build: `npm run build` (passes, runs Next's own TypeScript check; prints the route table plus `Proxy (Middleware)`)
6. Dev server: `npm run dev`, then open http://localhost:3000 (`npm run dev:lan` binds 0.0.0.0 for devices)
7. E2E: `npm run test:e2e` (Playwright, chromium, starts `npm run dev` itself and reuses a server on 3000). In this environment all 9 tests failed at browser launch because Playwright browsers were not installed; run `npx playwright install chromium` first. Results after that were not verified, and the specs may lag the app (they assume `/` redirects to `/sign-in?callbackUrl=%2Fdashboard` and onboarding is reachable without sign-in, but `/onboarding` is a protected route).
8. Deploy/migrate (manual, only if asked): `npm run deploy`, `npm run db:migrate:local`, `npm run db:migrate` (remote). Do not run remote commands during verification.

Minimum bar for any change: steps 2, 4, 5 green and no new lint problems.

## Quick smoke test (dev server running)
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000/sign-in` returns 200.
- `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" localhost:3000/dashboard` returns 307 to `/sign-in?callbackUrl=%2Fdashboard` when signed out.

## Browser checks for UI changes
- Signed-out: `/` leads to `/sign-in` with Google and Apple buttons. Check at 1280px and 390px widths.
- Signed-in screens need working OAuth credentials and the local D1 database (`npm run db:migrate:local`); this flow was not exercised here. Routes to look at: `/onboarding` (5 steps, plan loader), `/dashboard`, `/plan`, `/session/<id>`, `/profile`, `/coach-ai` (streaming reply, history drawer, stop button).
- Watch the browser console for errors and hard-reload `/dashboard` (README lists this as a production smoke test).

## Environment variables (names only; put values in `.env.local`, never commit)
- Auth: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_APPLE_ID`, and either `AUTH_APPLE_SECRET` or `APPLE_TEAM_ID` + `APPLE_KEY_ID` + `APPLE_PRIVATE_KEY`.
- Coach AI: `MINIMAX_API_KEY` (required), `MINIMAX_MODEL`, `MINIMAX_BASE_URL`, `COHERE_API_KEY`, `TAVILY_API_KEY` (web search).
- iOS build only: `NEXT_PUBLIC_AUTH_ORIGIN` (hosted https origin) for `npm run build:ios`.
- Unit tests and `npm run build` need none of these.

## Known gotchas
- Bindings (`DB`, secrets) come from Cloudflare via `getCloudflareContext()`; dev uses `initOpenNextCloudflareForDev` (local wrangler state in `.wrangler/`).
- DB tests use `node:sqlite`, so Node must support it (Node 22.5+).
- `expo-shell/` is a separate package with its own `package.json`; root commands do not cover it.
- `CAPACITOR_BUILD=1` changes the build to static export; do not set it for normal verification.
