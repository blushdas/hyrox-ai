import { test, expect } from "@playwright/test"

// ─── Navigation flows ────────────────────────────────────────────────────────
// Tests that routing works: header links land on the right pages.

test("Sign In link navigates to /sign-in", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Sign In" }).click()
  await expect(page).toHaveURL(/\/sign-in/)
})

test("App nav link navigates to /onboarding", async ({ page }) => {
  await page.goto("/")
  const appLink = page.locator("header nav").getByRole("link", { name: "App" })
  await appLink.click()
  await expect(page).toHaveURL(/\/onboarding/)
})

test("mobile menu opens and closes", async ({ page }) => {
  // Simulate mobile viewport
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  // Desktop nav is hidden — hamburger is visible
  const hamburger = page.getByRole("button", { name: "Open menu" })
  await expect(hamburger).toBeVisible()

  // Open menu
  await hamburger.click()
  // Close button appears
  const closeBtn = page.getByRole("button", { name: "Close menu" })
  await expect(closeBtn).toBeVisible()
  // Mobile nav links render at large font size
  await expect(page.getByRole("link", { name: "Features" }).nth(1)).toBeVisible()

  // Close menu
  await closeBtn.click()
  await expect(closeBtn).not.toBeVisible()
})
