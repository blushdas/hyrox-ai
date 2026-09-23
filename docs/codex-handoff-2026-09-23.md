---
handoff_id: hyrox-ai-plan-population-2026-09-23
project: hyrox-ai
repo: /Users/troy/Documents/GitHub/hyrox-ai/.claude/worktrees/finisher-plan-population
branch: codex/hyrox-ai-plan-population
acceptance_ids: [R1, R2, R3, R4, R5, R6]
verification_commands: ["npm run build"]
edit_targets: [src/lib/hyrox-plan-data.ts, src/lib/mock-data.ts, src/hooks/use-plan-generator.ts, src/components/app/session-card.tsx]
env_blockers_expected: []
handed_off_at: 2026-09-23T00:00:00+08:00
---

# Codex Implementation Handoff

## Goal

Wire the app's real HYROX training-plan knowledge base (all three tiers: beginner, open, pro — already transcribed and merged into `docs/hyrox-source/{beginner,open,pro}.md`) fully into the app. Today only the beginner plan is wired in; open and pro users silently get the beginner plan regardless of their actual profile category. Separately, every workout card in the app currently links to a broken URL, so clicking any workout shows nothing. Fix both: convert open.md and pro.md into the same structured TypeScript session format beginner already uses, make the plan generator actually pick the right plan for the user's category, and fix the broken workout-card link so every workout — beginner, open, or pro — opens to a fully populated detail page.

## Current State

- Repo: `/Users/troy/Documents/GitHub/hyrox-ai/.claude/worktrees/finisher-plan-population`
- Branch: `codex/hyrox-ai-plan-population`
- Worktree: clean
- Actual route: `/session/[id]` — verified in `src/app/(app)/session/[id]/page.tsx` (the `(app)` folder is a Next.js route group; parentheses are stripped from the URL, so there is NO `/app` prefix in the real route).
- Route evidence: `src/components/app/session-card.tsx:19` — `<Link href={\`/app/session/${session.id}\`}>` — this is wrong. It should be `/session/${session.id}`.
- Available UI primitives: shadcn/ui components already installed under `src/components/ui/`.
- Existing behavior / Problem / Work already done by Claude:
  - `src/lib/hyrox-plan-data.ts` has `BEGINNER_PLAN_SESSIONS: RawSession[]` — a hand-authored, verified-faithful transcription of `docs/hyrox-source/beginner.md`, 60 entries (12 weeks x 5 days/week). This is the reference pattern to copy for open and pro.
  - `src/lib/mock-data.ts` has `generateBeginnerPlan(_raceDate: string): WeekPlan[]` which reads `BEGINNER_PLAN_SESSIONS`, groups by week, and maps each `RawSession` through `makeSession(...)` (which fills in `warmup`/`cooldown` template blocks keyed by `SessionType`, and parses the raw `workout` string array into structured `ExerciseSet[]` via `parseWorkoutLine`). This parsing/templating machinery is generic — it does NOT need to change. Only the raw session data source changes per plan.
  - `src/hooks/use-plan-generator.ts`'s `generatePlan()` currently always calls `generateBeginnerPlan(...)`, full stop — it does not look at `profile.category` at all.
  - `docs/hyrox-source/open.md` and `docs/hyrox-source/pro.md` are on `main`, fully transcribed, same markdown structure as `beginner.md` (`## Week N — {Phase}` → `### {Day} — {session category}` → `**Workout:**` bullets → `**Notes:**` bullets). `pro.md` contains exactly 2 lines marked `[illegible — redacted with solid red bar in source PDF]` in Week 1 (Thursday Hyrox Power block, and Friday Hyrox Foundation block) — these are genuine redactions in the source PDF, not a transcription error. Handle them the same way `BEGINNER_PLAN_SESSIONS` would handle a missing workout line (e.g. omit that line from the `workout` array, or use a short placeholder string like `"(redacted in source)"` — your call, just don't crash or fabricate exercise content for those two spots).

## User Intent

Wants: every workout card, for every plan tier, to open to a real populated page — "don't keep anything blank." | Does not want: a giant new AI system — this reuses the exact same static-data pattern beginner already uses, just extended to the other two tiers. | Context: this is a fitness training app; incorrect or missing workout data is a real user-facing defect, not cosmetic.

## Relevant Files

- `src/lib/hyrox-plan-data.ts` — where `OPEN_PLAN_SESSIONS` and `PRO_PLAN_SESSIONS` get added, following `BEGINNER_PLAN_SESSIONS`'s exact shape.
- `src/lib/mock-data.ts` — where `generateOpenPlan()` and `generateProPlan()` get added, mirroring `generateBeginnerPlan()`.
- `src/hooks/use-plan-generator.ts` — where the category branch gets added.
- `src/components/app/session-card.tsx` — where the broken link gets fixed.
- `src/lib/types.ts` — read-only reference: `SessionType` union (`"engine_builder" | "threshold" | "stations" | "race_sim" | "recovery" | "rest"`) and `RawSession`/`WeekPlan`/`Session`/`ExerciseSet` types. Do not change this file — map each real HYROX session category (e.g. "Hyrox Foundation", "Hyrox Power", "Hyrox Engine", "Hyrox Complete", "Hyrox Aerobic") onto the existing `SessionType` values the same way `BEGINNER_PLAN_SESSIONS` already does (check how beginner's data maps its categories to `type: "stations" | "race_sim" | "engine_builder" | "recovery"` etc. — follow the same mapping logic for open/pro's session categories, since the UI's `sessionTypeColors` map in `src/lib/theme.ts` only knows these existing values).
- `src/app/(app)/session/[id]/page.tsx` — read-only reference: this is what actually renders a session; confirms what "populated" means (non-empty warmup/mainSet/cooldown/coachNote).
- `docs/hyrox-source/open.md`, `docs/hyrox-source/pro.md` — source content to transcribe into TypeScript.

## Edit Targets

- `src/lib/hyrox-plan-data.ts`
  - Add `export const OPEN_PLAN_SESSIONS: RawSession[] = [...]` — full 12-week x 5-day transcription of `docs/hyrox-source/open.md`, same field shape as `BEGINNER_PLAN_SESSIONS` (`week`, `day`, `type`, `phase`, `title`, `duration`, `notes`, `workout`).
  - Add `export const PRO_PLAN_SESSIONS: RawSession[] = [...]` — same, from `docs/hyrox-source/pro.md`.
  - Do not modify `BEGINNER_PLAN_SESSIONS` or any existing exports.
- `src/lib/mock-data.ts`
  - Add `export function generateOpenPlan(_raceDate: string): WeekPlan[]` — identical structure to `generateBeginnerPlan`, reading `OPEN_PLAN_SESSIONS` instead of `BEGINNER_PLAN_SESSIONS`.
  - Add `export function generateProPlan(_raceDate: string): WeekPlan[]` — same, reading `PRO_PLAN_SESSIONS`.
  - Reuse `makeSession`, `parseWorkoutLine`, `getPhaseInfo` as-is — do not duplicate or fork this logic.
- `src/hooks/use-plan-generator.ts`
  - Branch `generatePlan()` on `profile.category`: `"beginner"` → `generateBeginnerPlan`, `"open"` → `generateOpenPlan`, `"pro"` → `generateProPlan`.
  - Any other value (including `"doubles"`, which has no real source data) falls back to `generateBeginnerPlan`, with an inline comment explaining why (no DOUBLES source data exists yet) — this must be an explicit, documented branch, not a silent default that looks accidental.
- `src/components/app/session-card.tsx`
  - Fix the `Link href` on line 19 from `` `/app/session/${session.id}` `` to `` `/session/${session.id}` ``.

## Decisions Already Made

- Decision: use the existing static-data + generator-function pattern (no new AI/LLM call, no new data store) for open and pro, exactly like beginner. Reason: user explicitly said "we don't need anything giant right now, just need something to show" and the existing pattern already works well for beginner.
- Decision: DOUBLES category falls back to the beginner plan rather than erroring or showing nothing. Reason: no real source data exists for doubles; silently crashing or blanking the page is worse than showing a real (if wrong-tier) plan, as long as the fallback is documented in code.

## Assumptions
- (Claude inference — validate before relying on this) Every session category string in open.md/pro.md maps cleanly onto the existing `SessionType` union the same way beginner's categories do. If a category doesn't have an obvious existing mapping, pick the closest existing `SessionType` (do not add a new one — that would require touching `types.ts` and `theme.ts`, which are out of scope) and note the mapping choice in the debrief.
- (Claude inference) `profile.category` on the athlete/profile store already has values matching `"beginner" | "open" | "pro"` (and possibly `"doubles"`) — verify the actual type/values in the profile store before writing the branch logic; do not guess the exact string literals.

## Hard Constraints

- Preserve unrelated user changes in the worktree.
- Do not refactor outside the edit targets.
- Do not change public API shapes or database schema unless explicitly listed. (This app has no DB — n/a.)
- Do not add new dependencies unless explicitly justified.
- Do not touch iOS/Capacitor files, auth, or any route outside the workout/session/plan flow.

## Implementation Guidance

- Non-binding; acceptance criteria override — document conflicts in the debrief.
- Follow `BEGINNER_PLAN_SESSIONS`'s exact formatting/indentation style in `hyrox-plan-data.ts` for consistency — it's the pattern reviewers will diff against.
- The `parseWorkoutLine` regex parser in `mock-data.ts` already handles most HYROX workout-line formats (set x reps, distance-first, duration, etc.) — no changes needed there, but sanity-check a sample of open/pro's more unusual lines render sensibly through it during Browser QA (rather than showing raw garbled text).

## Acceptance Criteria

- R1: A profile.category "open" user's generated plan contains real HYROX open-level workouts (from OPEN_PLAN_SESSIONS/open.md), not beginner content. — Evidence: code showing the branch + a browser screenshot of an open-category plan/session with visibly different exercise content than beginner's Week 1 Day 1.
- R2: A profile.category "pro" user's generated plan contains real HYROX pro-level workouts (from PRO_PLAN_SESSIONS/pro.md), not beginner content. — Evidence: same, for pro.
- R3: Tapping any workout card (beginner, open, or pro) navigates to `/session/[id]` and renders non-empty title, warmup, main set, cooldown, and coach note. — Evidence: browser screenshots for at least one session per tier.
- R4: Existing beginner-category behavior is unchanged — dashboard, plan generation, and session detail pages work exactly as before. — Evidence: browser walkthrough of a beginner-category profile end-to-end, screenshot.
- R5: An unmapped/doubles category still produces a working (beginner-fallback) plan, not a crash or blank page. — Evidence: code showing the explicit fallback branch + comment; browser screenshot if you can set profile.category to an unmapped value via the onboarding flow or dev tools.
- R6: `npm run build` passes with zero errors. — Evidence: full command output, exit code 0.

## Verification

```bash
npm run build
```

Expected: exit code 0, zero TypeScript errors.

If verification cannot run: explain why and state the fallback.

## Checkit Targets

- Route: `/session/[id]` (real route, no `/app` prefix)
- Visual element: workout title + warmup/main-set/cooldown blocks visible between the sticky header ("Back" button) and the "Mark Complete"/"Mark as pending" action buttons at the bottom of `src/app/(app)/session/[id]/page.tsx`
- Source behavior: `src/hooks/use-plan-generator.ts` `generatePlan()` — category branch
- Commands: `npm run build` → exit 0

## Browser QA (Codex-side)

You have browser tooling (Playwright MCP / bundled browser). USE IT — do not defer behavior verification to Claude. Before writing the debrief:

1. Dev server: start it in this worktree (`npm run dev`; port 3000, default — no override in `package.json`).
2. Auth: none required. This app has no login — `(app)` routes are gated only by a client-side `PlanGuard` component reading Zustand-persisted onboarding state. Complete onboarding in-browser (pick category beginner/open/pro as needed) to reach the dashboard.
3. For EVERY behavior-level acceptance criterion (R1, R2, R3, R4, R5): drive the actual flow in the browser, observe the result, save a screenshot to `docs/qa/hyrox-ai-plan-population-2026-09-23/R<n>.png`.
4. Cite each as Evidence-Type `runtime`: screenshot path + what was observed.

NO_BROWSER_SESSION is only valid WITH attempt evidence — the exact command run and its literal error output. An unattempted browser check is `unverified`, never `manual_blocked`.

## Environment Expectations

Standard labels: HUMAN_SECRET_NEEDED · DB_NOT_LINKED · MIGRATION_NOT_APPLIED · DEPLOY_DEFERRED · NO_BROWSER_SESSION · GIT_AUTH_BLOCKED · TOOLING_ABSENT

None expected. This app has no auth, no DB, no deploy step for this change. If browser QA is genuinely unavailable in your environment, label NO_BROWSER_SESSION with the attempted command and its literal error output — do not pre-declare it.

Rule: a coverage row blocked by an env class = ⚠️ Partial with that label as Evidence-Type `manual_blocked` — never ✅ Done. Behavior-level criteria are never ✅ Done on static evidence alone.

## GitNexus Gates

- Before editing each Edit Target symbol: `gitnexus impact <symbol>` (CLI). Halt on HIGH/CRITICAL and report in debrief.
- Repo not indexed or CLI absent → log TOOLING_ABSENT in Known Gaps and continue. Not a hard blocker.
- Do NOT run detect-changes — it is not a CLI command. Claude runs it during /checkit.

## Known Risks And Blockers
- Session-category-to-SessionType mapping for open/pro is a judgment call (see Assumptions) — if a category doesn't map cleanly, document the choice made rather than guessing silently.
- `pro.md` has 2 genuine source-PDF redactions in Week 1 — do not fabricate content for those lines.

## Required Debrief

Before ending, write `docs/codex-debrief-<YYYY-MM-DD-HHMMSS>.md` containing exactly:

- `# Codex Implementation Debrief`
- `## Source Handoff` — lines `- Handoff:`, `- Goal:`, `- Branch:`, `- Date:`, `- Supersedes:` (prior debrief path for this handoff, or `none`)
- `## Original Goal` · `## What Was Implemented` · `## Files Changed` — `What Was Implemented` is written in plain English for a reader who never saw the handoff: what the change does in product terms and how the pieces fit, not a commit-log paraphrase. No bare R-IDs or internal shorthand without one clause saying what they mean.
- `## Goal Coverage` — one row per handoff R-ID, columns `# | Acceptance Criterion | Status | Evidence-Type | Evidence`. Status ∈ ✅ Done / ⚠️ Partial / ❌ Not done. Evidence-Type ∈ runtime|build|test|curl|static|manual_blocked|unverified. HARD RULE: ✅ Done with Evidence-Type `static` or `unverified` is invalid — downgrade to ⚠️ Partial. A build passing proves compilation, not behavior. Behavior-level rows cite `runtime` evidence from the Browser QA section (screenshot path + observed result); `manual_blocked` on a browser-verifiable row requires the attempted command + literal error output.
- `## Verification` — each command with actual output + PASS/FAIL/SKIPPED verdict. "Tests passed" without the command and output is not evidence.
- `## Known Gaps / Risks` — env labels first, each tagged `expected (manifest)` or `new`; every blocked row states the minimum missing capability/state, the exact verification action once unblocked, and the expected observable result. Adjacent product risks on separate `Residual product risk:` lines.
- `## Deliberately Left` — everything knowingly left broken, duplicated, dead, failing, or deferred (in or out of scope), each marked pre-existing vs introduced. `None` allowed but must be stated.
- `## Falsification Test` — the acceptance criterion with the weakest evidence + the smallest adversarial test most likely to disprove it: setup, action, expected result, likely failure mode.
- `## Claude Pickup Notes` — exactly 3 items, priority-ordered: inspect what, look for what discrepancy, what finding fails acceptance.
- `## Suggested /checkit Inputs` (`- [ ]` items)
