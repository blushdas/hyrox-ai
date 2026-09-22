import { test, expect } from "@playwright/test"

// ─── Smoke: landing page ─────────────────────────────────────────────────────
// Validates the public-facing page renders correctly before any interaction.
// If this breaks, every other test is meaningless.

test("page title is correct", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("FINISHER — HYROX Training App")
})

test("hero headline renders", async ({ page }) => {
  await page.goto("/")
  // h1 contains the hero copy
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your First HYROX")
})

test("alpha badge is visible", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Now in Alpha")).toBeVisible()
})

test("primary CTA is visible and points to #cta", async ({ page }) => {
  await page.goto("/")
  // There are two "Get Early Access" links — grab the hero one specifically
  const heroCta = page.getByRole("link", { name: "Get Early Access" }).first()
  await expect(heroCta).toBeVisible()
  await expect(heroCta).toHaveAttribute("href", "#cta")
})

test("desktop nav links are visible", async ({ page }) => {
  await page.goto("/")
  // Use the nav landmark to scope these so we don't hit the mobile overlay
  const nav = page.locator("header nav")
  await expect(nav.getByRole("link", { name: "Features" })).toBeVisible()
  await expect(nav.getByRole("link", { name: "App" })).toBeVisible()
})

test("no console errors on load", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  await page.goto("/")
  // Allow React hydration warnings but fail on real JS errors
  const jsErrors = errors.filter((e) => !e.includes("Warning:"))
  expect(jsErrors).toHaveLength(0)
})
