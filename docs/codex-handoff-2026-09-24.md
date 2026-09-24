---
handoff_id: finisher-landing-split-2026-09-24
project: finisher
repo: /Users/troy/.claude/worktrees/finisher-landing-split
branch: codex/finisher-landing-split
acceptance_ids: [R1, R2, R3, R4, R5, R6]
verification_commands: ["npm run build", "grep -rn \"components/landing\" src/", "grep -rn \"api/waitlist\" src/"]
edit_targets: [src/app/page.tsx, src/components/landing/header.tsx, src/components/landing/hero.tsx, src/components/landing/social-proof.tsx, src/components/landing/features.tsx, src/components/landing/cta-section.tsx, src/components/landing/footer.tsx, src/components/landing/app-preview.tsx, src/components/landing/waitlist-form.tsx, src/app/api/waitlist/route.ts, data/waitlist.json, src/lib/auth/protected-routes.test.ts, e2e/navigation.spec.ts]
env_blockers_expected: []
handed_off_at: 2026-09-24T10:30:15Z
---

# Codex Implementation Handoff

## Goal

The FINISHER marketing landing page is being extracted to a separate, standalone repo (handled outside this task). This repo (the app, package name `finisher`) needs to stop owning any landing/marketing code. Remove the landing component tree, the waitlist API and its data file, and repoint the root route ("/") so it drops the visitor straight into the app instead of a marketing page.

## Current State

- Repo: `/Users/troy/.claude/worktrees/finisher-landing-split` (worktree of `hyrox-ai`)
- Branch: `codex/finisher-landing-split`
- Worktree: clean (freshly branched off `origin/main` @ `818e2ce`)
- Actual route: root `/` renders `src/app/page.tsx` directly — verified by reading the file, it imports and renders `LandingHeader`, `Hero`, `SocialProof`, `Features`, `CtaSection`, `Footer` from `@/components/landing/*`.
- Route evidence: `src/app/page.tsx:1-23`
- No `middleware.ts` exists in this repo. There IS a `src/proxy.ts` (Next.js routing-middleware convention) that gates `/dashboard`, `/onboarding`, `/plan`, `/profile`, `/session`, `/sign-in` — its matcher does NOT include `/api/waitlist`, confirming that route is already public/unprotected today. Do not edit `src/proxy.ts` — nothing in its matcher needs to change for this task.
- Existing precedent for a root-style redirect already lives in this repo at `scripts/ios-app-entry.tsx` — a client component that does `useEffect` + `mounted` guard + `router.replace("/dashboard")`. This is the pattern to mirror for the new `src/app/page.tsx`.
- Available UI primitives: shadcn components already installed under `@/components/ui/*` (not needed for this task — no new UI).

## User Intent

Wants: this app repo to have zero marketing/landing surface area left in it, with root route sending visitors into the real app.
Does not want: a new auth-gating mechanism invented, middleware added, or any change to `src/auth.ts`, `src/proxy.ts` matcher, Zustand store internals, or Capacitor/iOS build config.
Context: the marketing site itself is being rebuilt in a brand-new, separate repo (not part of this task) that will own the deleted landing components and waitlist form/API going forward. This task only removes them from here.

## Relevant Files

- `src/app/page.tsx` — currently the landing page; becomes the root redirect.
- `src/components/landing/*.tsx` — the entire landing component tree, deleted in full (header, hero, social-proof, features, cta-section, footer, app-preview, waitlist-form). `cta-section.tsx` imports `./waitlist-form` internally — both go together, no external consumer of any of these files exists outside `src/app/page.tsx`.
- `src/app/api/waitlist/route.ts` — GET/POST route reading/writing `data/waitlist.json`. Deleted.
- `data/waitlist.json` — the flat-file waitlist store. Deleted.
- `src/components/landing/waitlist-form.tsx` — client component that `fetch`es `POST /api/waitlist`. Deleted along with the rest of `landing/`.
- `src/lib/auth/protected-routes.test.ts` — has a `test.each` row asserting `/api/waitlist` is NOT a protected route. Once the route is gone, this row is stale and must be removed (the rest of the test file, which covers the routes still in `src/proxy.ts`'s matcher, stays).
- `e2e/navigation.spec.ts` — lines ~6-10 test the landing header's "Sign In" link. Once the landing header is deleted, this test targets a component that no longer exists — update or remove that specific test case; do not delete the whole file if it covers other, still-valid navigation behavior.
- `scripts/ios-app-entry.tsx` — reference pattern only, do not modify.

## Edit Targets

- `src/app/page.tsx`
  - Replace the entire file with a client component that mirrors `scripts/ios-app-entry.tsx`: `"use client"`, `useEffect` + `mounted` state, then a second `useEffect` that calls `router.replace("/dashboard")` once mounted. Return `null`.
  - Remove all six `@/components/landing/*` imports.
- `src/components/landing/` (whole directory)
  - Delete `header.tsx`, `hero.tsx`, `social-proof.tsx`, `features.tsx`, `cta-section.tsx`, `footer.tsx`, `app-preview.tsx`, `waitlist-form.tsx`.
- `src/app/api/waitlist/route.ts`
  - Delete the file and, if now empty, the `src/app/api/waitlist/` directory.
- `data/waitlist.json`
  - Delete the file. Leave the rest of `data/` (if anything else lives there) untouched.
- `src/lib/auth/protected-routes.test.ts`
  - Remove only the `/api/waitlist` row from the `test.each` array (and its assertion if it's a standalone case). Leave every other row/test untouched.
- `e2e/navigation.spec.ts`
  - Remove or rewrite the test case (around lines 6-10) that clicks/checks the landing header's "Sign In" link, since that header no longer exists. If the file has other navigation tests unrelated to the landing header, leave them as-is.

## Decisions Already Made

- Decision: root route redirects to `/dashboard` unconditionally (client-side), not to a sign-in check. Reason: no server-side auth gate exists on app routes today (verified — no `middleware.ts`, no `auth()` call anywhere under `src/app/(app)` or `src/app/onboarding`), and `PlanGuard` (`src/components/app/plan-guard.tsx`) already redirects to `/onboarding` client-side if no plan exists. Inventing a new auth check here would be scope creep and a second competing mechanism.
- Decision: waitlist API + data file are deleted outright, not preserved or proxied. Reason: the waitlist form was marketing-site-only; it is being rebuilt in the new landing repo, which will have its own backend for it.
- Decision: `src/app/app/` (an empty, unrelated directory) and the top-level `src/app/onboarding/page.tsx` (distinct from `(app)/onboarding`, pre-existing duplication) are explicitly NOT touched by this task — out of scope, do not clean up or consolidate them here even if they look related.

## Assumptions

- (Claude inference) `data/` has no other files besides `waitlist.json` that need preserving — verify this before deleting the directory itself; only delete `waitlist.json`, leave the directory if anything else is in it.
- (Claude inference) No other test files besides `protected-routes.test.ts` and `e2e/navigation.spec.ts` reference landing/waitlist — validate this yourself with a repo-wide grep before finishing, since new files may have been added since this handoff was written.

## Hard Constraints

- Preserve unrelated user changes in the worktree.
- Do not refactor outside the edit targets.
- Do not change public API shapes or database schema.
- Do not add new dependencies.
- Do not touch `src/auth.ts`, `src/proxy.ts`, `src/stores/*`, `capacitor.config.ts`, or `scripts/build-ios.ts`.
- Do not touch `src/app/app/` or the top-level `src/app/onboarding/page.tsx`.

## Implementation Guidance

- Non-binding; acceptance criteria override — document conflicts in the debrief.
- Match `scripts/ios-app-entry.tsx` exactly in structure for the new `src/app/page.tsx` (don't add extra loading UI or styling — this is a redirect stub, not a page).

## Acceptance Criteria

- R1: Loading "/" redirects to "/dashboard" client-side, mirroring `scripts/ios-app-entry.tsx`'s pattern (mounted-guarded `useEffect` + `router.replace`), with no server-side auth check added. — Evidence: `src/app/page.tsx` content diff + browser screenshot of "/" landing on `/dashboard`.
- R2: No file under `src/components/landing/` exists anymore, and nothing in `src/` imports from that path. — Evidence: `ls src/components/landing` (No such file or directory) + `grep -rn "components/landing" src/` (no output).
- R3: `src/app/api/waitlist/route.ts` and `data/waitlist.json` no longer exist; nothing in `src/` references `/api/waitlist`. — Evidence: file-not-found checks + `grep -rn "api/waitlist" src/` (no output).
- R4: `npm run build` passes with zero errors and no new warnings. — Evidence: build command output, exit code 0.
- R5: `/dashboard`, `/plan`, `/profile`, `/session/[id]`, `/onboarding` (both copies), and `/sign-in` behave exactly as before. — Evidence: browser screenshots or console-clean navigation to each.
- R6: No new dependency added; `src/auth.ts`, `src/stores/*`, Capacitor config untouched. — Evidence: `git diff --stat` shows no changes to those paths, `package.json`/`package-lock.json` diff is empty.

## Verification

```bash
npm run build
grep -rn "components/landing" src/
grep -rn "api/waitlist" src/
ls src/app/api/waitlist 2>&1
ls data/waitlist.json 2>&1
```

Expected: build exits 0 with no errors; both greps produce no output; both `ls` checks report "No such file or directory".
If verification cannot run: explain why and state the fallback.

## Checkit Targets

- Route: `/` (root)
- Visual element: nothing marketing-related should render; the page should immediately navigate to `/dashboard`
- Source behavior: `src/app/page.tsx` — mirrors `scripts/ios-app-entry.tsx`
- Commands: `npm run build` → exit 0

## Browser QA (Codex-side)

You have browser tooling — use it, do not defer to Claude.

1. Dev server: start `npm run dev` in this worktree (port 3000, no `-p` flag in `package.json`).
2. Auth: read `QA_EMAIL` / `QA_PASSWORD` from `.env.local` if any flow needs sign-in (this task's own changes don't require signing in, but the "commands not to break" list does — spot-check at least `/sign-in` loads).
3. For R1: load `/` and observe/screenshot that it redirects to `/dashboard`.
4. For R5: load each of `/dashboard`, `/plan`, `/profile`, `/session/[id]` (pick any existing session id from mock data), `/onboarding`, `/sign-in` and screenshot each, watching the console for new errors.
5. Save screenshots to `docs/qa/finisher-landing-split-2026-09-24/R<n>.png`.

NO_BROWSER_SESSION is only valid WITH attempt evidence — the exact command run and its literal error output.

## Environment Expectations

None expected — this is a pure file-deletion + client-redirect change, no DB, no external API, no secrets involved.

## GitNexus Gates

GitNexus was unavailable when this handoff was written (`TOOLING_ABSENT`); recon was done via an Explore subagent instead (targeted grep across the repo for `components/landing` and `api/waitlist` references, plus a repo-wide search confirming no `middleware.ts` exists). Not a hard blocker — proceed with the Edit Targets above as the source of truth.

## Known Risks And Blockers

- `e2e/navigation.spec.ts` will fail post-deletion if its landing-header test case isn't updated — this is called out explicitly in Edit Targets, don't miss it.
- Multiple stale, uncommitted worktrees exist elsewhere in this repo's worktree set (leftover QA scratch from a prior, already-merged checkit run) that happen to touch some of the same file paths (`e2e/navigation.spec.ts`, `src/components/landing/header.tsx`, `src/lib/auth/protected-routes.test.ts`). They were confirmed dead (HEAD already fully merged into `main`, uncommitted contents are QA screenshots) and pose no real merge risk to this branch — noted here for awareness only, no action needed.

## Required Debrief

Before ending, write `docs/codex-debrief-<YYYY-MM-DD-HHMMSS>.md` containing exactly:

- `# Codex Implementation Debrief`
- `## Source Handoff` — lines `- Handoff:`, `- Goal:`, `- Branch:`, `- Date:`, `- Supersedes:` (prior debrief path for this handoff, or `none`)
- `## Original Goal` · `## What Was Implemented` · `## Files Changed` — plain English, no bare R-IDs without explanation.
- `## Goal Coverage` — one row per R-ID: `# | Acceptance Criterion | Status | Evidence-Type | Evidence`. Status ∈ ✅ Done / ⚠️ Partial / ❌ Not done. Evidence-Type ∈ runtime|build|test|curl|static|manual_blocked|unverified. ✅ Done requires non-static evidence for any behavior-level row (R1, R5).
- `## Verification` — each command with actual output + PASS/FAIL/SKIPPED.
- `## Known Gaps / Risks` — env labels first (expected vs new), then residual product risk lines.
- `## Deliberately Left` — anything knowingly left broken/deferred, pre-existing vs introduced. `None` allowed but must be stated.
- `## Falsification Test` — the weakest-evidence criterion + smallest adversarial test to disprove it.
- `## Claude Pickup Notes` — exactly 3 items, priority-ordered.
- `## Suggested /checkit Inputs` (`- [ ]` items)
