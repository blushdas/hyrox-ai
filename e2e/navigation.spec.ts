import { test, expect } from "@playwright/test"

// Root enters the app through the existing authentication gate.
for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`root enters the dashboard auth flow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard$/)
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible()
  })
}

test("sign-in remains directly accessible", async ({ page }) => {
  await page.goto("/sign-in")
  await expect(page.getByRole("button", { name: "Continue with Apple" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible()
})
