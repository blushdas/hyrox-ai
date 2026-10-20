# lib/db

Raw-SQL data layer over Cloudflare D1. Each file owns one area: `plan.ts`, `profile.ts`, `coach.ts` (threads, messages), `account.ts` (delete account), `rate-limit.ts`.

## Conventions
- Get the database with `getDb()` from `@/lib/api/db-client` (throws if the `DB` binding is missing). Use `prepare(...).bind(...)`; never string-interpolate values.
- Every function takes `userId` first and every query filters by `user_id`. `scoping.test.ts` checks cross-user isolation; keep it passing.
- Multi-statement writes use `db.batch([...])` and `requireInserted` / `MAX_PLANS` style quotas from `@/lib/api/quota` (inserts are guarded with `WHERE (SELECT COUNT(*) ...) < ?`).
- Plan sessions store `warmup`, `main_set`, `cooldown` as JSON strings; `getActivePlan` parses them back into `TrainingPlan`.

## Tests and schema
- Tests use `createTestDb()` (`src/lib/api/test-d1.ts`), an in-memory `node:sqlite` DB that runs the files in `migrations/` from the repo root. Requires a Node version with `node:sqlite`.
- Schema changes: add a new numbered file in `migrations/`, add it to the list in `test-d1.ts`, apply with `npm run db:migrate:local` (local) or `npm run db:migrate` (remote, manual).
