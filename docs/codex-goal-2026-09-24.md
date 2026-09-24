# Codex Goal

## Objective

Implement a dedicated, on-brand loading UI (full-screen overlay or modal) in FINISHER's `/onboarding` flow, by changing `src/app/onboarding/page.tsx` and adding a new loader component, while preserving the existing plan-generation logic, redirect timing, and all earlier onboarding steps.

## Parameters
- token_budget: 40000

## Constraints
- Preserve unrelated user changes in the worktree.
- Keep changes scoped to the handoff edit targets.
- Do not change public API behavior unless explicitly listed.
- Do not add dependencies unless explicitly justified.
- Document any verification blocker in the final response using the handoff's env labels.

## Done When
- Final onboarding step submit shows a dedicated loading overlay/modal (not just button text) with on-brand theme colors and at least one animated element.
- Loading UI clears automatically and the user lands on `/dashboard`, matching current redirect behavior exactly.
- Plan generation logic/timing/data and earlier onboarding steps are unchanged.
- `npm run build` passes with zero TypeScript errors.
- Required Debrief written per the handoff spec.

## Source Handoff
- Handoff file: `/Users/troy/.claude/worktrees/finisher-plan-loader/docs/codex-handoff-2026-09-24.md`
