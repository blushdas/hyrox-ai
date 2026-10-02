---
handoff_id: hyrox-ai-prod-hardening-2026-10-02
project: hyrox-ai
repo: /Users/troy/.claude/worktrees/hyrox-ai-prod-hardening
branch: codex/hyrox-ai-prod-hardening
acceptance_ids: [R1, R2, R3, R4, R5, R6, R7, R8]
verification_commands: ["npm ci", "npm run db:migrate:local", "npm test", "npx tsc --noEmit", "npm run build", "NEXT_PUBLIC_AUTH_ORIGIN=https://example.com npm run build:ios", "npm audit --omit=dev --audit-level=high"]
edit_targets: [migrations/0004_auth_hardening.sql, migrations/0005_rate_limits.sql, src/auth.ts, src/proxy.ts, src/proxy.test.ts, next.config.ts, wrangler.jsonc, package.json, package-lock.json, src/lib/security/headers.ts, src/lib/api/request-guard.ts, src/lib/api/session-user.ts, src/lib/api/test-d1.ts, src/lib/db/rate-limit.ts, src/lib/db/account.ts, src/lib/db/plan.ts, src/lib/db/coach.ts, src/lib/auth/native-auth.ts, src/lib/auth/pkce.ts, src/lib/auth/native-session-client.ts, src/lib/coach-ai/rate-limit.ts, src/app/api/coach-ai/route.ts, src/app/api/me/account/route.ts, src/app/api/me, src/app/api/native-auth/exchange/route.ts, src/app/auth/native-complete/route.ts, src/app/sign-in/sign-in-buttons.tsx, "src/app/(app)/profile/page.tsx", src/components/ui/alert-dialog.tsx]
env_blockers_expected: [HUMAN_SECRET_NEEDED, MIGRATION_NOT_APPLIED, DEPLOY_DEFERRED]
handed_off_at: 2026-10-02T16:40:00+08:00
---

# Codex Implementation Handoff

## Goal

Make the FINISHER backend launch-ready. Eight changes, all server-side hardening plus one small UI control. Product behavior (training plans, Coach replies, onboarding) must not change.

## Current State

- Repo: `/Users/troy/.claude/worktrees/hyrox-ai-prod-hardening` (git worktree; this is your cwd). `.env.local` is copied in (gitignored, never print values). `node_modules` NOT installed: run `npm ci`.
- Branch: `codex/hyrox-ai-prod-hardening`, STACKED on `codex/hyrox-ai-core-schema` (PR #24, commit `7bebfa2`, not yet merged). The D1 data layer and `/api/me/*` routes you extend come from that branch.
- Stack: Next.js 16 App Router (read `node_modules/next/dist/docs/` before relying on Next conventions; this is not the Next.js you know), TypeScript, Cloudflare Workers via `@opennextjs/cloudflare`, D1 binding `DB` (database `finisher-db`), Auth.js v5 beta + `@auth/d1-adapter`, JWT sessions, Vitest (`include: src/**/*.test.ts`, node env, `@` alias to `src`).
- Migrations present: `0001_auth.sql` (accounts, sessions, users, verification_tokens; NO foreign keys; accounts has plaintext `access_token`, `refresh_token`, `id_token`, `session_state`, `oauth_token`, `oauth_token_secret`), `0002_native_auth_codes.sql` (`codeHash` PK, `userId`, `expiresAt`, `usedAt`; no FK), `0003_core_schema.sql` (5 app tables, all with `user_id` FK to users ON DELETE CASCADE).
- Recon facts (verified):
  - `src/auth.ts:35` builds `adapter: D1Adapter(env.DB)`. The adapter persists tokens only in `linkAccount` (no `updateAccount`). Its `deleteUser` does not touch app tables or `native_auth_codes`.
  - Native flow: `src/app/sign-in/sign-in-buttons.tsx` line ~54 sends the system browser to `/sign-in?callbackUrl=%2Fauth%2Fnative-complete`. After Google sign-in, `src/app/auth/native-complete/route.ts` calls `mintNativeAuthCode` and 302s to `finisher://auth?code=...`. The app's `appUrlOpen` handler exchanges the code at `/api/native-auth/exchange`. `src/proxy.ts:18` has a STRICT equality check `callbackUrl === "/auth/native-complete"`, and `src/proxy.test.ts` has an `it.each` of must-NOT-bypass values that must keep rejecting.
  - `src/lib/auth/native-session-client.ts` stores the token in Keychain via `@aparajita/capacitor-secure-storage`; there is no Preferences plugin, and the WebView may reload while Safari is open, so the PKCE verifier must also live in secure storage, not `sessionStorage`.
  - `src/lib/coach-ai/rate-limit.ts` is an in-memory per-isolate limiter (20 per 5 minutes); `RATE_LIMIT_MESSAGE` is also imported by `src/stores/coach-ai-store.ts` and must keep being exported.
  - `src/lib/api/test-d1.ts` hardcodes migrations 0001-0003 and uses `node:sqlite` with `PRAGMA foreign_keys = ON`; add new migrations there.
  - `scripts/build-ios.ts` deletes `src/app/api`, `src/app/auth`, and `src/proxy.ts` from the static-export staging copy, and requires `NEXT_PUBLIC_AUTH_ORIGIN` as an https origin. Client code (`sign-in-buttons.tsx`, `native-session-client.ts`, `profile/page.tsx`) must NOT import from `src/app/api`, `src/app/auth`, or `src/lib/db`. A pure PKCE helper in `src/lib/auth/pkce.ts` is safe for both sides.
  - `src/components/ui` has only `button.tsx`, `input.tsx`, `sonner.tsx`. `@base-ui/react` is already a dependency (AlertDialog is available). The profile page ACCOUNT section is at `src/app/(app)/profile/page.tsx` ~lines 166-193, with "Redo onboarding" and "Sign out" buttons.
  - `next.config.ts` has no `headers()`. `open-next.config.ts` is bare. Fonts use `next/font/google` (self-hosted at build, so no font origin is needed). No browser-side third-party origins are loaded by the app itself; Google/Apple are reached by redirect from the Auth.js sign-in POST.
  - `npm audit --omit=dev`: 18 vulnerabilities (9 high), root chain `undici` (7.29.0) <- `miniflare` <- `wrangler` (4.136.2), pulled in through `@opennextjs/cloudflare`. A dry-run of `npm audit fix --omit=dev` moves wrangler to 4.146.0, undici to 7.29.1, miniflare to 5.20261001.0-alpha, plus lockfile churn of optional platform binaries.
- Live parallel worktrees: `hyrox-ai-core-schema` (this branch's base), `hyrox-ai-coach-threads`, `finisher-coach-take-card`, `finisher-coach-stream-smoothness`, `hyrox-ai-thinking-details`. Stay inside the Edit Targets.

## User Intent

Wants: a security posture fit for a public launch and App Store review (account deletion, no stored provider tokens, rate limiting), with zero change to how the product feels.
Does not want: new heavy dependencies, a Cloudflare dashboard dependency, store rewiring, or UI changes beyond the delete-account control.

## Relevant Files

- `src/auth.ts`, `src/proxy.ts`, `src/proxy.test.ts`
- `src/lib/auth/native-auth.ts` (+ test), `src/lib/auth/native-session-client.ts`
- `src/app/auth/native-complete/route.ts`, `src/app/api/native-auth/exchange/route.ts`, `src/app/api/native-auth/session/route.ts` (read-only reference)
- `src/app/sign-in/sign-in-buttons.tsx` (+ `sign-in-buttons.test.ts`)
- `src/lib/api/session-user.ts`, `src/lib/api/test-d1.ts`, `src/lib/api/db-client.ts`
- `src/lib/db/plan.ts`, `src/lib/db/coach.ts`, `src/lib/db/scoping.test.ts`
- `src/app/api/me/**/route.ts`, `src/app/api/coach-ai/route.ts` (+ tests)
- `src/lib/coach-ai/rate-limit.ts` (+ test)
- `migrations/0001_auth.sql`, `0002_native_auth_codes.sql`, `0003_core_schema.sql` (do NOT edit)
- `next.config.ts`, `wrangler.jsonc`, `package.json`, `scripts/build-ios.ts` (read-only)

## Edit Targets

### R1. OAuth token minimization
- `src/auth.ts`: wrap the adapter so `linkAccount` drops `access_token`, `refresh_token`, `id_token`, `session_state`, `oauth_token`, `oauth_token_secret` before delegating to the D1 adapter (spread the base adapter, override `linkAccount`). Keep `expires_at`, `token_type`, `scope`. Export the wrapped-adapter factory from a place a test can import without a live D1 binding (for example a small exported function in `src/auth.ts`, or move to `src/lib/auth/adapter.ts` and add it to Edit Targets; either is fine, document it).
- `migrations/0004_auth_hardening.sql` (shared with R4): null the six token columns on existing `accounts` rows.
- Test: call the wrapped `linkAccount` against the in-memory D1 with all six fields populated and assert NULL in all six columns, the identity columns unchanged, and `getUserByAccount` still resolves the user (also on a second call).

### R2. Security headers
- `src/lib/security/headers.ts` (+ test): export the header list as data. Required values:
  - `Content-Security-Policy`: `default-src 'self'`; `script-src` containing only `'self'`, plus either (`'nonce-…'` and `'strict-dynamic'`) or `'unsafe-inline'`; NO `http:`/`https:` hosts, NO `*`, NO `'unsafe-eval'`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob:` (grep the app for avatar/image sources, for example Google profile photos, and add the exact origin only if used); `font-src 'self'`; `connect-src 'self'`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'` plus the Google and Apple sign-in origins ONLY if Auth.js's redirect after the same-origin sign-in POST requires them (Chrome enforces `form-action` on redirects; verify the sign-in flow, and document what you chose).
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: at least `camera=()`, `microphone=()`, `geolocation=()` (add `payment=()`, `usb=()`)
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `next.config.ts`: apply them with `headers()` on all routes, skipped when `CAPACITOR_BUILD === "1"` (static export ignores headers and warns). Prefer `next.config.ts` `headers()`; if you need per-request nonces use `src/proxy.ts`, but note nonces force dynamic rendering and `src/proxy.ts` is deleted from the iOS build.
- Do not overwrite a route's own `Content-Type`; the Coach stream response must keep its streaming content type and incremental delivery.
- Note static assets served straight from the ASSETS binding bypass Next headers. Document this limitation in the debrief and, if cheap, add `public/_headers` (an added Edit Target is allowed for that file only).

### R3. Shared rate limiting and quotas
- `migrations/0005_rate_limits.sql`: table `rate_limits(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, bucket TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (user_id, bucket, window_start))`.
- `src/lib/db/rate-limit.ts` (+ test): `hitRateLimit(userId, bucket, limit, windowMs, now = Date.now())` as a FIXED window: `window_start = floor(now / windowMs) * windowMs`; one atomic bound upsert (`INSERT ... ON CONFLICT DO UPDATE SET count = count + 1 RETURNING count`). Returns `{ allowed, retryAfterSec }` where `retryAfterSec = ceil((window_start + windowMs - now) / 1000)`, an integer from 1 to windowMs/1000. Opportunistically delete rows with `window_start` older than 1 day, bounded with `LIMIT`. No module-level `Map` or counters. `userId` is the first parameter. State must be shared: two limiter instances over the same D1 handle share the count.
- Limits (fixed, put them in named constants): `/api/me/*` mutations (POST, PUT, PATCH, DELETE): 60 per 60 s, bucket `me-write`. `/api/coach-ai` POST: 20 per 300 s, bucket `coach`. Reads are not limited.
- Over the limit: status 429, body exactly `{"error":"Too many requests"}`, header `Retry-After` set to `retryAfterSec`.
- Store failure (D1 throws during the limiter query): `/api/coach-ai` fails CLOSED with 503 `{"error":"Service unavailable"}` and does not call the model; `/api/me/*` fails OPEN (request proceeds) and logs one error-level line with the error message only, never the request, session, email or body.
- `src/lib/coach-ai/rate-limit.ts`: remove the in-memory limiter; keep exporting `RATE_LIMIT_MESSAGE` (the Coach store imports it) and update its test.
- Quotas, in `src/lib/db/plan.ts` and `src/lib/db/coach.ts` (+ tests) and the route layer: max 25 plans per user (active plus archived), 100 threads per user (archived threads count), 500 messages per thread. Exceeding returns 409 with body exactly `{"error":"Quota exceeded"}` and writes nothing: no orphan plan sessions, no thread row, no message. Make the check and the insert atomic (for example `INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < N` inside the existing `db.batch`) and detect the no-op by checking rows written. Exactly at the quota is allowed; quota + 1 is rejected.

### R4. Account deletion and auth-table foreign keys
- `migrations/0004_auth_hardening.sql`: rebuild `accounts`, `sessions`, and `native_auth_codes` so each has `FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE`. Use create-new-table, `INSERT INTO new SELECT ... FROM old`, drop old, rename, recreate indexes (including the unique `(provider, providerAccountId)` index). Preserve every row and every column value. Orphan rows (a `userId` not in `users`) must not make the migration fail: drop them explicitly with a `WHERE userId IN (SELECT id FROM users)` filter and state that in a SQL comment. Also null the six token columns on the copied `accounts` rows (R1) and add the `codeChallenge` column to `native_auth_codes` (R8). Never drop `users` or any 0003 table. Do not edit 0001-0003.
- `src/lib/db/account.ts` (+ test): `deleteAccount(userId)`: one `db.batch([...])` removing, for that user only: `verification_tokens` rows whose `identifier` equals the user's email, `native_auth_codes`, `sessions`, `accounts`, and finally `users` (the five app tables and `rate_limits` go via cascade, but delete them explicitly too so the function does not depend only on FKs). `userId` first parameter, all SQL bound.
- `src/app/api/me/account/route.ts` (+ test): `DELETE` only. Cookie-authenticated, takes the user only from the session, ignores any body. 204 with empty body on success. 401 unauthenticated. GET returns 405. Passes through the request guard (R5) and the `me-write` limiter.
- `src/lib/api/session-user.ts` (+ test): `getSessionUserId()` must also verify the `users` row still exists (a JWT outlives deletion, so a deleted user's cookie must stop working: 401 on `/api/me/*` and `/api/coach-ai`). Update `src/app/api/coach-ai/route.ts` to use it.
- UI, `src/app/(app)/profile/page.tsx` + `src/components/ui/alert-dialog.tsx` (thin wrapper over `@base-ui/react` AlertDialog, no new dependency): in the ACCOUNT section add a button labelled exactly `Delete account` (styled like Sign out, danger text). It opens a confirmation dialog whose confirm button is labelled exactly `Delete my account permanently`, with a Cancel. Confirm sends exactly one `DELETE /api/me/account`; on 204 clear the Zustand stores (athlete, plan, coach), then on web call `signOut({ callbackUrl: "/sign-in" })`. On failure show `toast.error` and keep the user signed in. Native iOS: `/api/me/*` is cookie-only until phase 2, so the static export cannot call it. Render the control only when `!Capacitor.isNativePlatform()` and leave a one-line comment naming the phase 2 Bearer dependency. Report this in the debrief as a residual App Store risk. Do not add Bearer auth in this handoff.

### R5. Request origin and content-type guard
- `src/lib/api/request-guard.ts` (+ test): `guardMutation(request)` returning a `Response` to short-circuit or null. Applies to POST, PUT, PATCH, DELETE. Rules, in order:
  - If an `Origin` header is present and is not exactly the request's own origin (compare to `new URL(request.url).origin`; scheme, host and port all match), return 403 `{"error":"Forbidden origin"}`. `Origin: null` is rejected. A missing `Origin` header is allowed.
  - If a `Content-Type` header is present and its media type (parameters such as `; charset=utf-8` ignored) is not `application/json`, return 415 `{"error":"Unsupported media type"}`. A request with no `Content-Type` and no body is allowed (bodyless DELETE).
- Apply it as the FIRST check in every `/api/me/*` mutation handler and in `/api/coach-ai` POST (before auth, before the limiter). GET handlers are not affected. Do NOT apply it to `/api/native-auth/*` or `/api/auth/*`. Update existing route tests that build requests so they send `Content-Type: application/json`.
- Make the handler's data function provably unreached on rejection (spy count 0) and no row changes.

### R6. Observability
- `wrangler.jsonc`: add `"observability": { "enabled": true, "head_sampling_rate": 1 }` (or the equivalent `logs` block supported by the installed wrangler; check `node_modules/wrangler` schema). Grep all `console.error`/`console.warn` calls reachable from server code and make sure none log a token, cookie, authorization header, request body, verifier, challenge or email. Pass error message or code only.

### R7. Dependency audit
- `package.json`, `package-lock.json`: run `npm audit fix` (NOT `--force`). `npm audit --omit=dev --audit-level=high` must exit 0. List every package whose MAJOR version changed (or state "no major bumps") in the debrief. If a high advisory remains that needs `--force`, stop and report it; do not force.

### R8. Native sign-in PKCE and purge
- `src/lib/auth/pkce.ts` (+ test): pure Web Crypto helpers: `generateVerifier()` (43-128 chars from `[A-Za-z0-9-._~]`, via `crypto.getRandomValues`), `challengeFromVerifier(verifier)` (`BASE64URL(SHA256(verifier))`, no padding), `isValidChallenge(value)` (43 chars `[A-Za-z0-9_-]`). Only the S256 method is supported.
- Client: `sign-in-buttons.tsx` `login()` generates a verifier, stores it in secure storage (add `storeNativeVerifier` / `takeNativeVerifier` next to the token helpers in `native-session-client.ts`; `take` reads and deletes), and carries the challenge to the server through the sign-in redirect (suggested: `callbackUrl=%2Fauth%2Fnative-complete%3Fcc%3D<challenge>`; `safeCallbackUrl` already allows a path with a query). The `appUrlOpen` handler reads the stored verifier and `exchangeNativeCode(origin, code, verifier)` sends it as `code_verifier` in the JSON body. A missing stored verifier means no exchange and a visible error.
- `src/proxy.ts` + `src/proxy.test.ts`: the signed-in bypass for `/sign-in` must still work for `/auth/native-complete` WITH a valid `cc` parameter, and every existing must-NOT-bypass case must still be rejected (including `/auth/native-complete?next=evil`, `#fragment`, trailing slash, `-extra`). Add cases for valid and invalid `cc`.
- `src/app/auth/native-complete/route.ts`: read `cc`; if absent or not `isValidChallenge`, issue NO code and redirect to `/sign-in?error=InvalidRequest` (no row inserted, no `finisher://` redirect). Otherwise `mintNativeAuthCode(DB, userId, now, challenge)` stores the challenge. `plain` or any other method is not accepted.
- `src/lib/auth/native-auth.ts` (+ test): `mintNativeAuthCode` stores `codeChallenge`; the TTL stays 60 s. `consumeNativeAuthCode(DB, code, verifier, now)` still burns atomically; verify `BASE64URL(SHA256(verifier))` equals the stored challenge in constant-time-ish fashion. A wrong or missing verifier returns null AND the code is burned (`usedAt` set) so a later correct verifier also fails. Used codes cannot be replayed.
- `src/app/api/native-auth/exchange/route.ts`: read `code_verifier`; missing or wrong gives the existing generic 401. Keep the CORS behavior (`capacitor://localhost` only) unchanged.
- Purge: inside `mintNativeAuthCode`, run a bounded delete of rows where `usedAt IS NOT NULL OR expiresAt <= now`, `LIMIT 100`. Name the schedule ("on each mint") in the debrief. Live (unused, unexpired) rows are never deleted.

## Decisions Already Made

- Decision: D1-backed fixed-window limiter, not the Workers rate-limit binding. Reason: works in local tests, no dashboard dependency, same store as everything else.
- Decision: limiter fails closed for Coach (cost-bearing LLM calls) and open for `/api/me/*`.
- Decision: `/api/me/*` stays cookie-only; native Bearer support is phase 2 and out of scope here.
- Decision: user identity comes only from the session; deleting an account verifies the user row still exists on every request.
- Decision: migrations are additive files `0004_*` and `0005_*`; 0001-0003 are immutable.
- Decision: pinned error bodies and labels above are exact strings.

## Assumptions

- (Validate before relying on these.) D1 enforces FKs; the test shim enables them with the pragma. D1 `batch` is transactional. `wrangler d1 migrations apply --local` honors `PRAGMA foreign_keys` inside a migration file; if table rebuilds trip FK enforcement, use `PRAGMA defer_foreign_keys = on` (D1 supports it) and document it.
- The installed wrangler accepts the `observability` block.
- `node:sqlite` under Vitest works as in phase 1.

## Hard Constraints

- Preserve unrelated user changes in the worktree.
- Do not edit `migrations/0001_auth.sql`, `0002_native_auth_codes.sql`, `0003_core_schema.sql`, anything under `src/stores/`, Coach prompts, plan generation code, or `src/app/api/native-auth/session/route.ts`.
- TypeScript only. `type` over `interface`, no `enum`, no `any` without a justifying comment, `async/await`, no `console.log`, no empty `catch`, null-check every D1 result. Every new file under 300 lines.
- Every function in `src/lib/db/*.ts` takes `userId` as its FIRST parameter; all SQL uses `.bind(...)`, no string interpolation of values. Extend `src/lib/db/scoping.test.ts` to cover the new `src/lib/db` files.
- Nothing outside `src/app/api` may import `src/lib/db`. `npm run build:ios` must still pass.
- No new dependencies unless justified in the debrief. Version bumps from `npm audit fix` are allowed.
- Do not run remote migrations or deploy. Use `--local` only.

## Implementation Guidance

- Non-binding; the acceptance criteria override. Document any conflict in the debrief.
- A shared `withGuards` helper for `/api/me/*` (guard, auth, limiter) keeps the route files short; keep it inside an existing edit target.
- For every control you add (limiter, quota, origin guard, PKCE check, FK cascade), include a test that FAILS if the control is removed or loosened. Do that exercise yourself once per control (break it, watch the test fail, revert) and record each in the debrief.
- Migration test: seed users, accounts (with tokens), sessions, native codes (live, used, expired, one orphan) and rows in every app table, apply 0004 and 0005, then compare counts and column values. Run it against `wrangler d1 execute --local` as well as the in-memory shim.

## Acceptance Criteria

- R1: After Google sign-in, no OAuth access, refresh or id token (and no `session_state`, `oauth_token`, `oauth_token_secret`) is stored; existing stored tokens are cleared by migration; sign-in and repeat sign-in still resolve the same user. — Evidence: Vitest output; `wrangler d1 execute --local` query showing all six columns NULL after migration.
- R2: Every response from the Worker carries the CSP (frame-ancestors none, no external script origins), nosniff, referrer policy, permissions policy, and HSTS; the iOS static export still builds. — Evidence: headers test output; `npm run build:ios` exit 0; `next.config.ts` file:line.
- R3: Per-user limits (60 mutations per minute on `/api/me/*`, 20 Coach messages per 5 minutes) are shared across Worker instances, return 429 with `Retry-After`; quotas (25 plans, 100 threads, 500 messages per thread) return 409 and write nothing; Coach fails closed on limiter failure. — Evidence: Vitest output including the two-instance shared-state test and the boundary tests.
- R4: A signed-in user can delete their account from the profile page; all their rows in every table (including auth tables) are gone, other users are unaffected, and the old session cookie stops working. Auth tables have cascade FKs after migration with all rows preserved. — Evidence: Vitest output; local D1 `PRAGMA foreign_key_list` output; migration row-count comparison.
- R5: Cookie-authenticated mutations from another origin (403) or with a non-JSON content type (415) are rejected before any data function runs; normal same-origin JSON writes still succeed. — Evidence: Vitest output with spy counts.
- R6: Worker logs are retained and carry no tokens, cookies, bodies, verifiers or emails. — Evidence: `wrangler.jsonc` file:line; grep output of all server log calls.
- R7: `npm audit --omit=dev --audit-level=high` exits 0 with build, tests and `build:ios` still green. — Evidence: command outputs; list of major bumps.
- R8: A native sign-in code can only be exchanged with the matching PKCE verifier; wrong, missing or replayed attempts fail with 401 and burn the code; used and expired codes are purged in bounded batches. — Evidence: Vitest output covering correct, wrong, missing, replayed, expired (59 s ok, 61 s fails) and purge cases.

## Verification

```bash
npm ci
npm run db:migrate:local
npx wrangler d1 execute finisher-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"
npm test
npx tsc --noEmit
npx eslint <every file you added or changed>
npm run build
NEXT_PUBLIC_AUTH_ORIGIN=https://example.com npm run build:ios
npm audit --omit=dev --audit-level=high
```

Expected: every command exits 0; the table listing shows `rate_limits` plus all earlier tables; `npm test` includes the new test files with no failures and no skipped tests. If a command cannot run, explain why and state the fallback. If lint fails on pre-existing generated artifacts, lint only your files and say so.

## Checkit Targets

- Pages: `/sign-in`, `/profile`, `/dashboard`, `/plan`, `/coach-ai`. API: `/api/me/profile`, `/api/me/plan`, `/api/me/plan/sessions/[id]`, `/api/me/threads`, `/api/me/threads/[id]/messages`, `/api/me/account`, `/api/coach-ai`, `/api/native-auth/exchange`, `/auth/native-complete`.
- Visual element: the Delete account button and confirmation dialog on `/profile`.
- Commands: `npm run build` exit 0; `npm test` exit 0.

## Browser QA (Codex-side)

1. Start `npm run dev` in this worktree (port 3000) or reuse a running one.
2. Unauthenticated: `curl -i` the headers on `/sign-in` and one `/api/me/*` route, a `DELETE /api/me/account` with `Origin: https://evil.example`, and a POST with `Content-Type: text/plain`. Record status, headers and body as literal output. A 500 with a logged D1-binding cause is acceptable on local dev (no D1 binding); say which you got.
3. The signed-in flow cannot be automated: sign-in is Google OAuth only and Google rejects automated browsers. Do not type credentials. Delete-account UI rows, the live Coach stream, the console CSP check and deployed-header checks are HUMAN_SECRET_NEEDED and are covered by Troy after deploy.
4. Save command outputs under `docs/qa/hyrox-ai-prod-hardening-2026-10-02/` as text and cite them as `runtime` evidence for the unauthenticated rows only.

NO_BROWSER_SESSION is only valid WITH attempt evidence (the exact command run and its literal error). An unattempted check is `unverified`, never `manual_blocked`.

## Environment Expectations

Standard labels: HUMAN_SECRET_NEEDED, DB_NOT_LINKED, MIGRATION_NOT_APPLIED, DEPLOY_DEFERRED, NO_BROWSER_SESSION, GIT_AUTH_BLOCKED, TOOLING_ABSENT

- HUMAN_SECRET_NEEDED: signed-in delete-account flow, live Coach stream with the new headers, console CSP violations check, and verifying persisted Worker logs in the Cloudflare dashboard need a manual Google sign-in and a deploy. Troy resolves after deploy.
- MIGRATION_NOT_APPLIED: `0004` and `0005` are applied to local D1 only. Remote `npm run db:migrate` is Troy's step.
- DEPLOY_DEFERRED: no deploy from this branch.

Rule: a coverage row blocked by an env class is ⚠️ Partial with that label as Evidence-Type `manual_blocked`, never ✅ Done. Behavior-level criteria are never ✅ Done on static evidence alone.

Rule: NO_BROWSER_SESSION must be EARNED, never pre-declared.

## GitNexus Gates

- Before editing an existing symbol: `gitnexus impact <symbol>` (CLI). Halt on HIGH/CRITICAL and report in the debrief.
- CLI absent or repo not indexed: log TOOLING_ABSENT in Known Gaps and continue. Not a hard blocker.
- Do NOT run detect-changes (Claude runs it during /checkit).

## Known Risks And Blockers

- Native iOS account deletion cannot reach `/api/me/account` until phase 2 adds Bearer auth; the control is web-only for now (App Store risk, report it).
- The base branch (PR #24) is not merged. If it merges while you work, do not rebase unless told; the PR retargets later.
- Migration 0004 rebuilds three auth tables; rehearse it on a seeded local D1 before reporting it done.
- A strict CSP can break Auth.js redirects or Next inline bootstrap scripts; the local dev server cannot fully prove production behavior, so state exactly what was and was not exercised.
- Live worktrees touching nearby files: `hyrox-ai-core-schema` (same base, PR #24). No file overlap with `hyrox-ai-coach-threads`, `finisher-coach-take-card`, `finisher-coach-stream-smoothness` or `hyrox-ai-thinking-details` was found at handoff time.

## Required Debrief

Before ending, write `docs/codex-debrief-<YYYY-MM-DD-HHMMSS>.md` containing exactly:

- `# Codex Implementation Debrief`
- `## Source Handoff` — lines `- Handoff:`, `- Goal:`, `- Branch:`, `- Date:`, `- Supersedes:` (prior debrief path for this handoff, or `none`)
- `## Original Goal` · `## What Was Implemented` · `## Files Changed` — `What Was Implemented` is written in plain English for a reader who never saw the handoff: what the change does in product terms and how the pieces fit, not a commit-log paraphrase. No bare R-IDs or internal shorthand without one clause saying what they mean.
- `## Goal Coverage` — one row per handoff R-ID, columns `# | Acceptance Criterion | Status | Evidence-Type | Evidence`. Status ∈ ✅ Done / ⚠️ Partial / ❌ Not done. Evidence-Type ∈ runtime|build|test|curl|static|manual_blocked|unverified. HARD RULE: ✅ Done with Evidence-Type `static` or `unverified` is invalid; downgrade to ⚠️ Partial. A build passing proves compilation, not behavior. Behavior-level rows cite `runtime` evidence from the Browser QA section; `manual_blocked` on a browser-verifiable row requires the attempted command plus literal error output.
- `## Verification` — each command with actual output + PASS/FAIL/SKIPPED verdict. "Tests passed" without the command and output is not evidence.
- `## Known Gaps / Risks` — env labels first, each tagged `expected (manifest)` or `new`; every blocked row states the minimum missing capability/state, the exact verification action once unblocked, and the expected observable result. Adjacent product risks on separate `Residual product risk:` lines.
- `## Deliberately Left` — everything knowingly left broken, duplicated, dead, failing, or deferred (in or out of scope), each marked pre-existing vs introduced. `None` allowed but must be stated.
- `## Falsification Test` — the acceptance criterion with the weakest evidence + the smallest adversarial test most likely to disprove it: setup, action, expected result, likely failure mode.
- `## Claude Pickup Notes` — exactly 3 items, priority-ordered: inspect what, look for what discrepancy, what finding fails acceptance.
- `## Suggested /checkit Inputs` (`- [ ]` items)

Also record in the debrief, under `## Verification`: the break-and-revert exercise for each control (limiter, quota, origin guard, PKCE check, FK cascade) with the failing test names; the `observability` block as written; the list of major version bumps from `npm audit fix` (or "no major bumps"); what happened to the orphan row in the migration rehearsal; the purge schedule.
