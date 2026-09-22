import { test, expect } from "@playwright/test"

// ─── Onboarding flow ─────────────────────────────────────────────────────────
// 5-step form: Race Details → Fitness Baseline → About You → Availability → Assessment
// Tests the happy path navigation and state progression.

test("loads step 1 with correct label", async ({ page }) => {
  await page.goto("/onboarding")
  // Step label from STEP_LABELS array — exact match avoids the breadcrumb "Race Details ·"
  await expect(page.getByText("Race Details", { exact: true }).first()).toBeVisible()
})

test("progress indicator starts at step 1 of 5", async ({ page }) => {
  await page.goto("/onboarding")
  // The step counter text rendered in the onboarding header
  await expect(page.getByText(/1\s*\/\s*5|Step 1/i)).toBeVisible()
})

test("back button is not visible on step 1", async ({ page }) => {
  await page.goto("/onboarding")
  // ChevronLeft back button should be absent or disabled on first step
  const backBtn = page.getByRole("button", { name: /back/i })
  // Either not present or not visible
  await expect(backBtn).not.toBeVisible()
})

test("continue button is present", async ({ page }) => {
  await page.goto("/onboarding")
  // Next/continue button to advance steps
  // Exact match — avoids matching the "Open Next.js Dev Tools" button injected in dev mode
  const continueBtn = page.getByRole("button", { name: "Continue" })
  await expect(continueBtn).toBeVisible()
})
