# FINISHER (hyrox-ai)

A Next.js App Router app for Hyrox training plans, deployed as a Cloudflare Worker (OpenNext) with a Capacitor iOS shell.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Secrets live in `.env.local` (never committed).

Checks before opening a PR:

```bash
npm run build
npm test
```

## Deploy

Nothing deploys automatically. After a PR merges, deploy the `finisher` Worker by hand from an up-to-date `main`:

```bash
git pull
npm run deploy
```

`npm run deploy` runs `opennextjs-cloudflare build` and then `wrangler deploy`. Then smoke test production: switch between tabs, hard-reload `/dashboard`, and run the plan loader.

Coach AI requires `wrangler secret put MINIMAX_API_KEY` before deployment.
Optional Worker bindings: `MINIMAX_MODEL` (default `MiniMax-M3`) and
`MINIMAX_BASE_URL` (default `https://api.minimax.io/v1`). Local development uses
`.env.local`. Keys stay server-side. Coach AI currently supports same-origin web only.
The route sends newline-delimited JSON answer chunks (`text`), then `done`; failures
after streaming starts send a generic `error` frame. Stop cancels the upstream request.
The limiter is best-effort per Worker isolate (20 messages per rolling five minutes).

Extra steps only when the change needs them:

- **Database migration:** if the PR added files under `migrations/`, run `npm run db:migrate` (applies to the remote D1 database `finisher-db`). Use `npm run db:migrate:local` for local.
- **iOS app:** if the change affects the native bundle, run `npm run build:ios`, then build and archive in Xcode.

## Scripts

- `npm run dev`: local dev server.
- `npm run build`: Next.js production build.
- `npm test`: Vitest unit tests.
- `npm run test:e2e`: Playwright end-to-end tests.
- `npm run deploy`: build and deploy the Worker.
- `npm run db:migrate`: apply D1 migrations to the remote database.
- `npm run build:ios`: stage the web build for the iOS shell.
