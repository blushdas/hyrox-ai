# Codex browser evidence

Run: 2026-11-10, Asia/Manila. Server: `npm run dev` in this worktree, localhost:3000.
Browser: Playwright MCP, visible controls exercised. No session cookies, OAuth tokens, or authenticated session were fabricated.

## Protected route attempts

Exact browser actions:
- R3: `await page.goto("http://localhost:3000/onboarding")`.
- R4: `await page.goto("http://localhost:3000/dashboard")`.
- R5: `await page.goto("http://localhost:3000/onboarding")`.
- R6: `await page.goto("http://localhost:3000/onboarding?redo=1")`.
- Profile: `await page.goto("http://localhost:3000/profile")`.

Literal observed URLs, respectively:
```
http://localhost:3000/sign-in?callbackUrl=%2Fonboarding
http://localhost:3000/sign-in?callbackUrl=%2Fdashboard
http://localhost:3000/sign-in?callbackUrl=%2Fonboarding
http://localhost:3000/sign-in?callbackUrl=%2Fonboarding%3Fredo%3D1
http://localhost:3000/sign-in?callbackUrl=%2Fprofile
```
Literal page output:
```
FINISHER
HYROX TRAINING
Sign in
Your HYROX plan, session by session.
Continue with Google
```
No application exception occurred on these route attempts. The observable blocker is Google authentication, not an unavailable browser. R3.png–R6.png record the authentication wall; they do not prove signed-in behavior. HUMAN_SECRET_NEEDED applies to those rows.

## Component fixture runtime

`calendar-harness.tsx.txt` preserves the exact temporary `/qa-date-picker` source, removed before final build and commit. To reproduce locally, copy it to `src/app/qa-date-picker/page.tsx`, run dev, then remove that route again. It renders the actual StepRace, ProfilePage, and DashboardPage components with local fixture data. It never creates an authenticated session. Only the calendar and dashboard presentation were tested here; save/regeneration and authenticated account flows were not claimed.

Actions: open Race Date; ArrowRight; Enter; reopen; Escape; Next month; select December 8; toggle Profile fixture; Edit race date; open Race date. Repeat at desktop 1280x900, mobile 375x812, and 320x740 with reduced motion.

Literal final Playwright assertion results:
```json
{"disabledPastDays":9,"arrowFocus":"2026-11-11","underFourWeeksBlocked":true,"escapeCloses":true,"exact28DaysAllowed":true,"bounds320":{"x":2,"y":128,"width":316,"height":348},"touchTarget":{"x":50,"y":208,"width":44,"height":44},"reducedMotionOpacity":"1"}
```
Screenshots: R8.png, R8-mobile.png, R8-profile.png, R8-profile-mobile.png, R8-profile-320-reduced.png. Past dates disabled; selected dates update the trigger; Enter closes; Escape returns to trigger; month grid stays within viewport. Under-four-week Continue/message verification used the fixture boundary controls; actual onboarding boundary logic also has unit coverage.

Dashboard fixture: actual heading `Build my plan`; actual link href `/onboarding?redo=1`. Clicking the visible link reached `http://localhost:3000/sign-in?callbackUrl=%2Fonboarding%3Fredo%3D1`. R5-empty-fixture.png proves empty-state presentation, not authenticated persistence.

## Console and network

`browser_console_messages({level:"error"})` returned this pre-existing development CSP issue:
```
eval() is not supported in this environment. If this page was served with a `Content-Security-Policy` header, make sure that `unsafe-eval` is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment.
React will never use eval() in production mode
```
Reduced-motion emulation also emitted Motion's expected development warning: `You have Reduced Motion enabled on your device. Animations may not appear as expected.`
`browser_network_requests({static:false})`: GET `/api/auth/session` 200 (twice), POST `/__nextjs_original-stack-frames` 200; no failed API requests observed.

Initial tooling attempts corrected during QA: Playwright sandbox rejected `require` with `ReferenceError: require is not defined`; removed the unnecessary import. An HMR refresh reset the fixture, causing `TimeoutError: locator.click: Timeout 30000ms exceeded` while waiting for `getByRole('button', { name: 'Race date', exact: true })`; reloaded the fixture and repeated the visible toggle/edit flow successfully. Browser availability was never blocked.
