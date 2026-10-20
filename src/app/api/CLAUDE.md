# app/api

Route handlers (Cloudflare Worker runtime, no Node-only modules).

- `me/*`: authenticated user data (profile, plan, plan sessions, threads, messages, account). Wrap mutations in `guardedMutation` from `me/guards.ts`; reads use `authenticated` from `@/lib/api/validate`. Validate bodies with helpers in `@/lib/api/validate`. Each route has a sibling `route.test.ts`.
- `coach-ai`: streaming chat. Order matters: `guardMutation` (origin + JSON type) -> session -> request parse -> rate limit -> upstream fetch. First upstream token is awaited before returning so failures can still be a 502. Errors after streaming starts become a generic `error` frame.
- `auth/[...nextauth]` and `native-auth/*`: Auth.js handlers and the PKCE code exchange used by the iOS shell. See `src/lib/auth/`.
- Secrets and bindings come from `getCloudflareContext()` then `process.env`; never return or log them.
- `src/proxy.ts` guards page routes only. API routes must check auth themselves.
- These folders are excluded from the iOS static build (`scripts/build-ios.ts`).
