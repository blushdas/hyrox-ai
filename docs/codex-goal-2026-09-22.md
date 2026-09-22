# Codex Goal

## Objective

Implement Capacitor iOS packaging in the FINISHER repo (`finisher`, branch `codex/finisher-capacitor-ios`) by adding `@capacitor/core`/`@capacitor/cli`/`@capacitor/ios`, a `capacitor.config.ts`, a new opt-in static-export build script, and a generated `ios/` Xcode platform project — while preserving the existing default `npm run build` / `npm run dev` behavior exactly as-is (no UI rewrite, no regression to `/api/waitlist`).

## Parameters
- token_budget: 60000

## Constraints
- Preserve unrelated user changes in the worktree.
- Keep changes scoped to the handoff edit targets.
- Do not change public API behavior of `/api/waitlist` or any existing route.
- Do not add dependencies beyond the three Capacitor packages unless explicitly justified.
- Document any verification blocker in the final response using the handoff's env labels (expect TOOLING_ABSENT for anything requiring macOS/Xcode/CocoaPods).

## Done When
- Capacitor deps installed, `capacitor.config.ts` written, `ios/` platform generated and committed.
- New static-export script builds cleanly; default `npm run build` is unchanged and still works.
- `npx cap sync ios` attempted with real output captured (success or explained failure).
- Tests/build/manual verification pass, or blockers documented per the handoff's Environment Expectations.
- Required Debrief written per the handoff spec.

## Source Handoff
- Handoff file: `/Users/troy/.claude/worktrees/finisher-capacitor-ios/docs/codex-handoff-2026-09-22.md`
