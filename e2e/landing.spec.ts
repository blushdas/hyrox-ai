import { test, expect } from "@playwright/test"

// Root entry smoke checks after the existing auth gate.

test("page title is correct", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("Sign in — FINISHER")
})

test("no console errors on load", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible()
  expect(errors).toHaveLength(0)
})
