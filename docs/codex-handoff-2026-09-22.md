---
handoff_id: finisher-capacitor-ios-2026-09-22
project: finisher
repo: /Users/troy/.claude/worktrees/finisher-capacitor-ios
branch: codex/finisher-capacitor-ios
acceptance_ids: [R1, R2, R3, R4, R5, R6, R7]
verification_commands: ["npm install", "npm run build", "npm run build:ios", "npx cap sync ios"]
edit_targets: [package.json, package-lock.json, next.config.ts, capacitor.config.ts, "src/app/(app)/session/[id]/page.tsx", .gitignore]
env_blockers_expected: [TOOLING_ABSENT]
handed_off_at: 2026-09-22T00:00:00Z
---

# Codex Implementation Handoff

## Goal

Wrap the existing FINISHER Next.js app (no UI rewrite) in Capacitor so it can be built and shipped as a native iOS app. Add the Capacitor packages, a `capacitor.config.ts`, a new opt-in static-export build path, generate the `ios/` Xcode platform project, and get `npx cap sync ios` copying the built web assets into it. The default web app (`npm run dev` / `npm run build` / `npm run start`) must keep working exactly as it does today — this is additive.

## Current State

- Repo: `/Users/troy/.claude/worktrees/finisher-capacitor-ios`
- Branch: `codex/finisher-capacitor-ios`
- Worktree: clean, freshly checked out from `origin/main` @ `8b76614`
- Stack: Next.js 16 App Router, TypeScript, Tailwind v4, Zustand 5, React 19
- No Capacitor packages installed yet. No `ios/` folder yet. No live Vercel deployment (no `.vercel/` link) — there is no hosted URL to point Capacitor's remote-URL mode at, so this must use static export, not remote loading.
- Route tree (all confirmed via direct read, `App.tsx`-equivalent is Next.js file-based routing — no separate router file):
  - `/` — `src/app/page.tsx` (landing, server component wrapper)
  - `/onboarding` — `src/app/onboarding/page.tsx` (`"use client"`)
  - `/dashboard` — `src/app/(app)/dashboard/page.tsx` (`"use client"`)
  - `/plan` — `src/app/(app)/plan/page.tsx` (`"use client"`)
  - `/profile` — `src/app/(app)/profile/page.tsx` (`"use client"`)
  - `/session/[id]` — `src/app/(app)/session/[id]/page.tsx` (`"use client"`, dynamic segment, reads id via `use(params)` at line 60)
  - `/api/waitlist` — `src/app/api/waitlist/route.ts` (`GET`/`POST`, does real filesystem read/write against `data/waitlist.json` via Node `fs` — this is a real server route, not static-export compatible)
- Root layout: `src/app/layout.tsx` — renders `<StoreHydrator />` (client component at `src/components/shared/store-hydrator.tsx`) which calls `useAthleteStore.persist.rehydrate()` / `usePlanStore.persist.rehydrate()` in a `useEffect`. Group layout `src/app/(app)/layout.tsx` wraps app routes in `<PlanGuard>` + nav components.
- Stores: `src/stores/athlete-store.ts`, `src/stores/plan-store.ts` — both zustand `persist` with `skipHydration: true`.
- Confirmed via full-repo grep: zero usage of `cookies()`, `headers()`, `redirect()`, `notFound()`, `revalidatePath`, `revalidateTag`, `unstable_noStore`, or `export const dynamic/runtime/revalidate` anywhere under `src/app`. The only thing blocking a plain static export is the `/api/waitlist` route (server-only) and the missing `generateStaticParams` on `/session/[id]`.
- `public/` has only the 5 default Next.js scaffold SVGs, unreferenced anywhere in app code — no asset-path work needed there.

## User Intent

Wants: a real, installable iOS build of the existing app via Capacitor, App Store-eligible later. Does not want: a UI rewrite, React Native, or any change to how the web app currently builds/deploys. Context: this is additive tooling on top of a Next.js app that already works — treat the web build path as sacred, don't touch its behavior.

## Relevant Files

- `next.config.ts` — currently empty/default config; needs a second, opt-in export path for the iOS build without changing the default `npm run build`.
- `package.json` — add capacitor deps + a new build script (e.g. `build:ios`) that does NOT replace the existing `build` script.
- `src/app/(app)/session/[id]/page.tsx` — only dynamic route in the app; has no `generateStaticParams`, will break a static export build as-is.
- `src/app/api/waitlist/route.ts` — do not modify; it's fine for the web build, just excluded from the static-export bundle (Next.js will fail to statically export a Node-runtime route with a `POST` handler that does file I/O — that's expected and correct, not a bug to fix).
- `src/components/shared/store-hydrator.tsx`, `src/stores/*.ts` — read-only reference for confirming hydration still works after static export; don't need to change unless you find a real breakage.

## Edit Targets

- `package.json`
  - Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` as dependencies (cli likely devDependency).
  - Add a new script, e.g. `"build:ios": "..."` — do NOT rename, remove, or change the behavior of the existing `"build"` script.
- `package-lock.json` — updated by `npm install`.
- `capacitor.config.ts` (new file) — `appId` (reverse-DNS, e.g. `ai.hyrox.finisher`), `appName: "FINISHER"`, `webDir` pointing at wherever the static export lands (Next.js default export dir is `out/`).
- `next.config.ts` — add the static-export configuration as something that only applies to the iOS build path (e.g. gated by an env var checked at config-eval time, or a separate config file/script), so the plain `npm run build` keeps behaving exactly as it does today (still includes a working `/api/waitlist`).
- `src/app/(app)/session/[id]/page.tsx` — add `generateStaticParams()` (or restructure so the route survives static export) so the export build doesn't fail on this page. Use your judgment on the exact approach — e.g. a static params list derived from mock/plan data, or converting param-reading to not require server-side param resolution. Document whichever you pick in the debrief.
- `.gitignore` — add `ios/Pods`, `ios/DerivedData`, `ios/build` (generated/vendored — don't commit these); the `ios/` platform project files themselves (`App.xcodeproj`, `Info.plist`, etc., from `npx cap add ios`) DO get committed.
- New `ios/` directory — generated by `npx cap add ios`, commit it.

## Decisions Already Made

- Decision: static export mode (`output: 'export'`), not Capacitor's remote-URL mode. Reason: no live deployment exists to point a remote URL at.
- Decision: the static-export build path is a NEW, separate, opt-in script — never the default `npm run build`. Reason: the app has a real server API route (`/api/waitlist`) that the web deploy still needs; breaking the default build would regress production.
- Decision: no native plugins (push, biometrics, camera) this pass. Reason: not requested, keep scope tight.

## Assumptions

- (Claude inference — verify before relying on it) The waitlist form/CTA inside the packaged iOS app either gets hidden/disabled or simply fails silently since there's no server behind the static bundle — this is accepted as a known gap, not something to work around with a client-side fake. If you have a cleaner idea (e.g. just leave it as-is since it'll only 404/network-error, no crash), that's fine — document what actually happens.
- (Claude inference) `npx cap sync ios`'s CocoaPods step and any `xcodebuild` step probably cannot run in your build environment (no macOS/Xcode there). Attempt them anyway, capture the literal output/error, and don't fabricate a pass.

## Hard Constraints

- Preserve unrelated user changes in the worktree.
- Do not refactor outside the edit targets.
- Do not change public API shapes or remove/modify `src/app/api/waitlist/route.ts` behavior.
- Do not add new dependencies beyond the three Capacitor packages (plus their own transitive deps) unless explicitly justified in the debrief.
- Never let the default `npm run build` regress — verify it after your changes, not just before.

## Implementation Guidance

- Non-binding; acceptance criteria override — document conflicts in the debrief.
- A common, simple pattern: keep `next.config.ts`'s base export unconditional-safe by reading an env var (e.g. `process.env.CAPACITOR_BUILD === '1'`) to toggle `output: 'export'` only when set, and have the new npm script set that env var before calling `next build`.
- For `generateStaticParams` on `/session/[id]`: look at `src/lib/mock-data.ts` / `src/lib/hyrox-plan-data.ts` for whatever session IDs already exist in the mock plan data, and generate params from that.

## Acceptance Criteria

- R1: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` installed and present in `package.json`. — Evidence: package.json diff + `npm install` exit 0.
- R2: `capacitor.config.ts` exists with `appId`, `appName: "FINISHER"`, and a `webDir` that matches the actual static export output folder. — Evidence: file contents + the export script's output directory matching.
- R3: the new static-export build script succeeds (exit 0) and produces a populated output directory. — Evidence: command + exit code + `ls` of the output dir.
- R4: `ios/` platform folder exists (from `npx cap add ios`) and is committed on this branch. — Evidence: `git log --stat` showing the ios/ files, or `git status` showing them tracked.
- R5: `npx cap sync ios` either completes successfully, or fails with a specific, captured error (expected if this environment lacks CocoaPods/Xcode) — never silently skipped. — Evidence: full command output pasted into the debrief.
- R6: the debrief documents the exact command sequence Troy needs to run locally (on his own Mac, with real Xcode + CocoaPods) to finish building and boot the iOS Simulator — since this build environment likely can't do that itself. — Evidence: a copy-pasteable command block in the debrief's Known Gaps section.
- R7: the existing web app is unregressed — `npm run dev` and `npm run build` (the DEFAULT script, unchanged) both still work exactly as before, including `/api/waitlist`. — Evidence: both commands run after your changes, output/exit codes pasted into the debrief.

## Verification

```bash
npm install
npm run build          # must still be the normal Next.js server build, unchanged behavior
npm run build:ios       # (or whatever you name the new script) — static export
npx cap sync ios
```

Expected: `npm run build` behaves exactly as it did before your changes (server build, `/api/waitlist` intact). The new export script produces a static `out/`-equivalent directory. `cap sync ios` either succeeds or fails with a captured, explained error (likely CocoaPods-related in a non-macOS build environment).

If `npx cap sync ios` or any Xcode-dependent step cannot run at all in this environment: explain why (exact error), and don't attempt to fake it.

## Checkit Targets

- Route: `/dashboard`, `/onboarding`, `/plan`, `/profile`, `/session/[id]`, `/` — all should still render correctly under `npm run dev` (unchanged web behavior).
- Visual element: n/a — no new UI, this is build tooling only.
- Source behavior: `capacitor.config.ts` exists, `ios/App/App.xcodeproj` exists.
- Commands: `npm run build` → exit 0. `npm run build:ios` → exit 0. `npx cap sync ios` → exit 0 or captured failure.

## Browser QA (Codex-side)

This handoff has no new user-facing behavior to click through — it's build tooling. Instead of UI QA:

1. Run `npm run dev` and confirm `/dashboard`, `/onboarding`, `/plan`, `/profile`, `/session/<some-id>` still load without console errors (use your browser tooling if available; otherwise `curl` each route and confirm 200 + expected HTML markers).
2. That's the regression check for R7 — no auth needed, no QA credentials required for this task.

## Environment Expectations

Standard labels: HUMAN_SECRET_NEEDED · DB_NOT_LINKED · MIGRATION_NOT_APPLIED · DEPLOY_DEFERRED · NO_BROWSER_SESSION · GIT_AUTH_BLOCKED · TOOLING_ABSENT

- TOOLING_ABSENT: this build environment almost certainly lacks macOS/Xcode/CocoaPods, which blocks actually compiling or booting the iOS Simulator. Get as far as you can (package install, config files, `cap add ios`, attempt `cap sync ios`), document the literal failure point, and hand the rest to Troy as exact commands. This is expected — not a failure on your part.

## GitNexus Gates

- GitNexus MCP server did not connect this session (TOOLING_ABSENT) — recon for this handoff was done via direct file reads/grep instead. No impact-analysis gate to run before editing.

## Known Risks And Blockers

- This build environment likely cannot run `pod install` (CocoaPods) or `xcodebuild` — R5/R6 are expected to end up partially manual. That's fine, don't force a false pass.
- `data/waitlist.json` currently has one real-looking test email in it — untouched by this task, just noting it exists in the repo now.

## Required Debrief

Before ending, write `docs/codex-debrief-<YYYY-MM-DD-HHMMSS>.md` containing exactly:

- `# Codex Implementation Debrief`
- `## Source Handoff` — lines `- Handoff:`, `- Goal:`, `- Branch:`, `- Date:`, `- Supersedes:` (prior debrief path for this handoff, or `none`)
- `## Original Goal` · `## What Was Implemented` · `## Files Changed` — plain English, no bare R-IDs without explanation
- `## Goal Coverage` — one row per R-ID above: `# | Acceptance Criterion | Status | Evidence-Type | Evidence`. Status ∈ ✅ Done / ⚠️ Partial / ❌ Not done. Evidence-Type ∈ runtime|build|test|curl|static|manual_blocked|unverified. ✅ Done requires real evidence, never `static`/`unverified` alone for behavior-level rows.
- `## Verification` — each command, actual output, PASS/FAIL/SKIPPED.
- `## Known Gaps / Risks` — env labels first (`expected` or `new`), each with the minimum missing capability, the exact action to unblock it, and the expected result once unblocked.
- `## Deliberately Left` — anything knowingly left broken/deferred, pre-existing vs introduced. `None` allowed but must be stated.
- `## Falsification Test` — weakest-evidence criterion + the smallest test most likely to disprove it.
- `## Claude Pickup Notes` — exactly 3 items, priority-ordered.
- `## Suggested /checkit Inputs` (`- [ ]` items)
