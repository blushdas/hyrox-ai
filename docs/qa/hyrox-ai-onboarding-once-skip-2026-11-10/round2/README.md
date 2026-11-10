# Round 2: completed account without a plan

Fix queue: remove endless skeletons on Plan, Coach AI, and Session detail using the dashboard's plan-building card as one shared component. No authenticated session fabricated.

Server reuse verified by `lsof -a -p 3127 -d cwd`: `/Users/troy/.claude/worktrees/hyrox-ai-profile-plan-sync`; localhost:3000.

## Authenticated-route attempts

Playwright `await page.goto("http://localhost:3000" + route)` for each route:
- `/plan` → `http://localhost:3000/sign-in?callbackUrl=%2Fplan`
- `/coach-ai` → `http://localhost:3000/sign-in?callbackUrl=%2Fcoach-ai`
- `/session/missing-session` → `http://localhost:3000/sign-in?callbackUrl=%2Fsession%2Fmissing-session`

Literal UI: `Continue with Google`. No application exception occurred on these route attempts; Google authentication blocks signed-in verification. Screenshots: plan-auth.png, coach-auth.png, session-auth.png. HUMAN_SECRET_NEEDED remains expected.

## Actual page-component runtime fixture

The temporary public `/qa-no-plan` route rendered the actual PlanPage, CoachPage, SessionDetailPage, and DashboardPage. Fixture state: profile null, plan null, onboardingComplete true; syncStatus toggled by visible Ready fixture/Loading fixture buttons. It set no user ID, session cookie, OAuth token, or auth API mock. Source preserved as `no-plan-harness.tsx.txt`; route removed before final verification/commit.

Exact interaction sequence: open `/qa-no-plan`; click Ready fixture; for each Show Plan, Show Coach AI, Show Session, Show Train button, observe the page heading and Build my plan heading; inspect visible link href; capture desktop/mobile screenshots; click Loading fixture; observe role=status and no empty card; capture loading screenshot; click Ready fixture; observe the card again. Finally click the actual Build my plan link.

Playwright assertion results:
```
Plan: ready=Build my plan; href=/onboarding?redo=1; loading=role=status; settledAgain=Build my plan
Coach AI: ready=Build my plan; href=/onboarding?redo=1; loading=role=status; settledAgain=Build my plan
Session: ready=Build my plan; href=/onboarding?redo=1; loading=role=status; settledAgain=Build my plan
Train: ready=Build my plan; href=/onboarding?redo=1; loading=role=status; settledAgain=Build my plan
visibleLinkClick=http://localhost:3000/sign-in?callbackUrl=%2Fonboarding%3Fredo%3D1
```
Desktop: 1280x900. Mobile: 375x812. For each page, `<Title>-desktop.png`, `<Title>-mobile.png`, `<Title>-loading.png`; Coach AI filename uses Coach-AI. Screenshots show shared heading/card, full-width readable copy, visible plan-building action, and loading skeleton. Coach-AI-mobile.png visually inspected with view_image.

## Console and network inspection

`browser_console_messages({level:"error"})`:
```
eval() is not supported in this environment. If this page was served with a Content-Security-Policy header, make sure that unsafe-eval is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment.
React will never use eval() in production mode
Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://localhost:3000/api/me/threads:1
```
The first is the existing development CSP/debugging limitation. The second is expected in this explicitly unauthenticated component fixture: actual Coach AI mount tries its existing GET threads request. No auth was forged to hide that failure; authenticated history behavior is outside this fix. Network inspection confirmed `/api/auth/session` 200, `/api/me/threads` 401, and redo navigation 307 followed by sign-in 200. No mutations made to real account data.

## Reproduction

Copy `no-plan-harness.tsx.txt` to `src/app/qa-no-plan/page.tsx` in a local checkout, run dev, drive controls above, then remove the temporary route and run `node node_modules/next/dist/bin/next typegen`. For signed-in integration: have Troy authenticate a skipped account with no plan, open each affected route, and follow Build my plan through explicit redo.
