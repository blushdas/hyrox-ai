# Codex Goal

## Objective

Implement full open/pro HYROX training-plan wiring in `hyrox-ai` by adding `OPEN_PLAN_SESSIONS`/`PRO_PLAN_SESSIONS` data, `generateOpenPlan`/`generateProPlan` generators, branching `use-plan-generator.ts` on `profile.category`, and fixing the broken workout-card link, while preserving all existing beginner-category behavior.

## Parameters
- token_budget: 200000

## Constraints
- Preserve unrelated user changes in the worktree.
- Keep changes scoped to the handoff edit targets.
- Do not change public API behavior unless explicitly listed.
- Do not add dependencies unless explicitly justified.
- Document any verification blocker in the final response using the handoff's env labels.

## Done When
- OPEN_PLAN_SESSIONS and PRO_PLAN_SESSIONS exist in src/lib/hyrox-plan-data.ts, matching BEGINNER_PLAN_SESSIONS's shape, transcribed from docs/hyrox-source/{open,pro}.md.
- generateOpenPlan and generateProPlan exist in src/lib/mock-data.ts.
- use-plan-generator.ts branches on profile.category (beginner/open/pro), with a documented fallback to beginner for unmapped categories.
- session-card.tsx links to the real /session/[id] route (no /app prefix).
- Tests/build/manual verification pass, or blockers documented.
- Required Debrief written per the handoff spec.

## Source Handoff
- Handoff file: `/Users/troy/Documents/GitHub/hyrox-ai/.claude/worktrees/finisher-plan-population/docs/codex-handoff-2026-09-23.md`
