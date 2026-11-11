# Round 3 browser evidence

Local component fixture only; no session fabricated. Reused localhost:3000, PID 38033, cwd confirmed as this worktree. Temporary source preserved in modal-harness.tsx.txt; routed fixture removed before final checks.

Actions: page.goto(http://localhost:3000/qa-modal), click Race Date, press Tab 15 times and Shift+Tab 15 times; assert focus remains in dialog after every press; inspect aria-modal and inert ancestor of Background action; capture desktop 1280x900 and mobile 375x812; Escape; inspect active element and restored background.

Final literal Playwright result:
```
{"modal":true,"inert":true,"tabCycles":30,"closed":true,"restored":"Race Date","backgroundRestored":true}
```
R8-modal.png and R8-modal-mobile.png show the open calendar. The first implementation's modal test returned inert:false; fixed portal-mount timing with a callback ref/state and reran successfully. Property-setting was subsequently changed to equivalent DOM setAttribute/removeAttribute APIs to satisfy React immutability lint.

Protected route attempts: page.goto(http://localhost:3000/onboarding), /dashboard, /profile. Observed respectively:
```
http://localhost:3000/sign-in?callbackUrl=%2Fonboarding
http://localhost:3000/sign-in?callbackUrl=%2Fdashboard
http://localhost:3000/sign-in?callbackUrl=%2Fprofile
Continue with Google
```
Screenshots R3-auth.png, R4-auth.png, R6-auth.png. HUMAN_SECRET_NEEDED; authenticated R3–R6 remain Partial. No browser failure claimed. An early modal attempt timed out after HMR/build activity: TimeoutError: locator.evaluate: Timeout 30000ms exceeded, waiting for getByRole('dialog'); fresh navigation and completed final assertions above supersede it.

Browser console reports the pre-existing development CSP error: eval() is not supported in this environment. React will never use eval() in production mode. No new runtime exception observed in the final modal interactions. Prior round2 empty-state and round1 calendar boundary screenshots remain in place.
