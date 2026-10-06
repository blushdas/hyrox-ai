# Codex Goal

## Objective

Close eight security and compliance gaps in hyrox-ai (FINISHER) so the app is ready for a public launch: stop storing third-party OAuth tokens, add security headers, add shared rate limiting and per-user quotas, add in-app account deletion with cascading foreign keys on the auth tables, reject cross-origin or non-JSON cookie-authenticated writes, turn on Worker log retention, clear the production dependency audit, and bind the native iOS sign-in code to a client-held secret (PKCE). Nothing a user sees in training or Coach changes, apart from a Delete account control on the profile page.

## Parameters
- token_budget: 600000

## Constraints
- Preserve unrelated user changes in the worktree.
- Keep changes scoped to the handoff edit targets.
- Do not change public API behavior of existing routes except where the handoff lists it.
- Do not add dependencies unless explicitly justified in the debrief.
- Document any verification blocker in the final response using the handoff's env labels.
- Do not run remote migrations or deploy.

## Done When
- Migrations apply locally on top of 0001-0003 with every existing row preserved.
- Each of the eight areas has Vitest coverage, including a test that fails if the control is removed.
- `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run build:ios`, and `npm audit --omit=dev --audit-level=high` pass, or blockers are documented.
- Required Debrief written per the handoff spec.

## Source Handoff
- Handoff file: `/Users/troy/.claude/worktrees/hyrox-ai-prod-hardening/docs/codex-handoff-2026-10-02.md`
