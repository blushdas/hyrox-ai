---
handoff_id: finisher-plan-loader-2026-09-24
project: finisher
repo: /Users/troy/.claude/worktrees/finisher-plan-loader
branch: codex/finisher-plan-loader
acceptance_ids: [R1, R2, R3, R4, R5]
verification_commands: ["npm run build"]
edit_targets: [src/app/onboarding/page.tsx, src/components/app/onboarding/plan-loader.tsx]
env_blockers_expected: []
handed_off_at: 2026-09-24T00:00:00-00:00
---

# Codex Implementation Handoff

## Goal

Replace the current "Building your plan..." button-text-only loading state in FINISHER's onboarding flow with a dedicated, on-brand loading UI (full-screen overlay or modal) that appears when the user submits the final onboarding step, stays visible while the plan generates, and disappears automatically once the user is routed to the existing post-generation destination.

## Current State

- Repo: `/Users/troy/.claude/worktrees/finisher-plan-loader` (worktree of `hyrox-ai`)
- Branch: `codex/finisher-plan-loader`
- Worktree: clean
- Actual route: `/onboarding` (verified in `src/app/onboarding/page.tsx`)
- Route evidence: `src/app/onboarding/page.tsx:35` — `export default function OnboardingPage()`
- Available UI primitives: shadcn/ui components under `src/components/ui/`, `framer-motion` is an installed dependency (check `package.json`), Tailwind v4 with `@theme` tokens in `src/app/globals.css`
- Existing behavior / Problem:
  - `src/app/onboarding/page.tsx` has a `loading` boolean state (line ~42).
  - `handleNext()` (line ~62) sets `loading = true` on the final step, calls `setProfile(profile)`, `generatePlan(profile)`, `setOnboardingComplete(true)`, then `setTimeout(() => router.push("/dashboard"), 800)`.
  - The only visible feedback today is the submit `Button` at line ~193-196: `disabled={!validateStep() || loading}` and its label flips to `"Building your plan..."` when `loading` is true. The rest of the multi-step form (`StepRace`, `StepFitness`, `StepBiometrics`, `StepAvailability`, `StepAssessment`) stays rendered underneath.
  - Theme tokens live in `src/app/globals.css`: `--background: #0A0A0A`, `--primary: #22C55E`, `--accent: #22C55E`, `--ring: #22C55E` (both light/dark CSS custom-property blocks). Use `var(--background)` / `var(--primary)` (or the Tailwind classes that map to them, e.g. `bg-background`, `text-primary`, `bg-primary`) — do not hardcode a different hex than what's already in globals.css.

## User Intent

Wants: a real loading screen (overlay/modal) with on-brand styling and at least one animated element, shown while the plan builds, then auto-dismissed on redirect. | Does not want: any change to plan generation logic/timing/data, any change to earlier onboarding steps, any new redirect target. | Context: this is a small, self-contained UX polish item pulled from a longer FINISHER roadmap (subdomain, iOS build, Expo, mobile UI pass are separate, out of scope here).

## Relevant Files

- `src/app/onboarding/page.tsx` — owns the `loading` state and the final-step submit handler; this is where the loading UI gets triggered/rendered.
- `src/app/globals.css` — source of truth for theme tokens (background/primary/accent colors) the loading UI must use.
- `package.json` — confirm `framer-motion` availability for animation before adding any new dependency.

## Edit Targets

- `src/app/onboarding/page.tsx`
  - When `loading` becomes `true` (final-step submit), render a dedicated loading UI component that visually covers the form (full-screen fixed overlay, or a modal) instead of relying only on the button's disabled/label state.
  - Keep the existing `setProfile` / `generatePlan` / `setOnboardingComplete` / `router.push("/dashboard")` sequence and timing exactly as-is — do not change when or how the redirect fires.
  - Existing button `disabled={!validateStep() || loading}` behavior and steps 1-5 (`validateStep()`, `handleNext()` for non-final steps, `STEP_LABELS`, step navigation) must remain unchanged.
- `src/components/app/onboarding/plan-loader.tsx` (new file, name is a suggestion — pick something that fits the existing `src/components/app/onboarding/` naming convention used by `StepRace`, `StepFitness`, etc.)
  - A self-contained component rendering the full-screen/modal loading UI: on-brand background/accent colors from the theme tokens, at least one animated element (e.g. a spinner, pulsing text, or a simple framer-motion animation), no props beyond what's needed to show/hide it.
  - Import and conditionally render it from `page.tsx` based on the existing `loading` state — no new global state needed.

## Decisions Already Made

- Decision: Loading UI is UI-only — no change to plan generation logic, `generate4DayPlan()`, or the plan-store. Reason: goal explicitly scopes this to visual feedback, not generation behavior.
- Decision: Reuse existing `loading` boolean and existing redirect timing rather than introducing new state/timers. Reason: minimizes risk of touching the working generation/redirect flow.
- Decision: Animation can be cosmetic/timed rather than tied to real generation progress. Reason: explicitly out of scope per goal.

## Assumptions

- (Claude inferences — Codex validates before relying on these.)
- Assume `/onboarding` requires no auth today (no `middleware.ts` found, no session guard found in `page.tsx` or `src/app/layout.tsx`) — verify this still holds before writing Browser QA steps; if a guard exists, note it as a risk in the debrief rather than skipping QA.
- Assume `framer-motion` is already a dependency (referenced in project memory) — confirm in `package.json` before using it; if absent, use a plain CSS/Tailwind animation instead of adding a new dependency.

## Hard Constraints

- Preserve unrelated user changes in the worktree.
- Do not refactor outside the edit targets.
- Do not change public API shapes or database schema unless explicitly listed (none listed here).
- Do not add new dependencies unless explicitly justified (framer-motion, if already installed, does not count as new).

## Implementation Guidance

- Non-binding; acceptance criteria override — document conflicts in the debrief.
- Prefer shadcn primitives already installed where they fit (e.g. `Button` from `@/components/ui/button`) but a loading overlay likely needs a plain styled `div`, not a shadcn Dialog, since it must appear/disappear based on the existing `loading` boolean, not a controlled open/close dialog pattern — use your judgment on the simplest correct implementation.
- A believable but simple pattern: fixed, full-viewport `div` with `bg-background`, centered content (logo/spinner + short copy like "Building your plan..."), rendered conditionally right before the closing tag of the page's root element when `loading` is true.

## Acceptance Criteria

- R1: Submitting the final onboarding step shows a dedicated loading UI (full-screen overlay or modal) that covers/replaces the form — not just a button label swap. — Evidence: screenshot showing the overlay/modal covering the form + the component's source (new file or clearly separated JSX block) proving it is a distinct element, not just conditional button text.
- R2: The loading UI uses FINISHER's theme (background/primary colors from `globals.css` tokens) and includes at least one animated element (spinner, pulsing text, or progress indicator). — Evidence: source showing themed classes/vars + screenshot or short screen recording showing motion.
- R3: The loading UI disappears automatically once plan generation finishes, and the user lands on the same destination the app already redirects to today (`/dashboard`). — Evidence: browser QA — submit onboarding, observe overlay, observe it clear and URL become `/dashboard`.
- R4: Plan generation logic/timing/data (`generate4DayPlan()`, plan-store) is untouched. — Evidence: `git diff` shows no changes outside `src/app/onboarding/page.tsx` and the new loader component (plus its import).
- R5: All other onboarding steps, validation, and "Continue"/"Build My Plan" button behavior work exactly as before. — Evidence: browser QA walking steps 1-5 with the existing validation rules, confirming no regression.

## Verification

```bash
npm run build
```

Expected: exit code 0, zero TypeScript errors.
If verification cannot run: explain why and state the fallback.

## Checkit Targets

- Route: `/onboarding`
- Visual element: dedicated loading overlay/modal visible between the final step's submit action and the `/dashboard` redirect
- Source behavior: `src/app/onboarding/page.tsx` `handleNext()` (final-step branch) + new loader component
- Commands: `npm run build` → exit 0

## Browser QA (Codex-side)

You have browser tooling (Playwright MCP / bundled browser). USE IT — do not defer behavior verification to Claude. Before writing the debrief:

1. Dev server: start `npm run dev` in this worktree (default port 3000 — check `package.json` if it differs).
2. Auth: read `QA_EMAIL` / `QA_PASSWORD` from `.env.local` if `/onboarding` turns out to require a session (assumption above says it likely does not — verify first).
3. For R1, R2, R3, R5: drive the actual onboarding flow in the browser (fill steps 1-5, submit), observe the loading UI, observe the redirect, save a screenshot to `docs/qa/finisher-plan-loader-2026-09-24/R<n>.png` for each.
4. Cite each as Evidence-Type `runtime`: screenshot path + what was observed.

NO_BROWSER_SESSION is only valid WITH attempt evidence — the exact command run and its literal error output. An unattempted browser check is `unverified`, never `manual_blocked`.

## Environment Expectations

Standard labels: HUMAN_SECRET_NEEDED · DB_NOT_LINKED · MIGRATION_NOT_APPLIED · DEPLOY_DEFERRED · NO_BROWSER_SESSION · GIT_AUTH_BLOCKED · TOOLING_ABSENT

- None expected — this is a UI-only change with no auth gate found on `/onboarding` and no DB/data dependency.

Rule: a coverage row blocked by an env class = ⚠️ Partial with that label as Evidence-Type `manual_blocked` — never ✅ Done. Behavior-level criteria are never ✅ Done on static evidence alone.

Rule: NO_BROWSER_SESSION must be EARNED, never pre-declared. Do not list it here as expected — the Browser QA section above is the default path. It enters the debrief only with the failed command + error output attached.

## GitNexus Gates

- Before editing each Edit Target symbol: `gitnexus impact <symbol>` (CLI). Halt on HIGH/CRITICAL and report in debrief.
- Repo not indexed or CLI absent → log TOOLING_ABSENT in Known Gaps and continue. Not a hard blocker.
- Do NOT run detect-changes — it is not a CLI command. Claude runs it during /checkit.

## Known Risks And Blockers

- Local `main` in the original checkout is 1 commit ahead of `origin/main` (an unpushed Expo-shell commit, `feat(mobile): add Expo shell for phone testing`). This branch was correctly cut from `origin/main`, not local `main` — unrelated to this task, no action needed here.

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
