# Codex Goal

## Objective

Implement the removal of all marketing/landing code from the `finisher` app repo by changing `src/app/page.tsx` into a root redirect and deleting `src/components/landing/*`, `src/app/api/waitlist/route.ts`, and `data/waitlist.json`, while preserving every existing app route's behavior unchanged.

## Parameters
- token_budget: 40000

## Constraints
- Preserve unrelated user changes in the worktree.
- Keep changes scoped to the handoff edit targets.
- Do not add a new auth-gating mechanism — mirror `scripts/ios-app-entry.tsx`'s existing redirect pattern.
- Do not add dependencies unless explicitly justified.
- Do not touch `src/auth.ts`, `src/proxy.ts`, `src/stores/*`, Capacitor config.
- Document any verification blocker in the final response using the handoff's env labels.

## Done When
- Root route "/" redirects to "/dashboard" instead of rendering marketing content.
- `src/components/landing/`, `src/app/api/waitlist/`, and `data/waitlist.json` no longer exist.
- `src/lib/auth/protected-routes.test.ts` and `e2e/navigation.spec.ts` no longer reference deleted code.
- `npm run build` passes clean.
- Existing app routes verified unaffected in the browser.
- Required Debrief written per the handoff spec.

## Source Handoff
- Handoff file: `/Users/troy/.claude/worktrees/finisher-landing-split/docs/codex-handoff-2026-09-24.md`
